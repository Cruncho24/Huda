# Settings Screen & Onboarding — Design Spec

## Goal

Four improvements for public launch readiness:
1. Remove dead `showTranslation` state from `app.js`
2. Add a Settings screen (replaces the 🔑 account button in the home hero)
3. Move dark mode toggle and font size controls into Settings (global, not buried)
4. Add a first-launch onboarding screen that asks for location permission

---

## Architecture

All new UI follows the existing pattern: global functions render directly into tab `innerHTML`. No new state management. Settings and onboarding render into `#tab-home`. Preferences persist to existing `localStorage` keys (`huda_dark`, `huda_fontsize`, `huda_reciter`). Onboarding state uses new key `huda_onboarded`.

**Tech Stack:** Vanilla JS, plain CSS, `html.dark` class for dark mode, `localStorage` for persistence.

---

## Files

| File | Action | Responsibility |
|---|---|---|
| `js/home.js` | Modify | Replace 🔑 with ⚙️; remove `.theme-bar` from hero; add `openSettings()`, `closeSettings()`, `showOnboarding()`, `onboardingEnableLocation()` |
| `js/app.js` | Modify | Remove dead `showTranslation` from `state.quran`; update `updateAccountBtn()` to not overwrite button text |
| `css/styles.css` | Modify | Append `.settings-*` and `.onboarding-*` styles + dark mode overrides |
| `service-worker.js` | Modify | Bump `CACHE_NAME` to `huda-v107` |
| `index.html` | Modify | Bump all `?v=106` → `?v=107` (12 occurrences) |

---

## Feature 1: Remove Dead State

In `js/app.js`, inside the `state` object, find `state.quran` and remove the line:
```js
showTranslation: false,
```
No other references to `showTranslation` exist in the codebase.

---

## Feature 2: Fix `updateAccountBtn()`

`updateAccountBtn()` in `app.js` currently sets `btn.textContent` to 🔑 or 👤 on the `#account-btn` element. After the button becomes ⚙️, this will silently overwrite the icon. Fix: remove the `btn.textContent` line from `updateAccountBtn()`. The function may still update `btn.title` if desired.

```js
// Before
function updateAccountBtn(user) {
  const btn = document.getElementById('account-btn');
  if (!btn) return;
  btn.textContent = user ? '👤' : '🔑';
  btn.classList.toggle('signed-in', !!user);
  btn.title = user ? user.email : 'Account';
}

// After — remove textContent (button is always ⚙️) and classList.toggle (no longer needed)
function updateAccountBtn(user) {
  const btn = document.getElementById('account-btn');
  if (!btn) return;
  btn.title = user ? `Signed in as ${user.email}` : 'Settings';
}
```

---

## Feature 3: Settings Screen

### Entry Point — `js/home.js`

**Step 1:** In the `renderHome()` hero template, remove the `.theme-bar` block entirely (dark mode moves to Settings). The block to remove looks like:
```html
<div class="theme-bar">
  <div class="theme-toggle-track" onclick="toggleDarkMode()">
    ...
  </div>
</div>
```

**Step 2:** In the hero template, replace the account button:
```js
// Before
<button class="account-btn" id="account-btn" onclick="openAuthModal()" title="Account">🔑</button>

// After
<button class="account-btn" id="account-btn" onclick="openSettings()" title="Settings">⚙️</button>
```

The `?` help button stays as-is.

### `openSettings()` — Full HTML Template

Stop any playing audio before rendering (avoids button/state desync):

