# Background Push Notifications — Design Spec
**Date:** 2026-03-21
**Project:** Huda Islamic Companion PWA
**Status:** Approved for implementation (v3 — all review issues resolved)

---

## Problem

The current dhikr reminder notification system only fires when the app is open. Service Workers are ephemeral — the browser kills them after ~30 seconds of inactivity, destroying the in-memory `setTimeout` timer. Periodic Background Sync (already in the SW) only works on Chrome Android for installed PWAs and has no timing precision. The result: notifications only fire when the user opens the app and restarts the timer.

True background notifications require a server to send Web Push at the scheduled time.

---

## Goal

Replace the SW-timer approach with a proper Web Push system that:
1. Fires dhikr reminders at the user's chosen interval (1–4h) when the app is completely closed
2. Is architected to support Adhan prayer time notifications with no structural change later
3. Costs nothing (free tier of all services used)
4. Requires no user accounts

---

## Chosen Approach

**Vercel Functions + Vercel KV + cron-job.org**

- 5 serverless API endpoints inside the existing Vercel project
- Vercel KV (built-in, free tier) stores push subscriptions and preferences
- cron-job.org (free) hits `/api/cron` every 5 minutes to send due notifications
- VAPID keys stored as Vercel environment variables
- SW handles incoming pushes via the `push` event

---

## Architecture

```
Browser (PWA)
  ├── Enable Notifications → POST /api/subscribe
  ├── Change interval     → POST /api/update-preferences
  ├── Disable             → POST /api/unsubscribe
  └── SW `push` event     → showNotification() + postMessage(REMINDER_FIRED)

cron-job.org (every 5 min)
  └── GET /api/cron?secret=XXX
        ├── load all subscriptions from KV (Redis SMEMBERS on index set)
        ├── dhikr check: elapsed >= intervalHours → send push, update lastFired
        ├── on 410 Gone: delete dead subscription from KV
        ├── on other error: log and continue (transient, try next sub)
        ├── adhan check: prayer within next 5 min → send push  (future)
        └── return count of pushes sent

Vercel KV (Redis)
  └── sub:{uuid} records + "subscriptions" index as a Redis SET

Vercel Functions
  ├── GET  /api/config
  ├── POST /api/subscribe
  ├── POST /api/unsubscribe
  ├── POST /api/update-preferences
  └── GET  /api/cron
```

---

## Data Model

### Subscription record — key: `sub:{uuid}`

```json
{
  "id": "uuid-xxxx",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "preferences": {
    "dhikr": {
      "enabled": true,
      "intervalHours": 2,
      "lastFired": 1711234567000
    },
    "adhan": {
      "enabled": false,
      "lat": null,
      "lng": null,
      "prayers": ["fajr", "dhuhr", "asr", "maghrib", "isha"]
    }
  }
}
```

### Index — key: `subscriptions` (Redis SET)

Use `SADD subscriptions {uuid}` on subscribe and `SREM subscriptions {uuid}` on unsubscribe. The cron uses `SMEMBERS subscriptions` to get all UUIDs. A Redis set avoids the race condition where two concurrent subscribe requests both read-mutate-write the same JSON array and one UUID is lost.

### Client-side

The UUID returned from `/api/subscribe` is stored in `localStorage` as `huda_push_id`. Used for subsequent update/unsubscribe calls. No user account needed.

`huda_notifs` (`'1'`/`'0'`) is retained as the master UI-state flag. `enableReminders()` continues to set it to `'1'` on success and `'0'` on denial. `renderReminderCard()` reads it to decide which buttons to show — no change to that logic.

If a user clears browser data, `huda_push_id` and `huda_notifs` are both lost. The old KV record becomes a ghost — it self-cleans when the push service returns 410 Gone. The user simply re-enables and a new subscription is created.

---

## VAPID Public Key — Client Delivery

`VAPID_PUBLIC_KEY` is a Vercel environment variable (server-side only by default). The client needs it to call `pushManager.subscribe()`. It is exposed via `/api/config`:

```js
// GET /api/config
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  res.json({ vapidPublicKey: process.env.VAPID_PUBLIC_KEY });
}
```

`enableReminders()` fetches `/api/config` first, then uses the returned key. `VAPID_PUBLIC_KEY` is not sensitive — it is by definition public — so this is safe.

**CSP note:** The existing `connect-src 'self' ...` directive in `vercel.json` covers same-origin `/api/*` calls since Vercel Functions are served on the same domain. No CSP change needed.

