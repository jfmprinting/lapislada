// Service Worker LAPIS LADA v2 (Auto-update & Network-first for all pages)
const CACHE_NAME = 'lapislada-v2-cache-v6';
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.webp',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Never cache Supabase, Next.js internal runtime chunks, or APIs
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next/static/chunks') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('turbopack')
  ) {
    return;
  }

  // Network-first for all HTML pages and navigation
  if (
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    !url.pathname.includes('.')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/');
        })
    );
    return;
  }

  // Cache-first for images, fonts, and manifest
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
