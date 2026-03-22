# Prayer Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fire a browser notification at the time of each of the 5 daily prayers, with a tap that opens the Prayer Times tab.

**Architecture:** Prayer times are already calculated locally by Adhan.js. Two delivery paths: (1) Notification Triggers API schedules notifications in the service worker so they fire when the app is closed (Android Chrome); (2) a foreground fallback fires `new Notification()` when the in-app countdown reaches zero (works on iOS 16.4+ installed PWA and all other browsers while the app is open). A dismissible banner in the Prayer tab requests permission once.

**Tech Stack:** Vanilla JS, Web Notifications API, Notification Triggers API, service worker `notificationclick`.

---

## Files

| File | Action | What changes |
|---|---|---|
| `css/styles.css` | Modify | Append `.notif-banner` styles + dark mode |
| `service-worker.js` | Modify | Add `notificationclick` listener; bump to `huda-v98` |
| `js/app.js` | Modify | URL param `?tab=prayer` handling in init; service worker message listener |
| `js/prayer.js` | Modify | Notification banner in `renderPrayerTimes()`, `requestNotifPermission()`, `dismissNotifBanner()`, `schedulePrayerNotifications()`, foreground fallback in `updateCountdown()` |
| `index.html` | Modify | Bump all `?v=97` → `?v=98` (12 occurrences) |

---

### Task 1: CSS — notification banner styles

**Files:**
- Modify: `css/styles.css` (append to end)

- [ ] **Step 1: Append banner CSS to the end of `css/styles.css`**

Add this block after the last rule in the file:

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

- [ ] **Step 2: Verify**

Confirm the block is at the END of `css/styles.css`, no missing braces.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: add notification banner CSS"
```

---

### Task 2: Service worker — notificationclick + version bump

**Files:**
- Modify: `service-worker.js`

**Context:** `service-worker.js` currently has `install`, `activate`, and `fetch` listeners. The `notificationclick` listener goes after `fetch`. Line 5 has `const CACHE_NAME = 'huda-v97'`.

- [ ] **Step 1: Add `notificationclick` listener**

In `service-worker.js`, append this after the `fetch` event listener (after the closing `});` of the fetch handler):

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

- [ ] **Step 2: Bump cache name**

Change line 5:
```js
const CACHE_NAME = 'huda-v97';
```
to:
```js
const CACHE_NAME = 'huda-v98';
```

- [ ] **Step 3: Verify**

Confirm `notificationclick` listener is present and `CACHE_NAME` is `huda-v98`.

- [ ] **Step 4: Commit**

```bash
git add service-worker.js
git commit -m "feat: add notificationclick handler to service worker; bump to v98"
```

---

### Task 3: app.js — URL param + message listener

**Files:**
- Modify: `js/app.js` (lines 243–276, the `DOMContentLoaded` block)

**Context:** The `DOMContentLoaded` listener runs at line 243 and ends at line 276 with `});`. It calls `setupNav()`, `renderHome()`, `registerSW()`, `setupInstallPrompt()` etc. The `registerSW()` function is at line 426 and already contains a `navigator.serviceWorker` block.

Two additions are needed:

1. After `setupInstallPrompt()` (line 253), add URL param handling to switch to the prayer tab when the app is opened via a notification tap.
2. Inside `registerSW()`, after the existing `controllerchange` listener (line 435), add a message listener for the warm-app case (app already open when notification tapped).

- [ ] **Step 1: Add URL param tab switch in `DOMContentLoaded`**

Find this block in `js/app.js` (around line 252–254):
```js
  registerSW();
  setupInstallPrompt();
  setInterval(rotateHadith, 12000);
```

Change it to:
```js
  registerSW();
  setupInstallPrompt();
  setInterval(rotateHadith, 12000);

  // Handle notification tap — open to specific tab
  const _notifTab = new URLSearchParams(location.search).get('tab');
  if (_notifTab) switchTab(_notifTab);
```

- [ ] **Step 2: Add service worker message listener in `registerSW()`**

Find this in `registerSW()` (around line 434–435):
```js
  // New SW activated → reload so users get the latest version
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
```

Change it to:
```js
  // New SW activated → reload so users get the latest version
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
  // Handle notification tap when app is already open
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'OPEN_TAB') switchTab(e.data.tab);
  });
```

- [ ] **Step 3: Verify**

Confirm both additions are in the correct places and no existing logic was displaced.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: handle prayer tab deep-link from notification tap"
```

---

### Task 4: prayer.js — permission banner + scheduling

**Files:**
- Modify: `js/prayer.js`

**Context:** `renderPrayerTimes()` starts at line 131. The main `tab.innerHTML = \`...\`` assignment is at line 231 and ends at line 311 (`\`` : ''}\n  \`;\n`). After the template literal closes (line 311), the countdown interval is set up (lines 313–315). The notification banner goes inside the template literal, between the hero and the prayer list. The `schedulePrayerNotifications()` call goes after line 315 (after countdown setup).

- [ ] **Step 1: Add notification banner to `renderPrayerTimes()`**

In `js/prayer.js`, find this inside `renderPrayerTimes()` — the `notifBanner` variable must be declared before the `tab.innerHTML` assignment. Add it just before `const tab = document.getElementById('tab-prayer');` (line 230):

