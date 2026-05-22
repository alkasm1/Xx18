const cacheName="ALM-RT2-v2";

const filesToCache=[
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./jszip.min.js",
  "./pdf.min.js",
  "./pdf.worker.min.js",
  "./jspdf.umd.min.js",
  "./docx.min.js",
  "./app/ui.js",
  "./alm/core.js"
];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(cacheName).then(c=>c.addAll(filesToCache)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==cacheName).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch",e=>{
  e.respondWith(
    caches.match(e.request, {ignoreSearch:true}).then(r=>r||fetch(e.request))
  );
});