```js
function openSettings() {
  // Stop audio if playing to avoid button/state desync
  if (state.audio.player) {
    state.audio.player.pause();
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
  }

  const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  const notifRow = perm === 'granted'
    ? `<div class="settings-row">
        <span class="settings-label">Prayer Notifications</span>
        <span class="settings-value-on">On ✓</span>
       </div>
       <div class="settings-subtitle">Fajr, Dhuhr, Asr, Maghrib and Isha</div>`
    : perm === 'default'
    ? `<div class="settings-row">
        <span class="settings-label">Prayer Notifications</span>
        <button class="settings-enable-btn" onclick="requestNotifPermission().then(()=>openSettings())">Enable</button>
       </div>
       <div class="settings-subtitle">Get notified at each prayer time</div>`
    : `<div class="settings-row">
        <span class="settings-label">Prayer Notifications</span>
        <span class="settings-value-off">Blocked</span>
       </div>
       <div class="settings-subtitle">To enable: device Settings → Browser → Notifications → Allow</div>`;

  const reciterOptions = RECITERS.map(r =>
    `<option value="${r.id}" ${state.reciter === r.id ? 'selected' : ''}>${r.name}</option>`
  ).join('');

  document.getElementById('tab-home').innerHTML = `
    <div class="settings-screen">
      <div class="help-header">
        <button class="help-back-btn" onclick="closeSettings()">← Back</button>
        <div class="help-title">Settings</div>
      </div>
      <div style="overflow-y:auto;flex:1">

        <div class="settings-section-label">Account</div>
        <div class="settings-group">
          <div class="settings-row" onclick="openAuthModal()" style="cursor:pointer">
            <span class="settings-label">Sign In / Sign Up</span>
            <span class="settings-arrow">›</span>
          </div>
          <div class="settings-subtitle">Sync bookmarks and reading progress across devices</div>
        </div>

        <div class="settings-section-label">Quran</div>
        <div class="settings-group">
          <div class="settings-row">
            <span class="settings-label">Reciter</span>
            <select class="settings-select" onchange="setReciter(this.value)">${reciterOptions}</select>
          </div>
          <div class="settings-row">
            <span class="settings-label">Arabic Font Size</span>
            <div class="settings-font-row">
              <button class="settings-font-btn" onclick="changeFontSize(-2);this.closest('.settings-screen').querySelector('.settings-font-val').textContent=state.fontSize+'px'">A−</button>
              <span class="settings-font-val">${state.fontSize}px</span>
              <button class="settings-font-btn" onclick="changeFontSize(2);this.closest('.settings-screen').querySelector('.settings-font-val').textContent=state.fontSize+'px'">A+</button>
            </div>
          </div>
        </div>

        <div class="settings-section-label">Appearance</div>
        <div class="settings-group">
          <div class="settings-row">
            <span class="settings-label">Dark Mode</span>
            <button class="settings-toggle ${state.darkMode ? 'on' : 'off'}"
              onclick="toggleDarkMode();this.classList.toggle('on');this.classList.toggle('off')"
              aria-label="Toggle dark mode"></button>
          </div>
        </div>

        <div class="settings-section-label">Notifications</div>
        <div class="settings-group">
          ${notifRow}
        </div>

        <div class="settings-section-label">About</div>
        <div class="settings-group">
          <div class="settings-row" onclick="closeSettings();setTimeout(openHelpScreen,50)" style="cursor:pointer">
            <span class="settings-label">About Huda</span>
            <span class="settings-arrow">›</span>
          </div>
          <div class="settings-row">
            <span class="settings-label" style="color:#6b7280">Version</span>
            <span class="settings-value" style="color:#9ca3af">v107</span>
          </div>
        </div>

        <div style="height:48px"></div>
      </div>
    </div>
  `;
}
```

**Note:** `requestNotifPermission()` in `prayer.js` is an `async` function that internally calls `renderPrayerTimes()` on completion. Since `#tab-prayer` is hidden while the user is in Settings, that render has no visible effect. The `.then(()=>openSettings())` re-renders Settings with the updated permission state.

**Note:** `changeFontSize(delta)` is defined in `app.js` (not `quran.js`). It updates `state.fontSize` and `localStorage`. The inline onclick updates the displayed value without re-rendering the whole settings screen.

### `closeSettings()`

```js
function closeSettings() {
  renderHome();
}
```

### Fix `toggleDarkMode()` in `app.js`

`toggleDarkMode()` currently ends with `renderHome()` — this was needed to update the dark mode toggle in the home hero. Since the home hero toggle is being removed, `renderHome()` inside `toggleDarkMode()` is no longer needed and must be removed. Without this fix, tapping the dark mode toggle in Settings will immediately destroy the Settings screen.

```js
// Before
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.documentElement.classList.toggle('dark', state.darkMode);
  localStorage.setItem('huda_dark', state.darkMode ? '1' : '');
  renderHome(); // ← remove this line
}

// After
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.documentElement.classList.toggle('dark', state.darkMode);
  localStorage.setItem('huda_dark', state.darkMode ? '1' : '');
}
```

---

## Feature 4: Onboarding

### Trigger in `renderHome()`

Add at the very top of `renderHome()`, before any other logic:

```js
if (!localStorage.getItem('huda_onboarded')) {
  showOnboarding();
  return;
}
```

### `showOnboarding()`

```js
function showOnboarding() {
  document.getElementById('tab-home').innerHTML = `
    <div class="onboarding">
      <div class="onboarding-icon">🕌</div>
      <div class="onboarding-title">Huda</div>
      <div class="onboarding-subtitle">Your Islamic companion</div>
      <button class="onboarding-location-btn" onclick="onboardingEnableLocation(this)">
        📍 Enable Location<br>
        <span style="font-size:12px;opacity:0.8;font-weight:400">For accurate prayer times</span>
      </button>
      <button class="onboarding-start-btn" onclick="dismissOnboarding()">Get Started</button>
      <button class="onboarding-skip" onclick="dismissOnboarding()">Skip for now</button>
    </div>
  `;
}
```