```js
  const notifBanner = ('Notification' in window && Notification.permission === 'default') ? `
    <div class="notif-banner" id="notif-banner">
      <span class="notif-banner-text">🔔 Get notified at each prayer time</span>
      <button class="notif-banner-btn" onclick="requestNotifPermission()">Enable</button>
      <button class="notif-banner-dismiss" onclick="dismissNotifBanner()" aria-label="Dismiss">✕</button>
    </div>` : '';
```

Then in the `tab.innerHTML` template literal, insert `${notifBanner}` between the closing `</div>` of the prayer hero and the opening `<div class="prayer-list">`.

Find this in the template literal (around line 241):
```js
    </div>
    <div class="prayer-list">
```

Change it to:
```js
    </div>
    ${notifBanner}
    <div class="prayer-list">
```

- [ ] **Step 2: Call `schedulePrayerNotifications()` from `renderPrayerTimes()`**

After line 315 (`updateCountdown(nextTime);`), add:

```js
  // Schedule background notifications if permission already granted
  if ('Notification' in window && Notification.permission === 'granted') {
    schedulePrayerNotifications(state.prayer.times);
  }
```

- [ ] **Step 3: Add `requestNotifPermission()`, `dismissNotifBanner()`, `schedulePrayerNotifications()` at the bottom of `js/prayer.js`**

Append after the last function in the file:

```js
// ── Prayer Notifications ───────────────────────────────────────
async function requestNotifPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    schedulePrayerNotifications(state.prayer.times);
  }
  renderPrayerTimes(); // re-render to hide banner
}

function dismissNotifBanner() {
  const el = document.getElementById('notif-banner');
  if (el) el.remove();
}

async function schedulePrayerNotifications(times) {
  if (!times || Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;

  const reg = await navigator.serviceWorker.ready;

  // Notification Triggers API — not supported everywhere; foreground fallback covers the rest
  if (!('showTrigger' in Notification.prototype)) return;

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
      tag: `prayer-${p.key}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      showTrigger: new TimestampTrigger(ms),
    });
  }
}
```

- [ ] **Step 4: Verify**

- `notifBanner` is declared before `tab.innerHTML`
- `${notifBanner}` is between hero and prayer list in the template
- `schedulePrayerNotifications()` is called after `updateCountdown(nextTime)`
- The 3 new functions are at the bottom of the file
- Sunrise (`key: 'sunrise'`) is NOT in the prayers array

- [ ] **Step 5: Commit**

```bash
git add js/prayer.js
git commit -m "feat: prayer notification banner, scheduling, and permission flow"
```

---

### Task 5: prayer.js — foreground fallback in `updateCountdown()`

**Files:**
- Modify: `js/prayer.js` (lines 325–340, the `updateCountdown` function)

**Context:** `updateCountdown(target)` at line 325 checks `diff <= 0` and currently does:
```js
  if (diff <= 0) {
    el.textContent = '00:00:00';
    clearInterval(state.prayer.countdownInterval);
    // Re-render immediately to pick up the next prayer (avoids 1s 00:00:00 flash)
    setTimeout(renderPrayerTimes, 0);
    return;
  }
```

The foreground notification fires here, between `clearInterval` and `setTimeout(renderPrayerTimes, 0)`.

- [ ] **Step 1: Add foreground notification to `updateCountdown()`**

Replace the `if (diff <= 0)` block with:

```js
  if (diff <= 0) {
    el.textContent = '00:00:00';
    clearInterval(state.prayer.countdownInterval);

    // Foreground notification fallback (fires when app is open — covers iOS 16.4+ and non-Triggers browsers)
    if ('Notification' in window && Notification.permission === 'granted' && state.prayer.times) {
      const _now = new Date();
      const _hit = ['fajr','dhuhr','asr','maghrib','isha'].find(key => {
        const t = new Date(state.prayer.times[key]);
        return Math.abs(t - _now) < 90000; // within 90 seconds of prayer time
      });
      if (_hit) {
        const _names = { fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' };
        const _arabic = { fajr:'الفَجْر', dhuhr:'الظُّهْر', asr:'العَصْر', maghrib:'المَغْرِب', isha:'العِشَاء' };
        new Notification(_names[_hit], {
          body: `${_arabic[_hit]} — Time to pray`,
          icon: '/icons/icon-192.png',
          tag: `prayer-${_hit}`,
        });
      }
    }

    // Re-render immediately to pick up the next prayer (avoids 1s 00:00:00 flash)
    setTimeout(renderPrayerTimes, 0);
    return;
  }
```

- [ ] **Step 2: Verify**

- The foreground notification block is between `clearInterval` and `setTimeout(renderPrayerTimes, 0)`
- Only the 5 prayer keys are checked (no `sunrise`)
- `Math.abs(t - _now) < 90000` is a 90-second window
- `tag: \`prayer-${_hit}\`` matches the scheduled notification tags (deduplicates if both fire)

- [ ] **Step 3: Commit**

```bash
git add js/prayer.js
git commit -m "feat: foreground notification fallback in countdown"
```

---

### Task 6: Version bump — index.html

**Files:**
- Modify: `index.html`

**Context:** `service-worker.js` was already bumped to `huda-v98` in Task 2. Now bump `index.html`.

- [ ] **Step 1: Replace all `?v=97` with `?v=98` in `index.html`**

```bash
sed -i '' 's/?v=97/?v=98/g' index.html
```

- [ ] **Step 2: Verify count**

```bash
grep -c "v=98" index.html
```
Expected: `12`

```bash
grep "v=97" index.html
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "chore: bump to v98 — prayer notifications"
```
