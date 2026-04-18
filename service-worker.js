// AgroVision — Service Worker
// Stratégie : cache-first pour les assets, network-first pour les données

const CACHE = 'agrovision-v2';
const ASSETS = [
  './app.html',
  './manifest.json'
];

// Installation : mise en cache des assets essentiels
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activation : suppression des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : cache-first avec fallback réseau
self.addEventListener('fetch', e => {
  // Ne traiter que les requêtes GET vers notre propre origine
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Mettre en cache les nouvelles ressources valides
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Hors ligne et pas en cache : retourner app.html comme fallback
        if (e.request.destination === 'document') {
          return caches.match('./app.html');
        }
      });
    })
  );
});
