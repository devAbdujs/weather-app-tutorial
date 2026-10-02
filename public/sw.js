const CACHE_NAME = 'temari-cache-v3';

// Static assets critical for the initial offline paint (only immutable assets, never dynamic HTML)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/assets/temari_icon.png',
  '/assets/temari_icon_192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting(); // Force the waiting service worker to become active immediately
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Purging outdated cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim(); // Claim control of all open clients immediately
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-http requests, chrome extensions, etc.
  if (!event.request.url.startsWith('http')) return;
  if (event.request.method !== 'GET') return;

  // 1. Cache-First with Background Revalidation for Next.js Static Assets & Images
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|woff|woff2)$/i)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => null);

        // Return cached asset immediately for speed; if missing, wait for network
        return cachedResponse || fetchPromise;
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
