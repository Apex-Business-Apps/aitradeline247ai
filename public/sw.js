// Service Worker v3.0.0 - Production-optimized with strategic caching
const SW_VERSION = '3.0.0';
const CACHE_NAME = `tradeline247-v${SW_VERSION}`;
const STATIC_CACHE = `tradeline247-static-v${SW_VERSION}`;
const API_CACHE = `tradeline247-api-v${SW_VERSION}`;

// Cache configuration for production
const CACHE_CONFIG = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for static assets
  maxEntries: 100, // Limit cache size
  networkTimeout: 5000 // 5 seconds network timeout
};

self.addEventListener("install", (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log(`[SW ${SW_VERSION}] Activating...`);
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              !cacheName.includes(SW_VERSION) &&
              cacheName.startsWith('tradeline247')
            )
            .map((cacheName) => {
              console.log(`[SW ${SW_VERSION}] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Static assets strategy: Cache-first with fallback
  if (
    url.pathname.match(/\.(js|css|woff2|png|jpg|jpeg|svg|ico|webp)$/) &&
    !url.pathname.includes('/functions/')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          // Validate cache age
          const cacheTime = cached.headers.get('sw-cache-time');
          if (cacheTime && Date.now() - parseInt(cacheTime) < CACHE_CONFIG.maxAge) {
            return cached;
          }
        }

        // Fetch with timeout
        return Promise.race([
          fetch(request).then(response => {
            if (response.ok && response.status === 200) {
              const responseToCache = response.clone();
              const headers = new Headers(responseToCache.headers);
              headers.set('sw-cache-time', Date.now().toString());
              
              const blob = responseToCache.blob();
              blob.then(b => {
                const cachedResponse = new Response(b, {
                  status: responseToCache.status,
                  statusText: responseToCache.statusText,
                  headers: headers
                });
                
                caches.open(STATIC_CACHE).then(cache => {
                  cache.put(request, cachedResponse);
                });
              });
            }
            return response;
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), CACHE_CONFIG.networkTimeout)
          )
        ]).catch(() => cached || new Response('Offline', { status: 503 }));
      })
    );
    return;
  }

  // API requests strategy: Network-first with short cache fallback
  if (url.pathname.includes('/functions/') || url.pathname.includes('/rest/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(request, responseToCache);
              // Limit API cache size
              cache.keys().then(keys => {
                if (keys.length > 20) {
                  cache.delete(keys[0]);
                }
              });
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => 
            cached || new Response('Offline', { status: 503 })
          );
        })
    );
    return;
  }

  // Default: network-only for HTML and other resources
});