---

## vercel.json Migration

**Critical:** The current `vercel.json` uses the legacy `"builds"` + `"routes"` format. The final catch-all route `{ "src": "/(.*)", "dest": "/index.html" }` intercepts all `/api/*` requests and serves `index.html` instead of invoking functions. This must be migrated.

Changes:
- Remove the `"builds"` array entirely
- Replace `"routes"` with `"rewrites"` (modern format) — a single SPA catch-all rewrite: `{ "source": "/((?!api/).*)", "destination": "/index.html" }`
- Keep all existing per-path cache-control headers (the `"headers"` block — already in modern format, unchanged)
- Vercel automatically routes `api/*.js` files as Functions — no explicit `"functions"` key needed

---

## API Endpoints

All endpoints return 405 for disallowed HTTP methods. All successful responses use `res.json()` which automatically sets `Content-Type: application/json`.

### `GET /api/config`
**Auth:** None (public key is not sensitive).
**Response:** `{ "vapidPublicKey": "..." }`

### `POST /api/subscribe`
**Body:**
```json
{
  "subscription": { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } },
  "intervalHours": 2
}
```
**Action:** Generate UUID, store `sub:{uuid}` in KV as JSON string, `SADD subscriptions {uuid}`.
**Response:** `{ "id": "uuid-xxxx" }`

### `POST /api/unsubscribe`
**Body:** `{ "id": "uuid-xxxx" }`
**Action:** Delete `sub:{uuid}` from KV, `SREM subscriptions {uuid}`.
**Response:** `{ "ok": true }`

### `POST /api/update-preferences`
**Body:**
```json
{
  "id": "uuid-xxxx",
  "dhikr": { "intervalHours": 1 },
  "adhan": { "enabled": false, "lat": 53.3, "lng": -6.2, "prayers": ["fajr", "maghrib"] }
}
```
**Action:** Load `sub:{uuid}`, deep-merge only the fields present in the body, write back.
**Response:** `{ "ok": true }`

### `GET /api/cron?secret=CRON_SECRET`
**Auth:** Query param `secret` must match `CRON_SECRET` env var. Returns 401 if wrong.
**Note:** `CRON_SECRET` appears in Vercel access logs and cron-job.org logs. Treat it as a low-sensitivity token — never reuse it as a real credential.
**Action:** See cron logic below.
**Response:** `{ "sent": 3 }`

---

## Cron Logic (`/api/cron`)

Runs every 5 minutes via cron-job.org.

```
1. Verify secret → 401 if wrong
2. SMEMBERS subscriptions → array of UUIDs
3. let sent = 0
4. For each UUID:
   a. Load sub:{uuid} from KV
   b. If missing → SREM subscriptions {uuid}, continue

   try {
     DHIKR:
     - if dhikr.enabled:
       - elapsed = Date.now() - dhikr.lastFired
       - if elapsed >= intervalHours * 3_600_000:
         - pick random message from REMINDER_MSGS
         - webpush.sendNotification(subscription, payload)
         - update dhikr.lastFired = Date.now() in KV
         - sent++

     ADHAN (future — scaffolded, no client UI yet):
     - if adhan.enabled and lat/lng present:
       - calculate today's prayer times via adhan npm package
       - for each prayer in adhan.prayers:
         - if prayerTime is between now and now+5min:
           - check KV for adhan_fired:{uuid}:{prayer}:{YYYY-MM-DD}
           - if not set: send push, set key with 30-min TTL, sent++

   } catch (err) {
     if (err.statusCode === 410) {
       // Subscription expired or revoked — clean up
       delete sub:{uuid} from KV
       SREM subscriptions {uuid}
     } else {
       // Transient error (FCM 500, network, etc.) — log and continue
       // lastFired is NOT updated, so the next cron run will retry
       console.error('push failed for', uuid, err.statusCode)
     }
     continue to next UUID
   }

5. Return { sent }
```

**Key behaviours:**
- Each UUID is wrapped in its own try/catch — one bad subscription never aborts the rest
- 410 Gone → immediate KV cleanup (no ghost accumulation)
- All other errors → transient, retry next cron run, no state mutation
- Adhan TTL is 30 minutes (not 10) — safely covers two 5-minute cron windows with margin

---

## Push Payload

