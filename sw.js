const cacheName = "xx18-offline-v1";

const filesToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./alm64.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",

  // مكتبات محلية
  "./pdf.min.js",
  "./pdf.worker.min.js",
  "./jszip.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(filesToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
