self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  self.clients.claim();
});
self.addEventListener("fetch", () => { /* no-op: rely on network; keeps UX stable */ });