### `onboardingEnableLocation(btn)`

Calls `navigator.geolocation.getCurrentPosition()` inline — performing all the same side effects as `requestLocation()` (saves coords to `state.prayer`, reverse-geocodes city, calls `calcPrayerTimes()`) so the Prayer tab is ready immediately after onboarding. Does NOT render into `#tab-prayer`.

```js
function onboardingEnableLocation(btn) {
  btn.disabled = true;
  btn.textContent = 'Getting location...';
  if (!navigator.geolocation) { dismissOnboarding(); return; }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      state.prayer.location = { lat, lng };
      state.prayer.qibla = calcQibla(lat, lng);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        state.prayer.city = data.address?.city || data.address?.town || data.address?.state || 'Your Location';
      } catch(e) { state.prayer.city = 'Your Location'; }
      calcPrayerTimes(lat, lng);
      dismissOnboarding();
    },
    () => dismissOnboarding(),
    { timeout: 10000 }
  );
}
```

### `dismissOnboarding()`

```js
function dismissOnboarding() {
  localStorage.setItem('huda_onboarded', '1');
  renderHome();
}
```

---

## CSS

Append to the end of `css/styles.css`:

```css
/* ── Settings Screen ─────────────────────────────────────────── */
.settings-screen {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #f1f5f9;
}
.settings-section-label {
  padding: 12px 16px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.settings-group {
  background: #fff;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 8px;
}
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.settings-row:last-child { border-bottom: none; }
.settings-label { font-size: 15px; font-weight: 500; color: #0f172a; }
.settings-subtitle { padding: 2px 16px 12px; font-size: 12px; color: #6b7280; }
.settings-value { font-size: 13px; color: #6b7280; }
.settings-value-on { font-size: 13px; font-weight: 600; color: #059669; }
.settings-value-off { font-size: 13px; font-weight: 600; color: #ef4444; }
.settings-enable-btn {
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 5px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.settings-arrow { color: #9ca3af; font-size: 18px; }
.settings-select {
  font-size: 13px;
  color: #059669;
  border: none;
  background: none;
  cursor: pointer;
  text-align: right;
  max-width: 160px;
}
.settings-font-row { display: flex; align-items: center; gap: 12px; }
.settings-font-btn {
  background: none;
  border: none;
  color: #059669;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
}
.settings-font-val { font-size: 13px; color: #6b7280; min-width: 36px; text-align: center; }
.settings-toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.settings-toggle.on { background: #059669; }
.settings-toggle.off { background: #d1d5db; }
.settings-toggle::after {
  content: '';
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  transition: left 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.settings-toggle.on::after { left: 22px; }
.settings-toggle.off::after { left: 2px; }
html.dark .settings-screen { background: #0f172a; }
html.dark .settings-group { background: #1e293b; border-color: #334155; }
html.dark .settings-row { border-color: #1e293b; }
html.dark .settings-label { color: #f1f5f9; }
html.dark .settings-section-label { color: #94a3b8; }
html.dark .settings-subtitle { color: #64748b; }
html.dark .settings-select { color: #34d399; }
html.dark .settings-font-btn { color: #34d399; }
html.dark .settings-value-on { color: #34d399; }
html.dark .settings-enable-btn { background: #059669; }

/* ── Onboarding ──────────────────────────────────────────────── */
.onboarding {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: calc(40px + env(safe-area-inset-top, 0px)) 32px calc(40px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(160deg, #059669 0%, #065f46 100%);
  text-align: center;
}
.onboarding-icon { font-size: 72px; margin-bottom: 16px; }
.onboarding-title { font-size: 40px; font-weight: 800; color: #fff; margin-bottom: 8px; }
.onboarding-subtitle { font-size: 17px; color: rgba(255,255,255,0.85); margin-bottom: 48px; }
.onboarding-location-btn {
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.6);
  color: #fff;
  border-radius: 14px;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 14px;
  width: 100%;
  max-width: 280px;
  line-height: 1.4;
}
.onboarding-start-btn {
  background: #fff;
  color: #059669;
  border: none;
  border-radius: 14px;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  max-width: 280px;
}
.onboarding-skip {
  margin-top: 16px;
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  cursor: pointer;
  background: none;
  border: none;
}
```

---

## Version Bump

Check the current `?v=` value in `index.html` and `CACHE_NAME` in `service-worker.js` before running the bump. At time of writing both are at `v106`. Bump:
- `service-worker.js`: `CACHE_NAME` → `'huda-v107'`
- `index.html`: replace all `?v=106` → `?v=107` (12 occurrences, verify with `grep -c "v=107" index.html`)
