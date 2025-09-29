const PRECACHE = "precache-v1";
const PRECACHE_URLS = [ "/", "/manifest.webmanifest" ];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PRECACHE).then((c) => c.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== PRECACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache APIs or downloads
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/download/")) return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(PRECACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match("/")))
  );
});