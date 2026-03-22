# Prayer Notifications — Design Spec

## Goal

Notify the user at the time of each of the 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha). Tapping a notification opens the app to the Prayer Times tab.

## Architecture

Prayer times are already calculated locally by Adhan.js and stored in `state.prayer.times`. Notifications are scheduled from those times — no server required. Two delivery paths run in parallel:

- **Background (Android Chrome):** `Notification Triggers API` — `showTrigger: new TimestampTrigger(ms)` schedules notifications in the service worker; fires even when the app is closed.
- **Foreground fallback (all browsers, iOS 16.4+ installed PWA):** `new Notification()` fired directly when the existing countdown in `updateCountdown()` reaches zero.

iOS background notifications are not supported (Notification Triggers not implemented in Safari). This is an accepted limitation.

**Tech Stack:** Vanilla JS, Web Notifications API, Notification Triggers API, service worker `notificationclick`.

---

## Files

| File | Action | Responsibility |
|---|---|------|
| `js/prayer.js` | Modify | Add notification banner to `renderPrayerTimes()`, `requestNotifPermission()`, `dismissNotifBanner()`, `schedulePrayerNotifications()`, foreground fire in `updateCountdown()` |
| `js/app.js` | Modify | Handle `?tab=prayer` URL param in init; add `navigator.serviceWorker` message listener |
| `service-worker.js` | Modify | Add `notificationclick` listener; bump to `huda-v98` |
| `css/styles.css` | Modify | `.notif-banner` styles + dark mode |
| `index.html` | Modify | Bump all `?v=97` → `?v=98` |

---

## Feature 1: Permission Banner

In `renderPrayerTimes()`, render a dismissible banner immediately above the prayer time cards, conditional on `Notification.permission === 'default'`:

```js
const notifBanner = ('Notification' in window && Notification.permission === 'default') ? `
  <div class="notif-banner" id="notif-banner">
    <span class="notif-banner-text">🔔 Get notified at each prayer time</span>
    <button class="notif-banner-btn" onclick="requestNotifPermission()">Enable</button>
    <button class="notif-banner-dismiss" onclick="dismissNotifBanner()" aria-label="Dismiss">✕</button>
  </div>` : '';
```

- Permission `'granted'` → no banner; `schedulePrayerNotifications()` runs silently on each `renderPrayerTimes()` call.
- Permission `'denied'` → no banner (browser has blocked; nothing to do).
- Permission `'default'` → show banner. Dismiss hides it for the session (no localStorage needed — it reappears on next app open until the user decides).

### requestNotifPermission()

```js
async function requestNotifPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    schedulePrayerNotifications(state.prayer.times);
  }
  // Re-render to hide banner regardless of outcome
  renderPrayerTimes();
}
```

### dismissNotifBanner()

```js
function dismissNotifBanner() {
  const el = document.getElementById('notif-banner');
  if (el) el.remove();
}
```

---

## Feature 2: Scheduling — `schedulePrayerNotifications(times)`

Called from `renderPrayerTimes()` (after rendering) when `Notification.permission === 'granted'`, and from `requestNotifPermission()` on grant.

The 5 prayers to notify: Fajr, Dhuhr, Asr, Maghrib, Isha (Sunrise excluded).

```js
async function schedulePrayerNotifications(times) {
  if (!times || Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;

  const reg = await navigator.serviceWorker.ready;

  // Check if Notification Triggers API is supported
  if (!('showTrigger' in Notification.prototype)) return; // foreground fallback handles it

  const now = Date.now();
  const prayers = [
    { key: 'fajr',    en: 'Fajr',    ar: 'الفَجْر'   },
    { key: 'dhuhr',   en: 'Dhuhr',   ar: 'الظُّهْر'  },
    { key: 'asr',     en: 'Asr',     ar: 'العَصْر'   },
    { key: 'maghrib', en: 'Maghrib', ar: 'المَغْرِب' },
    { key: 'isha',    en: 'Isha',    ar: 'العِشَاء'  },
  ];

  for (const p of prayers) {
    const ms = new Date(times[p.key]).getTime();
    if (ms <= now) continue; // already past, skip
    reg.showNotification(p.en, {
      body: `${p.ar} — Time to pray`,
      tag: `prayer-${p.key}`,           // prevents duplicates on re-schedule
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      showTrigger: new TimestampTrigger(ms),
    });
  }
}
```

