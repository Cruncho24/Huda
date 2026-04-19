# Settings Screen & Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Settings screen (replacing the 🔑 account button), move dark mode / font size / reciter into it, add first-launch onboarding, remove dead `showTranslation` state, and bump to v107.

**Architecture:** Vanilla JS PWA — no bundler, no framework. All new UI renders into `#tab-home` via `innerHTML`, same pattern as the existing Help screen. Settings and Onboarding are global functions in `home.js`. Preferences persist to existing `localStorage` keys; onboarding state uses new key `huda_onboarded`.

**Tech Stack:** Vanilla JS, plain CSS, `html.dark` for dark mode, `localStorage` for persistence.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `css/styles.css` | Modify | Append `.settings-*` and `.onboarding-*` classes + dark overrides |
| `js/app.js` | Modify | Remove `showTranslation` from `state.quran`; rewrite `updateAccountBtn()`; remove `renderHome()` from `toggleDarkMode()` |
| `js/home.js` | Modify | Replace 🔑→⚙️, remove `.theme-bar`, add `openSettings()`, `closeSettings()`, `showOnboarding()`, `onboardingEnableLocation()`, `dismissOnboarding()`, add onboarding gate at top of `renderHome()` |
| `service-worker.js` | Modify | Bump `CACHE_NAME` to `'huda-v107'` |
| `index.html` | Modify | Replace all `?v=106` → `?v=107` (12 occurrences) |

---

## Task 1: Append Settings & Onboarding CSS

**Files:**
- Modify: `css/styles.css` (append at end)

- [ ] **Step 1: Verify the current end of styles.css**

Run: `tail -5 css/styles.css`

Expected: some existing CSS rule (not the new settings classes).

- [ ] **Step 2: Append the CSS block**

Append exactly this to the end of `css/styles.css`:

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

- [ ] **Step 3: Verify append**

Run: `grep -c "settings-screen" css/styles.css`

Expected: `1`

- [ ] **Step 4: Commit**

```bash
git add css/styles.css
git commit -m "feat: add settings and onboarding CSS classes"
```

---

## Task 2: Fix `app.js` — Dead State, updateAccountBtn, toggleDarkMode

**Files:**
- Modify: `js/app.js`

Three independent edits in one task (all in the same file).

- [ ] **Step 1: Find and remove `showTranslation` from state**

Search for the line:

```bash
grep -n "showTranslation" js/app.js
```

Expected: one line like `showTranslation: false,` inside the `state` object.

Remove that line entirely. No other references exist (confirm with `grep -rn "showTranslation" js/` — should return zero results after removal).

- [ ] **Step 2: Rewrite `updateAccountBtn()`**

Find the current function:

```js
function updateAccountBtn(user) {
  const btn = document.getElementById('account-btn');
  if (!btn) return;
  btn.textContent = user ? '👤' : '🔑';
  btn.classList.toggle('signed-in', !!user);
  btn.title = user ? user.email : 'Account';
}
```

Replace it with:

```js
function updateAccountBtn(user) {
  const btn = document.getElementById('account-btn');
  if (!btn) return;
  btn.title = user ? `Signed in as ${user.email}` : 'Settings';
}
```

The `btn.textContent` line is removed (would overwrite ⚙️ with 🔑/👤). The `classList.toggle` line is removed (no longer needed).

- [ ] **Step 3: Remove `renderHome()` from `toggleDarkMode()`**

Find:

```js
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.documentElement.classList.toggle('dark', state.darkMode);
  localStorage.setItem('huda_dark', state.darkMode ? '1' : '');
  renderHome();
}
```

Remove the `renderHome();` line. Result:

```js
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.documentElement.classList.toggle('dark', state.darkMode);
  localStorage.setItem('huda_dark', state.darkMode ? '1' : '');
}
```

Without this fix, tapping the dark mode toggle in Settings destroys the Settings screen immediately.

- [ ] **Step 4: Verify no regressions**

```bash
grep -n "showTranslation" js/app.js
```
Expected: no output.

