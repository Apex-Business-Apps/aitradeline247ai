// Service Worker v2.0.1 - Cache-busting version
// Update this version number when deploying fixes to force cache refresh
const SW_VERSION = '2.0.1';
const CACHE_NAME = `tradeline247-v${SW_VERSION}`;

self.addEventListener("install", (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log(`[SW ${SW_VERSION}] Activating...`);
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log(`[SW ${SW_VERSION}] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", () => {
  // No-op: Let all requests pass through without caching
  // This prevents stale content issues
});