**Re-scheduling:** `renderPrayerTimes()` is already called on daily rollover (when `updateCountdown()` hits zero, it calls `setTimeout(renderPrayerTimes, 0)`). Since `schedulePrayerNotifications()` is called from `renderPrayerTimes()`, and uses `tag` to deduplicate, re-scheduling is automatic and idempotent.

---

## Feature 3: Foreground Fallback

In `updateCountdown()`, when `diff <= 0`, fire a foreground notification before re-rendering. Add after the existing `clearInterval` call:

```js
if (diff <= 0) {
  el.textContent = '00:00:00';
  clearInterval(state.prayer.countdownInterval);

  // Foreground notification fallback (fires when app is open)
  if ('Notification' in window && Notification.permission === 'granted') {
    // Find which prayer just hit
    const now = new Date();
    const hit = ['fajr','dhuhr','asr','maghrib','isha'].find(key => {
      const t = new Date(state.prayer.times[key]);
      return Math.abs(t - now) < 90000; // within 90s
    });
    if (hit) {
      const names = { fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' };
      const arabic = { fajr:'الفَجْر', dhuhr:'الظُّهْر', asr:'العَصْر', maghrib:'المَغْرِب', isha:'العِشَاء' };
      new Notification(names[hit], {
        body: `${arabic[hit]} — Time to pray`,
        icon: '/icons/icon-192.png',
        tag: `prayer-${hit}`,
      });
    }
  }

  setTimeout(renderPrayerTimes, 0);
  return;
}
```

---

## Feature 4: Notification Tap → Prayer Tab

### service-worker.js

Add after existing event listeners:

```js
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
```

- App already open → focus it and `postMessage` to switch tab (no navigation, no reload)
- App closed → open `/?tab=prayer`; init handles tab switch

### js/app.js — init (inside DOMContentLoaded)

Add two things to the existing init block:

**1. URL param check** — after `switchTab` and tab setup:

```js
const urlTab = new URLSearchParams(location.search).get('tab');
if (urlTab) switchTab(urlTab);
```

**2. Service worker message listener:**

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'OPEN_TAB') switchTab(e.data.tab);
  });
}
```

---

## CSS

```css
/* ── Notification Banner ───────────────────────────────────── */
.notif-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 12px;
  padding: 10px 12px;
  margin: 12px 16px 0;
}
.notif-banner-text {
  flex: 1;
  font-size: 13px;
  color: #065f46;
  font-weight: 500;
}
.notif-banner-btn {
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.notif-banner-dismiss {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 4px;
}
html.dark .notif-banner { background: #064e3b; border-color: #065f46; }
html.dark .notif-banner-text { color: #6ee7b7; }
html.dark .notif-banner-dismiss { color: #94a3b8; }
```

---

## Version Bump

- `service-worker.js`: `CACHE_NAME` → `'huda-v98'`
- `index.html`: all `?v=97` → `?v=98` (12 occurrences)

---

## Platform Notes

| Platform | Background | Foreground |
|---|---|---|
| Android Chrome (installed PWA) | ✅ Notification Triggers | ✅ |
| Android Chrome (browser tab) | ✅ Notification Triggers | ✅ |
| Desktop Chrome | ⚠️ Triggers may not be supported (foreground fallback) | ✅ |
| iOS 16.4+ (installed PWA) | ❌ Triggers not supported | ✅ |
| iOS < 16.4 | ❌ | ❌ |
| Firefox | ❌ Triggers not supported | ✅ |
