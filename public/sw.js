const CACHE_NAME = 'ethioscholar-cache-v1';

// Static assets critical for the initial offline paint
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim(); // Claim control of all open clients immediately
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests, chrome extensions, etc.
  if (!event.request.url.startsWith('http')) return;
  if (event.request.method !== 'GET') return;

  // 1. Cache-First Strategy for Next.js Static Assets (JS, CSS, Fonts)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(png|jpg|jpeg|svg|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Network-First Strategy for HTML, RSC Payloads, and API Data
  // This ensures users always get fresh data (like updated daily streaks) if they are online,
  // but seamlessly falls back to the last cached version if they lose connection.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Don't cache bad responses
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      })
      .catch(async () => {
        // If network fails (offline), look in the cache!
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        
        // If they ask for a page but we don't have it, we could return a custom offline.html here
        // return caches.match('/offline.html');
      })
  );
});
