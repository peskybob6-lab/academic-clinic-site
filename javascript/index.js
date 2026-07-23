import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase client
const supabase = createClient(
  "https://fomowfqnswrsvuwzxmix.supabase.co",
  "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1"
);

// Load books
async function loadBooks() {
  const booksList = document.getElementById("booksList");
  booksList.innerHTML = "";

  const { data, error } = await supabase.from("books").select("*");
  if (error) {
    console.error("Error loading books:", error.message);
    return;
  }

  data.forEach(book => {
    const { data: coverData } = supabase.storage
      .from("ebooks")
      .getPublicUrl(`covers/${book.coverFileName}`);

    const { data: pdfData } = supabase.storage
      .from("ebooks")
      .getPublicUrl(`pdfs/${book.pdfFileName}`);

    const bookDiv = document.createElement("div");
    bookDiv.className = "book-card";
    bookDiv.innerHTML = `
      <img src="${coverData.publicUrl}" alt="Book Cover">
      <h3>${book.title}</h3>
      <p>₦${book.price}</p>
      <button class="buy-btn" onclick="buyBook('${book.title}', ${book.price}, '${pdfData.publicUrl}', '${book.id}')">
        Buy Now
      </button>
    `;
    booksList.appendChild(bookDiv);
  });
}

document.addEventListener("DOMContentLoaded", loadBooks);

// Drawer toggle
window.toggleDrawer = function() {
  const drawer = document.getElementById("drawer");
  drawer.style.left = drawer.style.left === "0px" ? "-250px" : "0px";
};

// Save book to library
async function saveBookToLibrary(bookId) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("No authenticated user found");
  }

  const normalizedBookId = String(bookId);
  console.log("Attempting insert:", { userId: user.id, bookId: normalizedBookId });

  const { data: existingRows, error: lookupError } = await supabase
    .from("user_books")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", normalizedBookId)
    .limit(1);

  if (lookupError) {
    throw new Error(`Lookup failed: ${lookupError.message}`);
  }

  if (existingRows && existingRows.length > 0) {
    console.log("Book already exists in library");
    return { created: false };
  }

  const { error: insertError } = await supabase
    .from("user_books")
    .insert([{ user_id: user.id, book_id: normalizedBookId }]);

  if (insertError) {
    console.error("Insert failed:", insertError);
    throw new Error(`Insert failed: ${insertError.message}`);
  }

  console.log("Insert succeeded");
  return { created: true };
}

// Buy book
window.buyBook = async function(title, price, pdfURL, bookId) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const choiceBox = document.createElement("div");
    choiceBox.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: #fff; border: 2px solid #007bff;
      padding: 20px; border-radius: 8px;
      text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 2000;
    `;
    choiceBox.innerHTML = `
      <p>You need an account to continue:</p>
      <a href="login.html" style="margin-right:15px; color:#007bff; font-weight:bold;">Login</a>
      <a href="create-account.html" style="color:#28a745; font-weight:bold;">Create Account</a>
    `;
    document.body.appendChild(choiceBox);
    return;
  }

  const openPdf = () => {
    if (!pdfURL) {
      alert("This book does not have a PDF available yet.");
      return;
    }
    const safePdfUrl = pdfURL.startsWith("http")
      ? pdfURL
      : new URL(pdfURL, window.location.href).toString();
    window.location.assign(safePdfUrl);
  };

  var handler = PaystackPop.setup({
    key: "pk_live_fca94bc76cc4f2d29b6fd08c79ab9e8780680dc1",
    email: user.email,
    amount: price * 100,
    currency: "NGN",
    callback: function(response) {
      if (!response?.reference) {
        alert("Payment could not be completed.");
        return;
      }
      // Open PDF immediately in the same tab
      openPdf();

      // Run verification, save and email in background
      (async () => {
        try {
          const verifyRes = await fetch("https://fomowfqnswrsvuwzxmix.supabase.co/functions/v1/paystack-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: response.reference })
          });
          const data = await verifyRes.json();

          const isVerified = 
            data?.data?.status === "success" || 
            data?.status === "success" ||
            data?.success === true;

          if (isVerified) {
            try {
              const saveResult = await saveBookToLibrary(bookId);
              console.log("Library save result:", saveResult);
            } catch (saveError) {
              console.error("Save to library failed:", saveError.message);
            }

            try {
              await fetch("https://fomowfqnswrsvuwzxmix.supabase.co/functions/v1/send-book-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, title, pdfUrl: pdfURL })
              });
            } catch (emailErr) {
              console.error("Email send failed:", emailErr);
            }
          }
        } catch (err) {
          console.error("Verification error:", err);
        }
      })();
    },
    onClose: function() {
      alert("Payment window closed.");
    }
  });
  handler.openIframe();
};

// Close drawer when clicking outside
document.addEventListener("click", function(event) {
  const drawer = document.getElementById("drawer");
  const menuBtn = document.querySelector(".menu-btn");
  if (drawer.style.left === "0px" && !drawer.contains(event.target) && !menuBtn.contains(event.target)) {
    drawer.style.left = "-250px";
  }
});

// Logout
window.logout = async function() {
  await supabase.auth.signOut();
  alert("You are now logged out!");
  window.location.href = "index.html";
};