```bash
grep -n "renderHome" js/app.js
```
Expected: `renderHome` should NOT appear inside `toggleDarkMode`. May appear elsewhere (e.g. `closeSettings` calls it — that's fine, but `closeSettings` is in `home.js`, not `app.js`).

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "fix: remove dead showTranslation, fix updateAccountBtn icon overwrite, stop toggleDarkMode destroying settings"
```

---

## Task 3: Update `home.js` — Settings & Onboarding

**Files:**
- Modify: `js/home.js`

This is the main task. Read `home.js` fully before editing.

- [ ] **Step 1: Read `js/home.js` in full**

Use the Read tool. Understand where `renderHome()` is defined, where the hero template is, and where the `.theme-bar` block and `account-btn` button are.

- [ ] **Step 2: Remove `.theme-bar` block from `renderHome()` hero template**

Inside the `renderHome()` template string, find and remove the entire `.theme-bar` div. It looks like:

```html
<div class="theme-bar">
  <div class="theme-toggle-track" onclick="toggleDarkMode()">
    ...
  </div>
</div>
```

Delete this entire block. Dark mode moves to Settings.

- [ ] **Step 3: Replace 🔑 with ⚙️ and wire to `openSettings()`**

In the same hero template, find:

```js
<button class="account-btn" id="account-btn" onclick="openAuthModal()" title="Account">🔑</button>
```

Replace with:

```js
<button class="account-btn" id="account-btn" onclick="openSettings()" title="Settings">⚙️</button>
```

The `?` help button stays unchanged.

- [ ] **Step 4: Add onboarding gate at the top of `renderHome()`**

At the very top of the `renderHome()` function body, before any other logic, add:

```js
if (!localStorage.getItem('huda_onboarded')) {
  showOnboarding();
  return;
}
```

- [ ] **Step 5: Add `openSettings()` function**

Add the following function to `home.js` (after `renderHome` or near other screen-opening functions):

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

- [ ] **Step 6: Add `closeSettings()` function**

```js
function closeSettings() {
  renderHome();
}
```

- [ ] **Step 7: Add `showOnboarding()` function**

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

- [ ] **Step 8: Add `onboardingEnableLocation(btn)` function**

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

- [ ] **Step 9: Add `dismissOnboarding()` function**

```js
function dismissOnboarding() {
  localStorage.setItem('huda_onboarded', '1');
  renderHome();
}
```

- [ ] **Step 10: Verify all new functions are present**

```bash
grep -n "function openSettings\|function closeSettings\|function showOnboarding\|function onboardingEnableLocation\|function dismissOnboarding" js/home.js
```

Expected: 5 lines, one per function.

- [ ] **Step 11: Verify theme-bar is gone**

```bash
grep -n "theme-bar" js/home.js
```

Expected: no output.

- [ ] **Step 12: Verify ⚙️ is present and 🔑 is gone from the hero template**

```bash
grep -n "openSettings\|openAuthModal" js/home.js
```

Expected: `openSettings` on the account-btn line in `renderHome()`, and `openAuthModal` in `openSettings()`.

- [ ] **Step 13: Commit**

```bash
git add js/home.js
git commit -m "feat: settings screen and first-launch onboarding"
```

---

## Task 4: Version Bump — v106 → v107

**Files:**
- Modify: `service-worker.js`
- Modify: `index.html`

- [ ] **Step 1: Verify current versions**

```bash
grep "CACHE_NAME" service-worker.js
grep -c "v=106" index.html
```

Expected: `huda-v106` and `12`.

- [ ] **Step 2: Bump service-worker.js**

In `service-worker.js`, change:

```js
const CACHE_NAME = 'huda-v106';
```

to:

```js
const CACHE_NAME = 'huda-v107';
```

- [ ] **Step 3: Bump index.html**

Replace all 12 occurrences of `?v=106` with `?v=107` in `index.html`.

Use a global find-and-replace. Verify:

```bash
grep -c "v=107" index.html
```

Expected: `12`

```bash
grep -c "v=106" index.html
```

Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add service-worker.js index.html
git commit -m "chore: bump to v107 — Settings screen, onboarding"
```

---

## Verification Checklist

After all tasks are committed, manually verify in browser (or simulator):

- [ ] Home screen shows ⚙️ button (not 🔑), no dark mode toggle bar
- [ ] Tapping ⚙️ opens Settings screen with Back button, all sections visible
- [ ] Dark Mode toggle in Settings switches theme without destroying the screen
- [ ] Font size A−/A+ updates the displayed value live
- [ ] Reciter dropdown shows correct current selection
- [ ] "About Huda" row navigates to Help screen
- [ ] Back button returns to home
- [ ] On a fresh profile (clear `huda_onboarded` from localStorage), home shows the onboarding screen
- [ ] "Skip for now" dismisses onboarding and shows normal home
- [ ] "Enable Location" shows "Getting location..." then dismisses on success/error
- [ ] After onboarding, subsequent loads go straight to home (no repeat)
