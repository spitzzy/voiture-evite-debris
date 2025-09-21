self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  clients.claim();
});

// Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Only same-origin
  if (url.origin !== location.origin) return;
  // Bypass for dynamic files that change often
  const bypass = [/^\/scores/i];
  if (bypass.some(r => r.test(url.pathname))) return;

  event.respondWith(
    caches.open('neonrun-v1').then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && (res.type === 'basic' || res.type === 'opaque')) {
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        return cached || Response.error();
      }
    })
  );
});
