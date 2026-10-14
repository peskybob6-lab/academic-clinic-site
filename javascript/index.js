import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase client
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

function clearCustomerSessionState() {
  const phone = sessionStorage.getItem("agori_customer_phone")?.trim();
  if (phone) {
    localStorage.removeItem(`agori_customer_profile_image_${phone}`);
  }

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("agori_customer_")) {
      localStorage.removeItem(key);
    }
  }

  sessionStorage.removeItem("agori_customer_phone");
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

function setupBookSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchBtn");
  const booksList = document.getElementById("booksList");
  if (!searchInput || !searchButton || !booksList) return;

  let emptyState = document.getElementById("bookSearchEmpty");
  if (!emptyState) {
    emptyState = document.createElement("p");
    emptyState.id = "bookSearchEmpty";
    emptyState.setAttribute("role", "status");
    emptyState.textContent = "No books match your search. Try a different title or keyword.";
    emptyState.hidden = true;
    booksList.insertAdjacentElement("afterend", emptyState);
  }

  const filterBooks = () => {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const searchTerms = query.split(/\s+/).filter(Boolean);
    let visibleBooks = 0;

    booksList.querySelectorAll(".book-card").forEach((bookCard) => {
      const searchableText = bookCard.dataset.searchText || "";
      const matches = searchTerms.every((term) => searchableText.includes(term));
      bookCard.hidden = !matches;
      if (matches) visibleBooks += 1;
    });

    emptyState.hidden = visibleBooks > 0 || searchTerms.length === 0;
  };

  searchInput.addEventListener("input", filterBooks);
  searchButton.addEventListener("click", filterBooks);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") filterBooks();
  });
}

const BOOK_CATALOG_CACHE_KEY = "agori-book-catalog-v1";

function getCachedBooks() {
  try {
    const cachedBooks = JSON.parse(localStorage.getItem(BOOK_CATALOG_CACHE_KEY) || "null");
    return Array.isArray(cachedBooks) ? cachedBooks : null;
  } catch {
    return null;
  }
}

