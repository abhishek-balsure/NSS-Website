const CACHE_NAME = 'nss-shell-v1';
const SHELL_ASSETS = [
  '/index.html',
  '/shared.css',
  '/shared.js',
  '/favicon.svg',
  '/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for everything — this is a live data-driven site
// (attendance, registrations, etc.), so we never want to serve stale
// cached data over fresh. Cache is only a fallback for true offline
// access to the app shell (nav, styles, homepage), not a performance
// cache for API responses.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never intercept POST/PUT/DELETE
  if (request.url.includes('/api/')) return; // never cache API calls

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
