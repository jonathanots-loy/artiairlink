// AgroVision — Service Worker
// Stratégie : network-first (mises à jour toujours visibles), fallback cache hors ligne

const CACHE = 'agrovision-v4';
const ASSETS = [
  './app.html',
  './manifest.json',
  './assets/leaflet/leaflet.js',
  './assets/leaflet/leaflet.css',
  './assets/leaflet/images/marker-icon.png',
  './assets/leaflet/images/marker-icon-2x.png',
  './assets/leaflet/images/marker-shadow.png',
  './assets/leaflet/images/layers.png',
  './assets/leaflet/images/layers-2x.png',
  './assets/tfjs/tf.min.js'
];

// Installation : mise en cache des assets essentiels
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(a => c.add(a).catch(() => {})))
    )
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

// Fetch : network-first — essaie le réseau, tombe sur le cache si hors ligne
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(response => {
      // Mettre à jour le cache avec la version réseau
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return response;
    }).catch(() => {
      // Hors ligne : servir depuis le cache
      return caches.match(e.request).then(cached => {
        if (cached) return cached;
        if (e.request.destination === 'document') return caches.match('./app.html');
      });
    })
  );
});
