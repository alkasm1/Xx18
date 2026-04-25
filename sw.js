const cacheName = "xx18-v1";   // غيّر الرقم عند كل تحديث

const filesToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./jszip.min.js",
  "./pdf.min.js",
  "./pdf.worker.min.js",
  "./jspdf.umd.min.js",
  "./docx.min.js",
  "./script.js"
];

// ⚠️ لا نضع ملفات تتغير باستمرار في الكاش (لكن script.js ثابت الآن)
// إذا أردت استثناء script.js لاحقًا، فقط احذفه من القائمة.

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

// Network-first لملفات JS و PDF و DOCX
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // ملفات JS و worker يجب أن تأتي من الشبكة أولاً
  if (url.endsWith(".js") || url.endsWith(".worker.js")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // باقي الملفات: cache-first
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
