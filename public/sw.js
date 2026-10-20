// Self-destructing Service Worker (Kill Switch)
// Unregisters itself, purges all caches, and reloads the page to show the new update automatically.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const client of clients) {
          if (client.url && 'navigate' in client) {
            client.navigate(client.url);
          }
        }
      });
    })
  );
});

// Pass all fetch requests directly to the network without caching
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
