const CACHE_NAME = 'pwa-v22';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/base.css',
  './css/budget.css',
  './css/components.css',
  './css/features.css',
  './css/fixes.css',
  './css/goals.css',
  './css/layout.css',
  './css/metrics.css',
  './css/responsive.css',
  './css/splash.css',
  './css/theme.css',
  './css/ui-v2.css',
  './js/app.js',
  './js/archives.js',
  './js/budget.js',
  './js/charts.js',
  './js/investments.js',
  './js/mortgage.js',
  './js/storage.js',
  './js/ui.js',
  './js/utils.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (e) => {
  if (e.data?.type !== 'SHOW_NOTIF') return;
  self.registration.showNotification(e.data.title, {
    body: e.data.body,
    icon: './icon.svg',
    badge: './icon.svg',
    vibrate: [200, 100, 200],
    tag: 'argo-charge-' + Date.now(),
  });
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.protocol === 'chrome-extension:') return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return networkResponse;
      })
      .catch(() => caches.match(e.request))
  );
});
