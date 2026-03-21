# Batch 3: Offline Quran + Share Ayah — Design Spec

## Goal

Add two features to the Huda PWA: (1) a one-tap "Download for offline" button that pre-fetches all 114 surahs so the full Quran works offline, and (2) a per-ayah share button that lets users copy or natively share any ayah with Arabic text, translation, and reference.

## Architecture

**Offline Quran**: The service worker already caches `api.alquran.cloud` responses using a network-first strategy. The download feature fetches all 114 surahs (Arabic + English) in batches of 5, letting the SW cache each response. No additional storage logic needed — once fetched, the SW serves them offline. A `huda_quran_offline = '1'` localStorage flag tracks completion. Download state and progress live in module-level variables (`_offlineDownloading`, `_offlineCancelled`). **Important**: `renderQuranList()` has an early-return guard (`if (document.getElementById('quran-list-view')) return;`) that prevents re-renders after initial mount. All banner state transitions (A→B→C) must use direct DOM manipulation via a `_renderOfflineBanner()` helper — never call `renderQuranList()` again.

**Share Ayah**: A 📤 button on each ayah row opens a bottom sheet modal. Share text (Arabic + translation + reference) is stored in a module-level `_pendingShareText` variable — never passed as an onclick argument — avoiding all escaping issues. The sheet has a Copy button (clipboard API + toast) and a Share button (Web Share API with clipboard fallback). The overlay div is appended to `document.body` once and reused.

**Tech Stack**: Vanilla JS, existing SW cache infrastructure, Web Share API (`navigator.share`), Clipboard API (`navigator.clipboard.writeText`), CSS bottom sheet animation.

---

## Files

| File | Action | Responsibility |
|---|---|---|
| `js/app.js` | Modify | Download banner in `renderQuranList()`, `_renderOfflineBanner()`, `downloadQuranOffline()`, `cancelQuranDownload()`, share button in `renderSurahContent()`, `shareAyah()`, `openShareSheet()`, `closeShareSheet()`, `copyShareText()`, `nativeShare()`, `showCopyToast()` |
| `css/styles.css` | Modify | Download banner styles + dark mode, share sheet overlay + animation + dark mode, copy toast |
| `service-worker.js` | Modify | Bump to v95 |
| `index.html` | Modify | Bump version strings to v95 |

---

## Feature 1: Offline Quran Download

### Module-level variables (add near top of app.js, with other module vars)

```js
let _offlineDownloading = false;
let _offlineCancelled = false;
```

### UI — Download Banner in renderQuranList()

`renderQuranList()` has a one-shot guard: `if (document.getElementById('quran-list-view')) return;`. The banner is rendered once on initial mount. All subsequent state changes go through `_renderOfflineBanner()`.

In `renderQuranList()`, in the template literal that builds `#quran-list-view`, add the banner HTML **above the surah list** (above the `<div class="surah-list">` or equivalent):

```html
<div id="offline-banner"></div>
```

Then immediately after the innerHTML assignment, call:
```js
_renderOfflineBanner();
```

### _renderOfflineBanner()

Reads current state and updates `#offline-banner` in-place:

```js
function _renderOfflineBanner() {
  const el = document.getElementById('offline-banner');
  if (!el) return;

  if (localStorage.getItem('huda_quran_offline') === '1') {
    el.innerHTML = `<div class="offline-banner offline-banner-done">✅ Full Quran available offline</div>`;
    return;
  }

  if (_offlineDownloading) {
    el.innerHTML = `
      <div class="offline-banner">
        <div class="offline-banner-progress-wrap">
          <div class="offline-banner-title">Downloading… <span id="offline-count">0</span> / 114</div>
          <div class="offline-progress-bar"><div class="offline-progress-fill" id="offline-fill" style="width:0%"></div></div>
        </div>
        <button class="offline-banner-btn offline-cancel-btn" onclick="cancelQuranDownload()">Cancel</button>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="offline-banner">
      <div class="offline-banner-text">
        <span class="offline-banner-icon">📥</span>
        <div>
          <div class="offline-banner-title">Download for offline reading</div>
          <div class="offline-banner-sub">Save all 114 surahs to your device</div>
        </div>
      </div>
      <button class="offline-banner-btn" onclick="downloadQuranOffline()">Download</button>
    </div>`;
}
```

### downloadQuranOffline()