function renderBooks(books) {
  const booksList = document.getElementById("booksList");
  if (!booksList) return;

  booksList.innerHTML = "";

  books.forEach((book) => {
    const { data: coverData } = supabase.storage
      .from("ebooks")
      .getPublicUrl(`covers/${book.coverFileName}`);

    const { data: pdfData } = supabase.storage
      .from("ebooks")
      .getPublicUrl(`pdfs/${book.pdfFileName}`);

    const bookDiv = document.createElement("div");
    bookDiv.className = "book-card";
    bookDiv.dataset.searchText = Object.entries(book)
      .filter(([field]) => /title|author|category|subject|description|keyword|genre|publisher|isbn/i.test(field))
      .flatMap(([, value]) => Array.isArray(value) ? value : [value])
      .filter((value) => typeof value === "string" || typeof value === "number")
      .join(" ")
      .toLocaleLowerCase();
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

  const thankYouScene = document.querySelector(".thank-you-scene");
  if (thankYouScene) thankYouScene.style.display = "block";
}

async function loadBooks() {
  const cachedBooks = getCachedBooks();
  const thankYouScene = document.querySelector(".thank-you-scene");

  if (cachedBooks) {
    renderBooks(cachedBooks);
  } else if (thankYouScene) {
    thankYouScene.style.display = "none";
  }

  const { data, error } = await supabase.from("books").select("*");
  if (error) {
    console.error("Error loading books:", error.message);
    if (!cachedBooks && thankYouScene) thankYouScene.style.display = "block";
    return;
  }

  const books = Array.isArray(data) ? data : [];
  try {
    localStorage.setItem(BOOK_CATALOG_CACHE_KEY, JSON.stringify(books));
  } catch (cacheError) {
    console.warn("Could not cache book catalog:", cacheError);
  }
  renderBooks(books);
}

async function openBookFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("bookId");

  if (!bookId) return;

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();

  if (error || !data) {
    console.error("Book lookup failed:", error || "No book found");
    return;
  }

  const booksList = document.getElementById("booksList");
  if (!booksList) return;

  booksList.innerHTML = "";

  const { data: coverData } = supabase.storage
    .from("ebooks")
    .getPublicUrl(`covers/${data.coverFileName}`);

  const bookDiv = document.createElement("div");
  bookDiv.className = "book-card featured-book-card";
  bookDiv.innerHTML = `
    <img src="${coverData.publicUrl}" alt="Book Cover">
    <h3>${data.title}</h3>
    <p>₦${data.price}</p>
    <button class="buy-btn" onclick="buyBook('${data.title}', ${data.price}, '${supabase.storage.from("ebooks").getPublicUrl(`pdfs/${data.pdfFileName}`).data.publicUrl}', '${data.id}')">
      Buy Now
    </button>
  `;

  booksList.appendChild(bookDiv);

  const thankYouScene = document.querySelector(".thank-you-scene");
  if (thankYouScene) thankYouScene.style.display = "none";
}

document.addEventListener("DOMContentLoaded", async () => {
  setupAppInstallation();

  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    navigator.serviceWorker
      .register("./sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch((error) => console.error("Service worker update failed:", error));
  }

  setupBookSearch();
  await loadBooks();
  await openBookFromQuery();
});

function setupAppInstallation() {
  const installButton = document.getElementById("installAppButton");
  const installStatus = document.getElementById("installAppStatus");
  if (!installButton || !installStatus) return;

  let installPrompt = null;
  const isInstalled = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  if (isInstalled) {
    installButton.disabled = true;
    installButton.querySelector("span").textContent = "App Installed";
    installStatus.textContent = "Dr. Agori Academic Clinic is installed on this device.";
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.disabled = true;
    installButton.querySelector("span").textContent = "App Installed";
    installStatus.textContent = "Dr. Agori Academic Clinic is installed on this device.";
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      installStatus.textContent = "To install, open your browser menu and choose Install app or Add to Home Screen.";
      return;
    }

    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    installPrompt = null;

    installStatus.textContent = choice.outcome === "accepted"
      ? "Installation started. Follow your browser's confirmation to finish."
      : "Installation was cancelled. You can try again from your browser menu.";
  });
}

// Drawer toggle
window.toggleDrawer = function () {
  const drawer = document.getElementById("drawer");
  drawer.style.left = drawer.style.left === "0px" ? "-250px" : "0px";
};

// Save book to library
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

// Buy book
window.buyBook = async function (title, price, pdfURL, bookId) {
  const customer = getLoggedInCustomer();

  if (!customer) {
    const overlay = document.createElement("div");
    overlay.className = "auth-modal-overlay";
    overlay.innerHTML = `
      <div class="auth-modal">
        <button class="auth-close" type="button" aria-label="Close">×</button>
        <div class="auth-badge">🔒</div>
        <h3>Account required</h3>
        <p>You need to log in or create an account before buying this book.</p>
        <div class="auth-actions">
          <a href="login.html" class="auth-btn primary">Login</a>
          <a href="create-account.html" class="auth-btn success">Create Account</a>
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

    const loginBtn = overlay.querySelector('.auth-btn.primary');
    const createBtn = overlay.querySelector('.auth-btn.success');

    loginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      triggerRoll(loginBtn, "login.html");
    });

    createBtn.addEventListener("click", (event) => {
      event.preventDefault();
      triggerRoll(createBtn, "create-account.html");
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

// Close drawer when clicking outside
document.addEventListener("click", function (event) {
  const drawer = document.getElementById("drawer");
  const menuBtn = document.querySelector(".menu-btn");
  if (
    drawer.style.left === "0px" &&
    !drawer.contains(event.target) &&
    !menuBtn.contains(event.target)
  ) {
    drawer.style.left = "-250px";
  }
});

// Logout
window.logout = async function () {
  clearCustomerSessionState();

  await supabase.auth.signOut();
  alert("You are now logged out!");
  window.location.href = "index.html";
};


