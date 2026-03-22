# Settings Screen & Onboarding — Design Spec

## Goal

Four improvements for public launch readiness:
1. Remove dead `showTranslation` state from `app.js`
2. Add a Settings screen (replaces the 🔑 account button in the home hero)
3. Move dark mode and reciter controls into Settings
4. Add a first-launch onboarding screen that asks for location permission

---

## Architecture

All new UI follows the existing pattern: global functions render directly into tab/overlay `innerHTML`. No new state management library. Settings and onboarding are full-screen views rendered into `#tab-home`. Preferences persist to `localStorage` (already established keys: `huda_dark`, `huda_fontsize`, `huda_reciter`). Onboarding state: `huda_onboarded` key.

**Tech Stack:** Vanilla JS, plain CSS, `html.dark` class for dark mode, `localStorage` for persistence.

---

## Files

| File | Action | Responsibility |
|---|---|---|
| `js/home.js` | Modify | Replace 🔑 with ⚙️ button; add `openSettings()`, `closeSettings()`; add `showOnboarding()` called from `renderHome()` on first launch |
| `js/app.js` | Modify | Remove dead `showTranslation` state; move `toggleDark()` call to work from Settings |
| `js/prayer.js` | Modify | Export `requestNotifPermission()` as global (already is); no changes needed |
| `css/styles.css` | Modify | Add `.settings-screen`, `.settings-section`, `.settings-row`, `.settings-toggle`, `.onboarding-overlay` styles + dark mode overrides |
| `service-worker.js` | Modify | Bump `CACHE_NAME` to `huda-v107` |
| `index.html` | Modify | Bump all `?v=106` → `?v=107` |

---

## Feature 1: Remove Dead State

In `js/app.js`, remove `showTranslation: false,` from the `state` object. No other references exist.

---

## Feature 2: Settings Screen

### Entry Point

In `js/home.js`, in the `renderHome()` hero template, replace:
```html
<button class="account-btn" id="account-btn" onclick="openAuthModal()" title="Account">🔑</button>
```
with:
```html
<button class="account-btn" id="account-btn" onclick="openSettings()" title="Settings">⚙️</button>
```

### `openSettings()`

Renders into `document.getElementById('tab-home').innerHTML`. Structure:

```
Settings (header with ← Back)
├── Account
│   ├── Sign In / Sign Up row → openAuthModal()
│   └── "Sync bookmarks and reading progress across devices" (subtitle)
├── Quran
│   ├── Reciter → <select> with all 5 reciters, onchange calls setReciter()
│   └── Arabic Font Size → A− current A+ (calls existing setFontSize logic)
├── Appearance
│   └── Dark Mode → toggle switch, calls toggleDark()
├── Notifications
│   ├── If permission === 'granted': toggle ON (visual only — shows notifications are active)
│   ├── If permission === 'default': "Enable" button → calls requestNotifPermission()
│   └── If permission === 'denied': text "Enable in device Settings → [browser] → Location"
├── About
│   ├── About Huda row → openHelpScreen()
│   └── Version row → static "v107"
```

### `closeSettings()`

Calls `renderHome()`.

### Font Size in Settings

The existing `setFontSize(delta)` function in `quran.js` already modifies `state.fontSize` and re-renders the Mushaf page if open. Call it directly from the Settings A−/A+ buttons. The font size value (`state.fontSize`) persists via `localStorage` key `huda_fontsize`.

### Dark Mode Toggle

The existing `toggleDark()` function in `app.js` handles the `html.dark` class and localStorage. The Settings toggle reads `state.darkMode` for its initial state and calls `toggleDark()` on change. Since `openSettings()` renders static HTML, the toggle shows current state at render time — no live sync needed (user can re-open Settings to see updated state).

### Notification Toggle Logic

```js
function _notifSettingsRow() {
  const perm = ('Notification' in window) ? Notification.permission : 'denied';
  if (perm === 'granted') {
    return `<div class="settings-row">
      <span class="settings-label">Prayer Notifications</span>
      <span class="settings-value-on">On</span>
    </div>
    <div class="settings-subtitle">Notifies at Fajr, Dhuhr, Asr, Maghrib and Isha</div>`;
  }
  if (perm === 'default') {
    return `<div class="settings-row">
      <span class="settings-label">Prayer Notifications</span>
      <button class="settings-enable-btn" onclick="requestNotifPermission().then(()=>openSettings())">Enable</button>
    </div>`;
  }
  // denied
  return `<div class="settings-row">
    <span class="settings-label">Prayer Notifications</span>
    <span class="settings-value-off">Blocked</span>
  </div>
  <div class="settings-subtitle">To enable: go to device Settings → [Browser] → Notifications → Allow</div>`;
}
```

---

## Feature 3: Onboarding

### Trigger

At the top of `renderHome()`, before rendering anything:

```js
if (!localStorage.getItem('huda_onboarded')) {
  showOnboarding();
  return;
}
```

