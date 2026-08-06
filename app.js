const CACHE_NAME = 'calcoff-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js?v=10',
  './manifest.json',
  './CalcOFFicon-192.png',
  './CalcOFFicon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
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

// 對 app.js 採取網絡優先 (Network-First)，防止 iOS 離線快取鎖死舊程式碼
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('app.js')) {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
