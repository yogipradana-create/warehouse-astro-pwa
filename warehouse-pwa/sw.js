const CACHE_NAME = 'warehouse-astro-v1';
const urlsToCache = [
  './',
  './index.html',
  './index.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached file or fallback to network
        return response || fetch(event.request);
      })
  );
});
