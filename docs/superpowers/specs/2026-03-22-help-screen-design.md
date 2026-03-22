# Help Screen — Design Spec

## Goal

Add a permanent help screen to the Huda PWA so users can discover and understand all app features at any time.

## Architecture

A `?` button is added to the home screen hero (top-right, alongside the existing `🔑` account button). Tapping it calls `openHelpScreen()`, which replaces `#tab-home`'s innerHTML with the help view — identical pattern to how the Quran tab swaps between surah list and surah reader. A back button calls `renderHome()` to restore the home screen. No new state variables needed.

**Tech Stack:** Vanilla JS, hardcoded content (no API), `html.dark` CSS overrides for dark mode.

---

## Files

| File | Action | Responsibility |
|---|---|---|
| `js/home.js` | Modify | Add `?` button to hero in `renderHome()`, add `openHelpScreen()` and `closeHelpScreen()` functions |
| `css/styles.css` | Modify | Help screen styles + dark mode |
| `service-worker.js` | Modify | Bump to `huda-v97` |
| `index.html` | Modify | Bump version strings to `?v=97` |

---

## Feature 1: Entry Point

In `renderHome()`, the hero div already has:
```html
<button class="account-btn" id="account-btn" onclick="openAuthModal()" title="Account">🔑</button>
```

Add a `?` button immediately before or after it:
```html
<button class="help-btn" onclick="openHelpScreen()" aria-label="Help">?</button>
```

Both buttons sit in the top-right of the hero using absolute positioning (`.account-btn` already uses this pattern — match it).

---

## Feature 2: Help Screen

### openHelpScreen()

Replaces `#tab-home` innerHTML with the full help view. Back button calls `closeHelpScreen()`.

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
```

### closeHelpScreen()

```js
function closeHelpScreen() {
  renderHome();
}
```

---

## CSS

Use hardcoded color values (no undefined CSS vars). Follow existing dark mode pattern: `html.dark .class { ... }`.

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

---

## Existing Code Reference

- `renderHome()` in `js/home.js` — add `?` button to hero, `openHelpScreen()` and `closeHelpScreen()` go in same file
- `.account-btn` — existing absolute-positioned button in hero using `top: calc(14px + env(safe-area-inset-top, 0px))` and `right: calc(14px + env(safe-area-inset-right, 0px))`; `.help-btn` mirrors this with `right: calc(52px + env(safe-area-inset-right, 0px))` to sit 38px to the left of it
- Dark mode pattern: `html.dark .class { ... }` in `styles.css`
- Version bump: `service-worker.js` `CACHE_NAME` → `huda-v97`, all `?v=96` → `?v=97` in `index.html`
