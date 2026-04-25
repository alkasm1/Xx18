const cacheName = "xx16-offline-v1";

const filesToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./alm64.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",

  // مكتبات PDF و DOCX
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
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
