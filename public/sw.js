// Service Worker pour le fonctionnement hors-ligne de Kagami (PWA).

const CACHE_NAME = "kagami-v1";
const ASSETS_A_METTRE_EN_CACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_A_METTRE_EN_CACHE).catch(() => {
        // En mode dev, certains assets dynamiques peuvent être absents
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cles => {
      return Promise.all(
        cles.filter(cle => cle !== CACHE_NAME).map(cle => caches.delete(cle))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // Stratégie Stale-While-Revalidate pour une réactivité maximale
  event.respondWith(
    caches.match(event.request).then(reponseEnCache => {
      const fetchPromise = fetch(event.request)
        .then(reponseReseau => {
          if (reponseReseau && reponseReseau.status === 200) {
            const copie = reponseReseau.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, copie);
            });
          }
          return reponseReseau;
        })
        .catch(() => reponseEnCache);

      return reponseEnCache || fetchPromise;
    })
  );
});

