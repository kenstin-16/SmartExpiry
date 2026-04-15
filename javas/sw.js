const CACHE_NAME = "smartexpiry-v1";

const FILES = [
  "/",
  "/index1.html",
  "/login1.html",
  "/signup1.html",
  "/dashboard.html",
  "/style1.css"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(FILES)));
});

self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});