```json
{
  "title": "Huda — Subhan Allah",
  "body": "سُبْحَانَ اللّٰه\nGlory be to Allah — say it 33 times",
  "tag": "huda-reminder",
  "type": "dhikr"
}
```

For Adhan (future):
```json
{
  "title": "Huda — Time for Asr",
  "body": "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ\nPrayer is better than sleep",
  "tag": "huda-adhan-asr",
  "type": "adhan",
  "prayer": "asr"
}
```

---

## Service Worker Changes

### Remove
- `_swTimer`, `_swIntervalMs`, `_swSetTimer`, `_swFireReminder` global vars and functions
- `SCHEDULE_REMINDER` / `CANCEL_REMINDER` message handlers
- `periodicsync` event listener
- `SW_REMINDERS` array

### Add `push` event listener

```js
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Huda', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'huda-notification',
      renotify: true,
    }).then(() =>
      // Notify open clients to update huda_last_reminder and refresh countdown
      self.clients.matchAll({ includeUncontrolled: true }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'REMINDER_FIRED', ts: Date.now() }))
      )
    )
  );
});
```

---

## App (app.js) Changes

### Helper (add near top of file)

```js
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
```

### `enableReminders()` — full replacement logic

```
1. Check Notification API + DuckDuckGo guard (existing — keep as-is)
2. const perm = await Notification.requestPermission()
3. if perm !== 'granted': localStorage.setItem('huda_notifs', '0'); return
4. localStorage.setItem('huda_notifs', '1')

5. try {
     const cfgRes = await fetch('/api/config')
     const { vapidPublicKey } = await cfgRes.json()

     const existingSub = await navigator.serviceWorker.ready
       .then(reg => reg.pushManager.getSubscription())
     const existingId = localStorage.getItem('huda_push_id')

     if (existingSub && existingId) {
       // Already subscribed — just sync the interval preference
       await fetch('/api/update-preferences', {
         method: 'POST', headers: {'Content-Type':'application/json'},
         body: JSON.stringify({ id: existingId, dhikr: { intervalHours: state.reminderInterval } })
       })
     } else {
       // Fresh subscribe
       const sub = await navigator.serviceWorker.ready
         .then(reg => reg.pushManager.subscribe({
           userVisibleOnly: true,
           applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
         }))
       const res = await fetch('/api/subscribe', {
         method: 'POST', headers: {'Content-Type':'application/json'},
         body: JSON.stringify({ subscription: sub.toJSON(), intervalHours: state.reminderInterval })
       })
       const { id } = await res.json()
       localStorage.setItem('huda_push_id', id)
     }

     localStorage.setItem('huda_last_reminder', Date.now().toString())
   } catch (err) {
     console.error('enableReminders failed', err)
     showToast('Could not enable notifications — please try again')
     localStorage.setItem('huda_notifs', '0')
   }

6. renderHome()
```

### `setReminderInterval(h)`
1. `localStorage.setItem('huda_notifs_interval', h)`
2. POST `{ id: localStorage.getItem('huda_push_id'), dhikr: { intervalHours: h } }` to `/api/update-preferences` (fire-and-forget, no await needed)
3. `localStorage.setItem('huda_last_reminder', Date.now().toString())` — resets countdown locally
4. `renderHome()`

### `disableReminders()`
```
1. localStorage.setItem('huda_notifs', '0')
2. const id = localStorage.getItem('huda_push_id')
3. if (id) fetch('/api/unsubscribe', { method:'POST', body: JSON.stringify({ id }) })
   // fire-and-forget — if offline, server record self-cleans on next 410
4. const reg = await navigator.serviceWorker.ready
   const sub = await reg.pushManager.getSubscription()
   if (sub) await sub.unsubscribe()
5. localStorage.removeItem('huda_push_id')
6. if (_reminderInterval) { clearInterval(_reminderInterval); _reminderInterval = null }
7. renderHome()
```

### `REMINDER_FIRED` message handler — replace body

**Before:**
```js
if (e.data?.type === 'REMINDER_FIRED') {
  _syncSwTimestamp();
}
```

**After:**
```js
if (e.data?.type === 'REMINDER_FIRED') {
  if (e.data.ts) localStorage.setItem('huda_last_reminder', String(e.data.ts));
  // Refresh countdown display if home tab is active
  const el = document.getElementById('home-notif-cd');
  if (el) renderHome();
}
```

### `renderReminderCard()` — add iOS install hint