```js
async function downloadQuranOffline() {
  if (_offlineDownloading) return;
  _offlineDownloading = true;
  _offlineCancelled = false;
  _renderOfflineBanner();

  const BATCH = 5;
  let done = 0;

  for (let i = 1; i <= 114; i += BATCH) {
    if (_offlineCancelled) break;
    const batch = [];
    for (let j = i; j < i + BATCH && j <= 114; j++) {
      batch.push(
        Promise.all([
          fetch(`https://api.alquran.cloud/v1/surah/${j}/quran-uthmani`),
          fetch(`https://api.alquran.cloud/v1/surah/${j}/en.sahih`)
        ]).then(([arRes, enRes]) => Promise.all([arRes.json(), enRes.json()]))
          .then(([arJson, enJson]) => {
            state.quran.cache[j] = { arData: arJson.data, enData: enJson.data };
            done++;
            // Update progress in-place (banner may be gone if user navigated away — null-check guards this)
            const countEl = document.getElementById('offline-count');
            const fillEl  = document.getElementById('offline-fill');
            if (countEl) countEl.textContent = done;
            if (fillEl)  fillEl.style.width = `${Math.round(done / 114 * 100)}%`;
          })
          .catch(() => { done++; }) // silent per-surah failure — SW will cache on next open
      );
    }
    await Promise.all(batch);
  }

  _offlineDownloading = false;
  if (!_offlineCancelled) {
    localStorage.setItem('huda_quran_offline', '1');
  }
  _renderOfflineBanner();
}
```

### cancelQuranDownload()

```js
function cancelQuranDownload() {
  _offlineCancelled = true;
  _offlineDownloading = false;
  // In-flight batch promises continue to resolve but their DOM updates
  // are null-guarded and huda_quran_offline is not set since _offlineCancelled=true.
  _renderOfflineBanner();
}
```

---

## Feature 2: Share Ayah

### Module-level variable

```js
let _pendingShareText = '';
```

### Share button in renderSurahContent()

`renderSurahContent()` renders each ayah with a `.ayah-actions` div containing existing buttons (play, bookmark, tafsir). Add the share button as the **4th button inside `.ayah-actions`**, using the existing `.ayah-btn` class:

```html
<button class="ayah-btn" onclick="shareAyah(${n}, ${a.numberInSurah})" aria-label="Share ayah">📤</button>
```

Where `n` is the surah number and `a.numberInSurah` is the ayah number (1-based, matches the convention used by all other buttons in this block). The `.ayah-btn` class already handles styling and dark mode — no new CSS needed for the button itself.

### shareAyah(surahNum, ayahNum)

```js
function shareAyah(surahNum, ayahNum) {
  const cached = state.quran.cache[surahNum];
  if (!cached) return;
  const ar = cached.arData.ayahs[ayahNum - 1].text;
  const en = cached.enData.ayahs[ayahNum - 1].text;
  const surahName = SURAHS[surahNum - 1][2]; // index 2 = English name e.g. "Al-Fatiha"
  const ref = `Surah ${surahName} (${surahNum}:${ayahNum})`;
  _pendingShareText = `${ar}\n\n${en}\n\n— ${ref}`;
  openShareSheet(ref);
}
```

Note: `state.quran.cache[surahNum]` is always populated when the reader is open — `openSurah()` populates it before rendering. The `if (!cached) return` guard is a safety net only.

### Share sheet functions

```js
function openShareSheet(title) {
  let overlay = document.getElementById('share-sheet-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'share-sheet-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="share-sheet-backdrop" onclick="closeShareSheet()"></div>
    <div class="share-sheet">
      <div class="share-sheet-handle"></div>
      <div class="share-sheet-text">${esc(_pendingShareText)}</div>
      <div class="share-sheet-actions">
        <button class="share-action-btn" onclick="copyShareText()">📋 Copy</button>
        ${navigator.share ? `<button class="share-action-btn share-action-primary" onclick="nativeShare()">📤 Share</button>` : ''}
      </div>
      <button class="share-close-btn" onclick="closeShareSheet()">Close</button>
    </div>
  `;
  overlay.style.display = 'flex';
  requestAnimationFrame(() => {
    const sheet = overlay.querySelector('.share-sheet');
    if (sheet) sheet.classList.add('open');
  });
}

function closeShareSheet() {
  const overlay = document.getElementById('share-sheet-overlay');
  if (!overlay) return;
  const sheet = overlay.querySelector('.share-sheet');
  if (sheet) sheet.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
}

async function copyShareText() {
  try {
    await navigator.clipboard.writeText(_pendingShareText);
  } catch(e) {
    // Fallback for browsers without clipboard API
    const ta = document.createElement('textarea');
    ta.value = _pendingShareText;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  showCopyToast();
}

async function nativeShare() {
  try {
    await navigator.share({ text: _pendingShareText });
  } catch(e) {
    // User cancelled or share failed — silent
  }
}

function showCopyToast() {
  let toast = document.getElementById('copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'copy-toast';
    toast.className = 'copy-toast';
    toast.textContent = 'Copied!';
    document.body.appendChild(toast);
  }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
```

---

## CSS

Use hardcoded color values throughout (not undefined CSS vars). Follow existing dark mode pattern: `html.dark .class { ... }` rules.

### Download banner (append to css/styles.css)

```css
/* ── Offline Download Banner ──────────────────────────────── */
.offline-banner {
  margin: 12px 16px 0;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.offline-banner-done {
  justify-content: center;
  color: #059669;
  font-weight: 600;
  font-size: 14px;
}
.offline-banner-text { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.offline-banner-icon { font-size: 22px; flex-shrink: 0; }
.offline-banner-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.offline-banner-sub { font-size: 12px; color: #64748b; margin-top: 1px; }
.offline-banner-btn {
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
.offline-cancel-btn { background: #94a3b8; }
.offline-banner-progress-wrap { flex: 1; min-width: 0; }
.offline-progress-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}
.offline-progress-fill {
  height: 100%;
  background: #059669;
  border-radius: 2px;
  transition: width 0.3s ease;
}
html.dark .offline-banner { background: #1e293b; border-color: #334155; }
html.dark .offline-banner-title { color: #f1f5f9; }
html.dark .offline-banner-sub { color: #94a3b8; }
html.dark .offline-progress-bar { background: #334155; }
```

### Share sheet + toast (append to css/styles.css)

```css
/* ── Share Sheet ──────────────────────────────────────────── */
#share-sheet-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: none; align-items: flex-end; justify-content: center;
}
.share-sheet-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.4);
}
.share-sheet {
  position: relative;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 12px 20px 32px;
  width: 100%;
  max-width: 540px;
  transform: translateY(100%);
  transition: transform 0.25s ease;
}
.share-sheet.open { transform: translateY(0); }
.share-sheet-handle {
  width: 36px; height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin: 0 auto 16px;
}
.share-sheet-text {
  font-size: 14px;
  line-height: 1.7;
  color: #0f172a;
  white-space: pre-wrap;
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 14px;
  max-height: 200px;
  overflow-y: auto;
}
.share-sheet-actions { display: flex; gap: 10px; margin-bottom: 10px; }
.share-action-btn {
  flex: 1; padding: 11px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  font-size: 14px; font-weight: 600;
  cursor: pointer; color: #0f172a;
}
.share-action-primary {
  background: #059669;
  border-color: #059669;
  color: #fff;
}
.share-close-btn {
  width: 100%; padding: 11px;
  background: none;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px; font-weight: 600;
  cursor: pointer; color: #64748b;
}
html.dark .share-sheet { background: #1e293b; }
html.dark .share-sheet-handle { background: #334155; }
html.dark .share-sheet-text { background: #0f172a; color: #f1f5f9; }
html.dark .share-action-btn { background: #1e293b; border-color: #334155; color: #f1f5f9; }
html.dark .share-close-btn { border-color: #334155; color: #94a3b8; }

/* ── Copy Toast ───────────────────────────────────────────── */
.copy-toast {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: #1e293b;
  color: #fff;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
  z-index: 1100;
}
.copy-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```

---

## Existing code reference

- `esc(str)` — defined in app.js, escapes HTML special chars for safe innerHTML use
- `SURAHS[n-1]` — array from data.js: index 0=number, 1=Arabic name, 2=English name, 3=revelation type, 4=verse count, 5=juz
- `state.quran.cache[n]` — `{ arData, enData }` where `arData.ayahs` and `enData.ayahs` are 0-indexed arrays; ayah number is 1-based so use `ayahs[ayahNum - 1]`
- Dark mode pattern: `html.dark .class-name { ... }` rules in styles.css; body gets class `dark` via `applyDarkMode()`
- SW already handles `api.alquran.cloud` with network-first + cache — fetching surahs in `downloadQuranOffline` automatically populates the SW cache
