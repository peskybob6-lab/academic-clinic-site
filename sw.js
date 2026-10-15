const CACHE_NAME = "agori-academic-clinic-v6";
const BOOK_COVER_CACHE = "agori-book-covers-v1";
const SUPABASE_STORAGE_ORIGIN = "https://fomowfqnswrsvuwzxmix.supabase.co";
const APP_SHELL = [
  "./",
  "./index.html",
  "./About-Us.html",
  "./admin2.html",
  "./boo.html",
  "./book-details.html",
  "./chat.html",
  "./Contact-Us.html",
  "./contact.html",
  "./create-account.html",
  "./customers-management.html",
  "./daily-upgrade.html",
  "./dashboard.html",
  "./delete-books.html",
  "./edit-books.html",
  "./Frequently-Asked-Questions.html",
  "./help.html",
  "./life-motivation.html",
  "./Link.html",
  "./live-chat.html",
  "./login.html",
  "./my-account.html",
  "./payment-history.html",
  "./Privacy-Policy.html",
  "./Terms-of-Use.html",
  "./cors.json",
  "./favicon.png",
  "./image.png",
  "./manifest.json",
  "./sw.js",
  "./css/css/style.css",
  "./css/css/about-us.css",
  "./css/css/admin2.css",
  "./css/css/boo.css",
  "./css/css/chat.css",
  "./css/css/contact-Us.css",
  "./css/css/contact.css",
  "./css/css/create-account.css",
  "./css/css/customer-management.css",
  "./css/css/daily-upgrade.css",
  "./css/css/dashboard.css",
  "./css/css/delete.css",
  "./css/css/edit.css",
  "./css/css/faq.css",
  "./css/css/help.css",
  "./css/css/life-motivation.css",
  "./css/css/link.css",
  "./css/css/live-chat.css",
  "./css/css/login.css",
  "./css/css/my-account.css",
  "./css/css/payment-history.css",
  "./css/css/Privacy-policy.css",
  "./css/css/Terms-of-Use.css",
  "./javascript/admin2.js",
  "./javascript/boo.js",
  "./javascript/book-details.js",
  "./javascript/chat.js",
  "./javascript/contact.js",
  "./javascript/create-account.js",
  "./javascript/customer-management.js",
  "./javascript/daily-upgrade.js",
  "./javascript/dashboard.js",
  "./javascript/delete.js",
  "./javascript/edit.js",
  "./javascript/faq.js",
  "./javascript/help.js",
  "./javascript/index.js",
  "./javascript/link.js",
  "./javascript/live-chat.js",
  "./javascript/login.js",
  "./javascript/my-account.js",
  "./javascript/payment-history.js",
  "./img/agori1.png",
  "./img/agori2.png",
  "./img/owner1.jpg",
  "./img/owner2.jpg",
  "./img/owner3.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("agori-academic-clinic-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  const isPublicBookCover = requestUrl.origin === SUPABASE_STORAGE_ORIGIN
    && requestUrl.pathname.startsWith("/storage/v1/object/public/ebooks/covers/");

  if (isPublicBookCover) {
    const cachePromise = caches.open(BOOK_COVER_CACHE);
    const networkPromise = fetch(event.request).then(async (networkResponse) => {
      if (networkResponse.ok || networkResponse.type === "opaque") {
        const cache = await cachePromise;
        await cache.put(event.request, networkResponse.clone()).catch(() => {});
      }
      return networkResponse;
    });

    event.waitUntil(networkPromise.then(() => undefined).catch(() => {}));
    event.respondWith(
      cachePromise
        .then((cache) => cache.match(event.request))
        .then((cachedResponse) => cachedResponse || networkPromise)
        .catch(() => networkPromise),
    );
    return;
  }

  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse.ok && networkResponse.type === "basic") {
        await cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) return cachedResponse;

      if (event.request.mode === "navigate") {
        const cachedHomePage = await cache.match("./index.html");
        if (cachedHomePage) return cachedHomePage;
      }

      return Response.error();
    }
  })());
});