// Service Worker LAPIS LADA v2 (Auto-update & Network-first for all pages)
const CACHE_NAME = 'lapislada-v2-cache-v8';
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
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          return new Response(
            '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline - LAPIS LADA</title></head><body style="font-family:sans-serif;padding:32px 16px;text-align:center;color:#1A1A1A;background:#FAF8F2;"><div style="max-width:360px;margin:40px auto;background:#fff;padding:24px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.06);"><h2 style="color:#922B21;margin-bottom:8px;">Koneksi Terputus</h2><p style="color:#666;font-size:14px;line-height:1.5;">Perangkat sedang offline atau sinyal tidak stabil. Silakan periksa jaringan internet Anda.</p><button onclick="window.location.reload()" style="margin-top:16px;background:#922B21;color:#fff;border:none;padding:10px 24px;border-radius:10px;font-weight:bold;cursor:pointer;font-size:14px;">Muat Ulang Halaman</button></div></body></html>',
            {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        })
    );
    return;
  }

  // Cache-first for images, fonts, and manifest
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return new Response('', { status: 408, statusText: 'Request Timeout' });
        });
    })
  );
});
