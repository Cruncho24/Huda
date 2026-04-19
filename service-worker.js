// ============================================================
// HUDA PWA — Service Worker
// ============================================================

const CACHE_NAME = 'huda-v213';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/auth.js',
  '/js/sync.js',
  '/js/data.js',
  '/js/app.js',
  '/js/home.js',
  '/js/quran.js',
  '/js/prayer.js',
  '/js/dhikr.js',
  '/js/duas.js',
  '/js/learn.js',
  '/js/plan.js',
  '/js/adhan.min.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/fonts/UthmanicHafs1Ver13.woff2',
  '/fonts/UthmanicHafs1Ver13.ttf',
  '/auth/reset.html',
];

// ── Install: pre-cache everything needed for offline ──────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
      )
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: wipe old caches, claim all clients ──────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Google Fonts — cache-first (never change)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Quran API — network first, fall back to cache for offline reading
  if (url.hostname === 'api.alquran.cloud') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Other external APIs (audio, geocoding, prices) — network only
  if (url.hostname !== location.hostname) {
    event.respondWith(fetch(event.request).catch(() =>
      new Response('{}', { headers: { 'Content-Type': 'application/json' } })
    ));
    return;
  }

  // App shell (HTML, CSS, JS, icons) — network first, offline fallback
  event.respondWith(networkFirst(event.request));
});

// ── Notification Click ─────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) {
        list[0].focus();
        list[0].postMessage({ type: 'OPEN_TAB', tab: 'prayer' });
      } else {
        clients.openWindow('/?tab=prayer');
      }
    })
  );
});

// Network first, cache fallback (ignores query strings when matching cache)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      // Store without query string so it's always found offline
      const cacheKey = new Request(stripQuery(request.url));
      cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (e) {
    // Try cache — ignore ?v=XX query strings
    const cached =
      await caches.match(request) ||
      await caches.match(stripQuery(request.url));
    if (cached) return cached;
    // Offline fallback for navigation
    if (request.mode === 'navigate') {
      return caches.match('/index.html') ||
             new Response('<h2>You are offline</h2>', { headers: { 'Content-Type': 'text/html' } });
    }
    throw e;
  }
}

// Cache first, network fallback
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    throw e;
  }
}


function stripQuery(url) {
  const u = new URL(url);
  u.search = '';
  return u.toString();
}
