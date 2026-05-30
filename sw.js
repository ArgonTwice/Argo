const CACHE_NAME = 'pwa-v18';
const ASSETS = ['./', './index.html', './style.css', './script.js', './manifest.json', './icon.svg'];

/* Installation — met en cache tous les assets */
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting(); // active immédiatement sans attendre la fermeture des onglets
});

/* Activation — supprime les anciens caches */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // prend le contrôle de tous les onglets ouverts
});

/* Messages depuis le client — notifications locales */
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

/* Fetch — network-first : toujours la version fraîche, cache en fallback hors-ligne */
self.addEventListener('fetch', (e) => {
  // On ne gère que les requêtes GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Met à jour le cache avec la réponse réseau
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return networkResponse;
      })
      .catch(() => {
        // Réseau indisponible → on sert depuis le cache
        return caches.match(e.request);
      })
  );
});
