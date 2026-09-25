/**
 * BioStack PRO — Service Worker (PWA)
 * Strategy: Cache-First for static assets, Network-First for HTML.
 *
 * Cache versioning: bump CACHE_VERSION when deploying new builds so
 * the old cache is automatically evicted on the next visit.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `biostack-pro-${CACHE_VERSION}`;

/** Assets to pre-cache on install (app shell). */
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// ---------------------------------------------------------------------------
// Install — pre-cache the app shell
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        // Non-fatal: if precache fails, the SW still installs.
        console.warn('[SW] Precache failed (non-fatal):', err);
      })
    )
  );
  // Skip waiting so the new SW activates immediately.
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — remove stale caches from previous versions
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all open clients immediately.
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch — Stale-While-Revalidate for JS/CSS/images, Network-First for HTML.
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GETs.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isHtmlNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  if (isHtmlNavigation) {
    // Network-First: fetch fresh HTML, fall back to cached shell.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-While-Revalidate for all other assets.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      });
      return cached ?? networkPromise;
    })
  );
});
