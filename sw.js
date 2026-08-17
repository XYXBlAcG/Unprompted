/* Unprompted — Service Worker(离线缓存,版本更新时请递增 CACHE_NAME) */
const CACHE_NAME = "unprompted-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./favicon.svg",
  "./apple-touch-icon.png",
  "./manifest.webmanifest",
  "./og.png",
  "./research.html",
  "./research.js",
  "./research.css",
  "./vendor/pdf-lib.min.js",
  "./vendor/fontkit.umd.min.js",
  "./vendor/qrcode.js",
  "./assets/cjk-font.ttf",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const copy = res.clone();
        const url = new URL(event.request.url);
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      });
    })
  );
});