```js
const isIOS = /iPhone|iPad/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS 13+
const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
// If isIOS && !isInstalled: render hint "Add Huda to your Home Screen to receive background notifications"
// Show this hint instead of the Enable button on uninstalled iOS
```

### Remove entirely
- `setupReminders()`, `_startForegroundPoller()`, `checkMissedReminder()`, `_debouncedCheck()`, `_syncSwTimestamp()`, `fireReminder()`, `_swScheduleReminder()`
- `_reminderInterval`, `_checkPending` globals (note: `_reminderInterval` is still referenced in `disableReminders()` above as a safety clear — set it to `null` after clearing if it still exists during the transition)

### Keep unchanged
- `renderReminderCard()` UI structure
- `testNotification()` — still uses SW directly for instant test
- `REMINDER_MSGS` array — keep client copy for `testNotification()`
- `huda_notifs`, `huda_notifs_interval`, `huda_last_reminder` localStorage keys

---

## Environment Variables (Vercel)

| Variable | Description |
|---|---|
| `VAPID_PUBLIC_KEY` | Generated VAPID public key — exposed via `/api/config` |
| `VAPID_PRIVATE_KEY` | Generated VAPID private key — server only, never sent to client |
| `VAPID_EMAIL` | Contact email for push service e.g. `mailto:you@example.com` |
| `CRON_SECRET` | Random string shared with cron-job.org — appears in access logs, low-sensitivity |
| `KV_REST_API_URL` | Auto-set by Vercel when KV store is linked |
| `KV_REST_API_TOKEN` | Auto-set by Vercel when KV store is linked |

---

## npm Dependencies

The project already has `/package.json` (Expo/React Native manifest). **Do not replace it.** Add only the two new server-side deps:

```json
"web-push": "^3.6.7",
"@vercel/kv": "^1.0.0"
```

`adhan` (`^4.4.3`) is already present — no change needed.

---

## External Setup (one-time)

1. **Generate VAPID keys** — `npx web-push generate-vapid-keys` — copy both keys
2. **Add Vercel KV store** — Vercel dashboard → Storage → KV → Create → link to project (auto-sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`)
3. **Set env vars** — Vercel dashboard → Settings → Environment Variables — add the 4 manual vars above
4. **Create cron-job.org job** — URL: `https://huda-six.vercel.app/api/cron?secret=<CRON_SECRET>`, interval: every 5 minutes

---

## Files to Create / Modify

| File | Action |
|---|---|
| `package.json` | Modify — add `web-push` and `@vercel/kv` to existing Expo manifest |
| `api/config.js` | Create |
| `api/subscribe.js` | Create |
| `api/unsubscribe.js` | Create |
| `api/update-preferences.js` | Create |
| `api/cron.js` | Create |
| `service-worker.js` | Modify — remove SW timer system, add `push` listener |
| `js/app.js` | Modify — replace old notification logic with Web Push flow |
| `vercel.json` | Modify — migrate legacy `"builds"/"routes"` to `"rewrites"` format |

---

## Constraints & Trade-offs

- **iOS Safari:** Web Push works on iOS 16.4+ for installed PWAs only. Uninstalled iOS users (including iPadOS 13+ detected via `maxTouchPoints > 1`) see an "Add to Home Screen" hint instead of the Enable button.
- **cron-job.org dependency:** Free and reliable, but third-party. If it goes down, notifications pause. The app still shows the last-fired time so the user can tell if reminders are stale.
- **5-minute granularity:** Dhikr reminders may fire up to 5 minutes late. Adhan notifications could fire up to 5 minutes early — acceptable for a heads-up notification.
- **`CRON_SECRET` in logs:** Appears in Vercel and cron-job.org logs. Never reuse as a real credential.
- **No accounts:** UUID in localStorage ties the subscription to the device/browser. Clearing browser data orphans the KV record — it self-cleans on next 410 from the push service. User re-enables to create a fresh subscription.
- **Offline unsubscribe:** If the network is down when the user taps "Off", the `/api/unsubscribe` call is fire-and-forget. The browser-side subscription is still revoked (`pushManager.unsubscribe()`), so the push service will return 410 on the next cron attempt and the server record self-cleans.

---

## Future: Adhan Audio

When converting to native (React Native / Expo), Expo Notifications supports scheduled local notifications with custom sound files. The server-side Adhan calculation already scaffolded in the cron function can be reused directly. No structural server changes needed.
