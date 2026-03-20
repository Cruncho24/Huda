// ============================================================
// HUDA PWA — Service Worker
// ============================================================

const CACHE_NAME = 'huda-v72';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/data.js',
  '/js/app.js',
  '/js/adhan.min.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/fonts/UthmanicHafs1Ver13.woff2',
  '/fonts/UthmanicHafs1Ver13.ttf',
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

// ── Reminder notifications ────────────────────────────────────
const SW_REMINDERS = [
  { title: 'Istighfar', body: 'أَسْتَغْفِرُ اللّٰه\nPause and seek Allah\'s forgiveness' },
  { title: 'Subhan Allah', body: 'سُبْحَانَ اللّٰه\nGlory be to Allah — say it 33 times' },
  { title: 'Alhamdulillah', body: 'الحَمْدُ لِلّٰه\nCount your blessings and praise Allah' },
  { title: 'Allahu Akbar', body: 'اللّٰهُ أَكْبَر\nAllah is Greater than everything you worry about' },
  { title: 'La ilaha illallah', body: 'لَا إِلٰهَ إِلَّا اللّٰه\nRenew your faith with the Shahada' },
  { title: 'Salawat', body: 'اللّٰهُمَّ صَلِّ عَلَى مُحَمَّد\nSend blessings upon the Prophet ﷺ' },
  { title: 'Dhikr', body: 'In the remembrance of Allah do hearts find rest — Quran 13:28' },
  { title: 'Subhanallahi wa bihamdih', body: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ\nLight on the tongue, heavy on the scale' },
];

// SW-based reminder timer — runs independently of the page
let _swTimer = null;
let _swIntervalMs = 0;

self.addEventListener('message', event => {
  const d = event.data;
  if (!d) return;
  if (d.type === 'SCHEDULE_REMINDER') {
    // intervalMs = recurring interval; firstMs = time until next fire (may be shorter if overdue)
    _swIntervalMs = d.intervalMs || d.ms;
    _swSetTimer(d.firstMs || d.ms);
  } else if (d.type === 'CANCEL_REMINDER') {
    if (_swTimer) { clearTimeout(_swTimer); _swTimer = null; }
    _swIntervalMs = 0;
  }
});

function _swSetTimer(ms) {
  if (_swTimer) clearTimeout(_swTimer);
  _swTimer = setTimeout(() => {
    _swFireReminder();
    if (_swIntervalMs) _swSetTimer(_swIntervalMs); // reschedule
  }, ms);
}

function _swFireReminder() {
  // Write timestamp to Cache API so the page can sync it via _syncSwTimestamp()
  const now = Date.now();
  caches.open(CACHE_NAME).then(c =>
    c.put('/__huda_last_reminder__', new Response(String(now)))
  );
  const msg = SW_REMINDERS[Math.floor(Math.random() * SW_REMINDERS.length)];
  self.registration.showNotification('Huda — ' + msg.title, {
    body: msg.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'huda-reminder',
    renotify: true,
  });
  // Tell all open clients so they can update their timestamp
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(c => c.postMessage({ type: 'REMINDER_FIRED' }));
  });
}

// periodicsync kept as bonus for Chrome Android where it IS supported
self.addEventListener('periodicsync', event => {
  if (event.tag === 'huda-reminder') {
    event.waitUntil(Promise.resolve(_swFireReminder()));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

function stripQuery(url) {
  const u = new URL(url);
  u.search = '';
  return u.toString();
}
