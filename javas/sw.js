// =============================================
//  SmartExpiry — sw.js  (Service Worker)
//  Caches app shell for offline use
// =============================================

const CACHE_NAME = "smartexpiry-v2";

const FILES = [
  "/SmartExpiry/",
  "/SmartExpiry/index.html",
  "/SmartExpiry/login1.html",
  "/SmartExpiry/signup1.html",
  "/SmartExpiry/dashboard.html",
  "/SmartExpiry/style1.css",
  "/SmartExpiry/manifest.json",
  "/SmartExpiry/javas/firebase.js",
  "/SmartExpiry/javas/auth.js",
  "/SmartExpiry/javas/script1.js",
  "/SmartExpiry/SmartExpiry Logo.png"
];

// ---- INSTALL: cache all files ----
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// ---- ACTIVATE: delete old caches ----
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- FETCH: cache-first, fallback to network ----
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // Let browser handle all external requests normally
  if (
    url.includes("firestore.googleapis.com") ||
    url.includes("firebase") ||
    url.includes("googleapis.com") ||
    url.includes("gstatic.com") ||
    url.includes("jsdelivr.net") ||
    url.includes("fonts.googleapis.com") ||
    url.includes("fonts.gstatic.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Cache valid same-origin responses
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback for page navigations
          if (event.request.destination === "document") {
            return caches.match("/SmartExpiry/index.html");
          }
        });
    })
  );
});