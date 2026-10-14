import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fomowfqnswrsvuwzxmix.supabase.co",
  "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1",
);

function sanitizePhoneForEmail(phone) {
  const digits = String(phone || "").replace(/[^0-9]/g, "").replace(/^0+/, "");
  return digits || "customer";
}

function sanitizeNameForEmail(name) {
  const clean = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  return clean || "customer";
}

function getCustomerEmail() {
  const savedEmail = localStorage.getItem("agori_customer_email")?.trim();
  if (savedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(savedEmail)) {
    return savedEmail;
  }

  const phone = sessionStorage.getItem("agori_customer_phone")?.trim();
  const name = localStorage.getItem("agori_customer_name")?.trim();
  const safePhone = sanitizePhoneForEmail(phone);
  const safeName = sanitizeNameForEmail(name);
  const generatedEmail = `${safePhone || safeName}@agori.com`;
  localStorage.setItem("agori_customer_email", generatedEmail);
  return generatedEmail;
}

function getLoggedInCustomer() {
  const phone = sessionStorage.getItem("agori_customer_phone")?.trim();
  if (!phone) return null;

  return {
    id: phone,
    phone,
    name: localStorage.getItem("agori_customer_name") || "Customer",
    email: getCustomerEmail(),
  };
}

const params = new URLSearchParams(window.location.search);
const bookId = params.get("bookId");

const detailTitle = document.getElementById("detailTitle");
const detailPrice = document.getElementById("detailPrice");
const detailDescription = document.getElementById("detailDescription");
const detailStatus = document.getElementById("detailStatus");
const detailCover = document.getElementById("detailCover");
const buyNowBtn = document.getElementById("buyNowBtn");

async function saveBookToLibrary(bookId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No authenticated user found");
  }

  const normalizedBookId = String(bookId);
  console.log("Attempting insert:", {
    userId: user.id,
    bookId: normalizedBookId,
  });

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

function getSafePdfUrl(pdfURL) {
  if (!pdfURL) return null;

  try {
    const url = new URL(pdfURL, window.location.href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

if (!bookId) {
  detailTitle.textContent = "Book not found";
  detailDescription.textContent = "This book page is missing a valid book reference.";
  detailStatus.textContent = "Please return to the book list.";
  buyNowBtn.disabled = true;
  throw new Error("Missing bookId");
}

const { data: book, error } = await supabase
  .from("books")
  .select("*")
  .eq("id", bookId)
  .maybeSingle();

if (error || !book) {
  detailTitle.textContent = "Book not found";
  detailDescription.textContent = "The selected book could not be loaded.";
  detailStatus.textContent = "Try another book from the list.";
  buyNowBtn.disabled = true;
  throw new Error(error?.message || "Book not found");
}

const { data: coverData } = supabase.storage
  .from("ebooks")
  .getPublicUrl(`covers/${book.coverFileName}`);

const { data: pdfData } = supabase.storage
  .from("ebooks")
  .getPublicUrl(`pdfs/${book.pdfFileName}`);

if (coverData?.publicUrl) {
  detailCover.src = coverData.publicUrl;
}

detailTitle.textContent = book.title;
detailPrice.textContent = `₦${book.price}`;
detailDescription.textContent =
  "This book is available for purchase from Dr. Agori Academic Clinic. Open the full book after payment and start reading immediately.";
detailStatus.textContent = "Secure payment • Instant access";

window.buyBook = async function (title, price, pdfURL, bookId) {
  const customer = getLoggedInCustomer();

  if (!customer) {
    const overlay = document.createElement("div");
    overlay.className = "auth-modal-overlay";
    const returnTo = window.location.href;
    overlay.innerHTML = `
      <div class="auth-modal">
        <button class="auth-close" type="button" aria-label="Close">×</button>
        <div class="auth-badge">🔒</div>
        <h3>Account required</h3>
        <p>You need to log in or create an account before buying this book.</p>
        <div class="auth-actions">
          <a href="login.html?returnTo=${encodeURIComponent(returnTo)}" class="auth-btn primary">Login</a>
          <a href="create-account.html?returnTo=${encodeURIComponent(returnTo)}" class="auth-btn success">Create Account</a>
          <a href="index.html" class="auth-btn secondary">Go to Books</a>
        </div>
      </div>
    `;

    const triggerRoll = (button, targetUrl) => {
      button.classList.remove("is-clicked");
      void button.offsetWidth;
      button.classList.add("is-clicked");
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 280);
    };

    overlay.querySelector(".auth-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.remove();
    });

    const loginBtn = overlay.querySelector(".auth-btn.primary");
    const createBtn = overlay.querySelector(".auth-btn.success");
    const booksBtn = overlay.querySelector(".auth-btn.secondary");

    loginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      triggerRoll(loginBtn, `login.html?returnTo=${encodeURIComponent(returnTo)}`);
    });

    createBtn.addEventListener("click", (event) => {
      event.preventDefault();
      triggerRoll(createBtn, `create-account.html?returnTo=${encodeURIComponent(returnTo)}`);
    });

    booksBtn.addEventListener("click", (event) => {
      event.preventDefault();
      triggerRoll(booksBtn, "index.html");
    });

    document.body.appendChild(overlay);
    return;
  }

  var handler = PaystackPop.setup({
    key: "pk_live_fca94bc76cc4f2d29b6fd08c79ab9e8780680dc1",
    email: customer.email,
    amount: price * 100,
    currency: "NGN",
    callback: function (response) {
      if (!response?.reference) {
        alert("Payment could not be completed.");
        return;
      }

      const safePdfUrl = getSafePdfUrl(pdfURL);
      if (!safePdfUrl) {
        alert("This book does not have a valid PDF link. Please contact support.");
        return;
      }

      void (async () => {
        try {
          await saveBookToLibrary(bookId);
        } catch (saveError) {
          console.error("Save to library failed:", saveError.message);
        }

        void fetch(
          "https://fomowfqnswrsvuwzxmix.supabase.co/functions/v1/send-book-email",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: customer.email,
              title,
              pdfUrl: pdfURL,
            }),
            keepalive: true,
          },
        ).catch((emailErr) => console.error("Email send failed:", emailErr));

        window.location.assign(safePdfUrl);
      })();

    },
    onClose: function () {
      alert("Payment window closed.");
    },
  });
  handler.openIframe();
};

buyNowBtn.addEventListener("click", () => {
  window.buyBook(book.title, Number(book.price), pdfData?.publicUrl, book.id);
});