### `showOnboarding()`

Renders a full-screen overlay into `#tab-home`:

```
┌─────────────────────────────┐
│                             │
│    🕌                       │
│    Huda                     │
│    Your Islamic companion   │
│                             │
│  ┌─────────────────────┐   │
│  │ 📍 Enable Location  │   │  → calls requestLocation(), then dismissOnboarding()
│  │  For prayer times   │   │
│  └─────────────────────┘   │
│                             │
│  [Get Started]              │  → dismissOnboarding()
│  (skip location)            │
│                             │
└─────────────────────────────┘
```

### `dismissOnboarding()`

```js
function dismissOnboarding() {
  localStorage.setItem('huda_onboarded', '1');
  renderHome();
}
```

### Location flow in onboarding

Tapping "Enable Location" calls `requestLocation()` from `prayer.js` (already global). Since `requestLocation()` renders into `#tab-prayer`, not `#tab-home`, the call just triggers the browser permission prompt. After the prompt resolves (granted or denied), `dismissOnboarding()` is called to move into the app. The prayer tab will have correct times ready when the user navigates there.

Implementation: call `navigator.geolocation.getCurrentPosition()` inline in the onboarding handler (not `requestLocation()` which renders into another tab). On success or error, call `dismissOnboarding()`.

---

## CSS

### Settings

```css
/* ── Settings Screen ─────────────────────────────────────────── */
.settings-screen { display: flex; flex-direction: column; min-height: 100%; background: #f1f5f9; }
.settings-section-label { padding: 12px 16px 6px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
.settings-group { background: #fff; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin-bottom: 8px; }
.settings-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f1f5f9; }
.settings-row:last-child { border-bottom: none; }
.settings-label { font-size: 15px; font-weight: 500; color: #0f172a; }
.settings-subtitle { padding: 4px 16px 12px; font-size: 12px; color: #6b7280; }
.settings-value { font-size: 13px; color: #059669; }
.settings-value-on { font-size: 13px; font-weight: 600; color: #059669; }
.settings-value-off { font-size: 13px; color: #ef4444; }
.settings-enable-btn { background: #059669; color: #fff; border: none; border-radius: 8px; padding: 5px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
.settings-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
.settings-toggle { width: 44px; height: 24px; border-radius: 12px; border: none; cursor: pointer; position: relative; transition: background 0.2s; }
.settings-toggle.on { background: #059669; }
.settings-toggle.off { background: #d1d5db; }
.settings-toggle::after { content: ''; width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; top: 2px; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.settings-toggle.on::after { left: 22px; }
.settings-toggle.off::after { left: 2px; }
.settings-font-row { display: flex; align-items: center; gap: 12px; }
.settings-font-btn { background: none; border: none; color: #059669; font-size: 18px; font-weight: 700; cursor: pointer; padding: 4px 8px; }
.settings-font-val { font-size: 13px; color: #6b7280; min-width: 32px; text-align: center; }
.settings-arrow { color: #9ca3af; font-size: 16px; }
.settings-select { font-size: 13px; color: #059669; border: none; background: none; cursor: pointer; text-align: right; max-width: 160px; }
html.dark .settings-screen { background: #0f172a; }
html.dark .settings-group { background: #1e293b; border-color: #334155; }
html.dark .settings-row { border-color: #334155; }
html.dark .settings-label { color: #f1f5f9; }
html.dark .settings-section-label { color: #94a3b8; }
html.dark .settings-subtitle { color: #64748b; }
html.dark .settings-select { color: #34d399; }
html.dark .settings-font-btn { color: #34d399; }
html.dark .settings-value-on { color: #34d399; }
```

### Onboarding

```css
/* ── Onboarding ──────────────────────────────────────────────── */
.onboarding { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 40px 32px; background: linear-gradient(160deg, #059669 0%, #065f46 100%); text-align: center; }
.onboarding-icon { font-size: 64px; margin-bottom: 16px; }
.onboarding-title { font-size: 36px; font-weight: 800; color: #fff; margin-bottom: 8px; }
.onboarding-subtitle { font-size: 16px; color: rgba(255,255,255,0.85); margin-bottom: 48px; }
.onboarding-location-btn { background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.6); color: #fff; border-radius: 14px; padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; margin-bottom: 16px; width: 100%; max-width: 280px; }
.onboarding-start-btn { background: #fff; color: #059669; border: none; border-radius: 14px; padding: 14px 28px; font-size: 16px; font-weight: 700; cursor: pointer; width: 100%; max-width: 280px; }
.onboarding-skip { margin-top: 16px; font-size: 13px; color: rgba(255,255,255,0.6); cursor: pointer; background: none; border: none; }
```

---

## Version Bump

- `service-worker.js`: `CACHE_NAME` → `'huda-v107'`
- `index.html`: all `?v=106` → `?v=107` (12 occurrences)
