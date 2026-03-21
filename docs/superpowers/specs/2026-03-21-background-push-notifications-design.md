# Background Push Notifications — Design Spec
**Date:** 2026-03-21
**Project:** Huda Islamic Companion PWA
**Status:** Approved for implementation

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

- 4 serverless API endpoints inside the existing Vercel project
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
  └── SW `push` event     → showNotification()

cron-job.org (every 5 min)
  └── GET /api/cron?secret=XXX
        ├── load all subscriptions from KV
        ├── dhikr check: elapsed >= intervalHours → send push
        ├── adhan check: prayer within next 5 min → send push  (future)
        └── update lastFired in KV

Vercel KV
  └── sub:{uuid} records + "subscriptions" index array

Vercel Functions
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

### Index — key: `subscriptions`

A JSON array of all UUID strings. Used by the cron to load all records without a full KV scan.

### Client-side

The UUID returned from `/api/subscribe` is stored in `localStorage` as `huda_push_id`. Used for subsequent update/unsubscribe calls. No user account needed.

---

## API Endpoints

### `POST /api/subscribe`
**Body:**
```json
{
  "subscription": { "endpoint": "...", "keys": { ... } },
  "intervalHours": 2
}
```
**Action:** Generate UUID, store subscription record in KV, add UUID to index array.
**Response:** `{ "id": "uuid-xxxx" }`

### `POST /api/unsubscribe`
**Body:** `{ "id": "uuid-xxxx" }`
**Action:** Delete `sub:{uuid}` from KV, remove UUID from index array.
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
**Action:** Partial update — only fields present in the body are changed.
**Response:** `{ "ok": true }`

### `GET /api/cron?secret=CRON_SECRET`
**Auth:** Query param `secret` must match `CRON_SECRET` env var. Returns 401 if wrong.
**Action:** See cron logic below.
**Response:** `{ "sent": 3 }`

---

## Cron Logic (`/api/cron`)

Runs every 5 minutes via cron-job.org.

```
1. Verify secret
2. Load "subscriptions" index from KV
3. For each UUID, load sub:{uuid}
4. For each subscription:

   DHIKR:
   - if dhikr.enabled:
     - elapsed = Date.now() - dhikr.lastFired
     - if elapsed >= intervalHours * 3600_000:
       - pick random dhikr reminder message
       - send Web Push to subscription.endpoint
       - update dhikr.lastFired = Date.now() in KV

   ADHAN (future — scaffold is present, no UI yet):
   - if adhan.enabled and lat/lng present:
     - calculate today's prayer times via adhan.js (Node-compatible)
     - for each prayer in adhan.prayers:
       - if prayerTime is between now and now+5min:
         - send Web Push with prayer name and time
         - (no lastFired update needed — prayer times are inherently once/day)

5. Return count of pushes sent
```

**Overlap protection:** The cron runs every 5 minutes. For dhikr, `lastFired` is updated immediately after sending, so even if cron overlaps (unlikely), the next run sees a recent `lastFired` and skips.

For Adhan, the 5-minute window means a prayer could appear in two consecutive cron runs. Guard: before sending, check KV for `adhan_fired:{uuid}:{prayer}:{date}` — set it with 10-minute TTL after firing.

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
- `_swTimer`, `_swIntervalMs`, `_swSetTimer`, `_swFireReminder`, `_swIntervalMs` global vars
- `SCHEDULE_REMINDER` / `CANCEL_REMINDER` message handlers
- `periodicsync` event listener
- `SW_REMINDERS` array (moves to server)

### Add
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
    })
  );
});
```

---

## App (app.js) Changes

### `enableReminders()`
After `Notification.requestPermission()` succeeds:
1. Call `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
2. POST subscription + current `intervalHours` to `/api/subscribe`
3. Store returned UUID in `localStorage` as `huda_push_id`
4. Remove old `setupReminders()`, `_swScheduleReminder()`, `checkMissedReminder()` calls

### `setReminderInterval(h)`
1. POST `{ id, dhikr: { intervalHours: h } }` to `/api/update-preferences`
2. Also resets `huda_last_reminder` locally so the countdown updates

### `disableReminders()`
1. POST `{ id }` to `/api/unsubscribe`
2. Call `pushManager.unsubscribe()` on the browser subscription
3. Clear `huda_push_id` from localStorage

### Remove
- `setupReminders()`, `_startForegroundPoller()`, `checkMissedReminder()`, `_debouncedCheck()`, `_syncSwTimestamp()`, `fireReminder()`, `_swScheduleReminder()`
- `navigator.serviceWorker.addEventListener('message', ...)` REMINDER_FIRED handler
- `_reminderInterval`, `_checkPending` globals

### Keep
- `renderReminderCard()` UI — unchanged
- `testNotification()` — unchanged (still uses SW directly for instant test)
- `REMINDER_MSGS` array — move to server, but keep client copy for `testNotification()`

---

## Environment Variables (Vercel)

| Variable | Description |
|---|---|
| `VAPID_PUBLIC_KEY` | Generated VAPID public key (also exposed to client) |
| `VAPID_PRIVATE_KEY` | Generated VAPID private key (server only) |
| `VAPID_EMAIL` | Contact email for push service (`mailto:you@example.com`) |
| `CRON_SECRET` | Random secret shared with cron-job.org |
| `KV_REST_API_URL` | Auto-set by Vercel when KV store is attached |
| `KV_REST_API_TOKEN` | Auto-set by Vercel when KV store is attached |

---

## External Setup (one-time)

1. **Generate VAPID keys** — `npx web-push generate-vapid-keys`
2. **Add Vercel KV store** — Vercel dashboard → Storage → KV → Create → link to project
3. **Set env vars** — Vercel dashboard → Settings → Environment Variables
4. **Create cron-job.org job** — URL: `https://huda-six.vercel.app/api/cron?secret=XXX`, every 5 minutes

---

## Files to Create / Modify

| File | Action |
|---|---|
| `api/subscribe.js` | Create |
| `api/unsubscribe.js` | Create |
| `api/update-preferences.js` | Create |
| `api/cron.js` | Create |
| `service-worker.js` | Modify — remove SW timer, add `push` listener |
| `js/app.js` | Modify — swap old notification logic for Web Push flow |
| `vercel.json` | Modify — add `functions` config if needed |

---

## Constraints & Trade-offs

- **iOS Safari:** Web Push works on iOS 16.4+ for installed PWAs (added to home screen). Users on older iOS or who haven't installed the PWA won't get background notifications — they'll see a message explaining this.
- **cron-job.org dependency:** Free, reliable, but a third party. If it goes down, notifications pause. Mitigation: the app still shows a countdown and fires when opened (fallback).
- **5-minute granularity:** Adhan notifications could be up to 5 minutes early. Acceptable — most apps notify 5-15 minutes before anyway.
- **No accounts:** UUID in localStorage ties the subscription to the device/browser. Clearing browser data loses the subscription silently — user just re-enables and a new subscription is created.

---

## Future: Adhan Audio

When converting to native (React Native / Expo), Expo Notifications supports scheduled local notifications with custom sound files — no server changes needed for the notification schedule since the logic is already designed for it. The server-side Adhan calculation in the cron function can be reused or mirrored.
