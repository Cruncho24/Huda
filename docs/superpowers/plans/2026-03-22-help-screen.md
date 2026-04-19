# Help Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a permanent `?` button to the home screen hero that opens a full-screen feature guide listing all app capabilities.

**Architecture:** `openHelpScreen()` replaces `#tab-home` innerHTML with the help view — identical to how the Quran tab swaps between surah list and reader. `closeHelpScreen()` just calls `renderHome()`. No new state variables needed. CSS uses hardcoded color values (no undefined CSS vars) and `html.dark` overrides for dark mode.

**Tech Stack:** Vanilla JS, plain CSS, no bundler, no test suite — verification is manual browser smoke-test.

---

## Files

| File | Action | What changes |
|---|---|---|
| `js/home.js` | Modify | Add `?` button to hero in `renderHome()`, add `openHelpScreen()` and `closeHelpScreen()` at bottom of file |
| `css/styles.css` | Modify | Append help screen styles + dark mode overrides |
| `service-worker.js` | Modify | Bump `CACHE_NAME` to `huda-v97` |
| `index.html` | Modify | Replace all `?v=96` with `?v=97` (12 occurrences) |

---

### Task 1: Add CSS styles

**Files:**
- Modify: `css/styles.css` (append to end of file)

- [ ] **Step 1: Append help screen CSS to the end of `css/styles.css`**

Add exactly this block after the last existing rule (after `.copy-toast.show { ... }`):

```css
/* ── Help Screen ──────────────────────────────────────────── */
.help-screen {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.help-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
}
.help-back-btn {
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: #059669;
  cursor: pointer;
  padding: 4px 0;
}
.help-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}
.help-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 40px;
}
.help-intro {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 4px;
}
.help-section {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 16px;
}
.help-section-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}
.help-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.help-list li {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}
.help-btn {
  position: absolute;
  top: calc(14px + env(safe-area-inset-top, 0px));
  right: calc(52px + env(safe-area-inset-right, 0px));
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
html.dark .help-header { background: #0f172a; border-color: #334155; }
html.dark .help-title { color: #f1f5f9; }
html.dark .help-back-btn { color: #34d399; }
html.dark .help-body { background: #0f172a; }
html.dark .help-section { background: #1e293b; border-color: #334155; }
html.dark .help-section-title { color: #f1f5f9; }
html.dark .help-list li { color: #94a3b8; }
html.dark .help-intro { color: #94a3b8; }
```

- [ ] **Step 2: Verify no syntax errors**

Open `css/styles.css` in a text editor and confirm:
- The block was appended after `.copy-toast.show { ... }` — not inserted mid-file
- No missing closing braces

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: add help screen CSS styles"
```

---

### Task 2: Add JS — entry point button + screen functions

**Files:**
- Modify: `js/home.js`

**Context:** `renderHome()` is in `js/home.js`. The hero `<div>` has `style="position:relative"` and already contains `.account-btn` (absolute-positioned top-right). The new `.help-btn` goes immediately before `.account-btn` in the hero HTML, using `right: calc(52px + ...)` to sit 38px to the left of it.

- [ ] **Step 1: Add `?` button to hero in `renderHome()`**

In `js/home.js`, find the hero section inside the template literal in `renderHome()`. It currently reads:

```js
    <div class="hero fade-in" style="position:relative">
      <button class="account-btn" id="account-btn" onclick="openAuthModal()" title="Account">🔑</button>
```

Add the `?` button immediately before `.account-btn`:

```js
    <div class="hero fade-in" style="position:relative">
      <button class="help-btn" onclick="openHelpScreen()" aria-label="Help">?</button>
      <button class="account-btn" id="account-btn" onclick="openAuthModal()" title="Account">🔑</button>
```

- [ ] **Step 2: Add `openHelpScreen()` and `closeHelpScreen()` to `js/home.js`**

Append both functions at the bottom of `js/home.js` (after `rotateHadith()`):

```js
function openHelpScreen() {
  document.getElementById('tab-home').innerHTML = `
    <div class="help-screen">
      <div class="help-header">
        <button class="help-back-btn" onclick="closeHelpScreen()">← Back</button>
        <div class="help-title">About Huda</div>
      </div>
      <div class="help-body">
        <p class="help-intro">Huda is your all-in-one Islamic companion. Here's what's inside.</p>

        <div class="help-section">
          <div class="help-section-title">📖 Quran</div>
          <ul class="help-list">
            <li>Browse all 114 surahs</li>
            <li>Verse view or Mushaf (page) view</li>
            <li>Audio playback with 5 reciters</li>
            <li>Bookmarks — save ayahs and surahs</li>
            <li>Tafsir — tap any ayah for commentary</li>
            <li>Share any ayah (Arabic + translation)</li>
            <li>Download all surahs for offline reading</li>
            <li>Search the Quran by English keyword</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">🕌 Prayer Times</div>
          <ul class="help-list">
            <li>GPS-based prayer times for your location</li>
            <li>Live countdown to the next prayer</li>
            <li>Qibla compass with live needle</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">📿 Dhikr</div>
          <ul class="help-list">
            <li>Daily dhikr cards with tap counter</li>
            <li>Tasbeeh counter</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">🤲 Duas</div>
          <ul class="help-list">
            <li>Categorised duas for everyday situations</li>
            <li>Duas from the Prophets</li>
            <li>Share any dua</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">📚 Learn</div>
          <ul class="help-list">
            <li>New Muslim Guide — essentials of Islam</li>
            <li>Children's Quran — Arabic alphabet + short surahs</li>
            <li>99 Names of Allah (Asmaul Husna)</li>
            <li>Hajj & Umrah Guide — step-by-step rituals</li>
            <li>Zakat Calculator</li>
            <li>Islamic (Hijri) calendar</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">🏠 Home</div>
          <ul class="help-list">
            <li>Continue reading — picks up where you left off</li>
            <li>Bookmarked ayahs and saved surahs</li>
            <li>Hadith of the Day</li>
            <li>Ayatul Kursi with audio playback</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function closeHelpScreen() {
  renderHome();
}
```

- [ ] **Step 3: Smoke-test in browser**

Open the app on the Home tab and verify:
- A `?` button appears top-right of the hero, to the left of the 🔑 button
- Tapping `?` shows the full help screen with all 6 sections
- Tapping `← Back` returns to the home screen
- Dark mode: toggle dark mode, open help screen — all text and cards are visible (no invisible text)

- [ ] **Step 4: Commit**

```bash
git add js/home.js
git commit -m "feat: add help screen — ? button in hero, openHelpScreen/closeHelpScreen"
```

---

### Task 3: Version bump to v97

**Files:**
- Modify: `service-worker.js` (line 5)
- Modify: `index.html` (12 occurrences of `?v=96`)

- [ ] **Step 1: Bump service worker cache name**

In `service-worker.js` line 5, change:
```js
const CACHE_NAME = 'huda-v96';
```
to:
```js
const CACHE_NAME = 'huda-v97';
```

- [ ] **Step 2: Bump all version strings in `index.html`**

Replace all 12 occurrences of `?v=96` with `?v=97`:

```bash
sed -i '' 's/?v=96/?v=97/g' index.html
```

Verify the count:
```bash
grep -c "v=97" index.html
```
Expected: `12`

Also confirm no `v=96` remains:
```bash
grep "v=96" index.html
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add service-worker.js index.html
git commit -m "chore: bump to v97 — Help screen"
```
