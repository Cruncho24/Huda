# Batch 3: Offline Quran + Share Ayah — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-tap "Download for offline" button that pre-fetches all 114 surahs into the service worker cache, and a per-ayah 📤 share button that lets users copy or natively share any ayah.

**Architecture:** The service worker already caches `api.alquran.cloud` responses — the download function simply fetches all 114 surahs in batches of 5, which the SW caches automatically. `renderQuranList()` has a one-shot guard so banner state changes use a `_renderOfflineBanner()` helper that does direct DOM manipulation. Share text is stored in a module-level `_pendingShareText` variable (never passed through onclick attributes) and displayed in a bottom sheet overlay appended to `document.body`.

**Tech Stack:** Vanilla JS, existing service worker cache, Web Share API, Clipboard API, CSS bottom sheet animation.

---

## Files

| File | Action | What changes |
|---|---|---|
| `js/app.js` | Modify | 3 module vars, `_renderOfflineBanner()`, `downloadQuranOffline()`, `cancelQuranDownload()` in Quran section; share button in `renderSurahContent()`; `shareAyah()`, `openShareSheet()`, `closeShareSheet()`, `copyShareText()`, `nativeShare()`, `showCopyToast()` after renderSurahContent |
| `css/styles.css` | Modify | Append offline banner CSS + dark mode; append share sheet + toast CSS + dark mode |
| `service-worker.js` | Modify | Bump CACHE_NAME to `huda-v95` |
| `index.html` | Modify | Bump all `?v=94` to `?v=95` |

---

## Task 1: Offline banner — module vars + _renderOfflineBanner() + renderQuranList() hook

**Files:**
- Modify: `js/app.js`

### Context

`renderQuranList()` is at line 667. It has an early-return guard on line 668:
```js
if (document.getElementById('quran-list-view')) return;
```
This means it only runs once. Banner state transitions (idle → downloading → done) must use direct DOM manipulation, not re-calling `renderQuranList()`.

The template literal in `renderQuranList()` currently ends with:
```js
      <div class="search-bar">
        <input class="search-input" id="surah-search" placeholder="🔍 Search by name or number..." oninput="filterSurahs(this.value)">
      </div>
      <div id="surah-list"></div>
    </div>
```
Add `<div id="offline-banner"></div>` between the search bar and `#surah-list`.

After the template assignment (`tab.innerHTML = ...`), the next line is `renderSurahList(SURAHS)` (line 718). Call `_renderOfflineBanner()` right after `renderSurahList(SURAHS)`.

- [ ] **Step 1: Add module-level variables**

Near line 243 (after `let _searchDebounce = null;`), add:

```js
let _offlineDownloading = false;
let _offlineCancelled   = false;
let _pendingShareText   = '';
```

- [ ] **Step 2: Add `<div id="offline-banner"></div>` to renderQuranList() template**

In the template literal inside `renderQuranList()`, find:
```js
      <div id="surah-list"></div>
```
Replace with:
```js
      <div id="offline-banner"></div>
      <div id="surah-list"></div>
```

- [ ] **Step 3: Call _renderOfflineBanner() after renderSurahList()**

Find:
```js
  renderSurahList(SURAHS);
}
```
Replace with:
```js
  renderSurahList(SURAHS);
  _renderOfflineBanner();
}
```

- [ ] **Step 4: Add _renderOfflineBanner() function**

After the closing `}` of `renderQuranList()` (and before `renderSurahList()`), add:

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

- [ ] **Step 5: Verify by inspection**

Open `js/app.js` and confirm:
- `let _offlineDownloading`, `_offlineCancelled`, `_pendingShareText` exist near line 243
- `<div id="offline-banner"></div>` is in the `renderQuranList` template before `<div id="surah-list">`
- `_renderOfflineBanner()` is called after `renderSurahList(SURAHS)`
- `_renderOfflineBanner()` function exists

- [ ] **Step 6: Commit**

```bash
git add js/app.js
git commit -m "feat: add offline banner scaffold to Quran list"
```

---

## Task 2: downloadQuranOffline() + cancelQuranDownload()

**Files:**
- Modify: `js/app.js`

### Context

Add both functions after `_renderOfflineBanner()`. The download fetches 114 surahs in batches of 5 — the SW already caches api.alquran.cloud responses, so no extra storage needed. Progress updates go directly to `#offline-count` and `#offline-fill` DOM elements with null-guards (user may have navigated away mid-download).

- [ ] **Step 1: Add downloadQuranOffline()**

After `_renderOfflineBanner()`, add:

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
            const countEl = document.getElementById('offline-count');
            const fillEl  = document.getElementById('offline-fill');
            if (countEl) countEl.textContent = done;
            if (fillEl)  fillEl.style.width = `${Math.round(done / 114 * 100)}%`;
          })
          .catch(() => { done++; }) // silent per-surah fail — SW will cache on next open
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

- [ ] **Step 2: Add cancelQuranDownload()**

Immediately after `downloadQuranOffline()`, add:

```js
function cancelQuranDownload() {
  _offlineCancelled = true;
  _offlineDownloading = false;
  // In-flight batch promises continue but DOM updates are null-guarded
  // and huda_quran_offline is NOT set since _offlineCancelled=true.
  _renderOfflineBanner();
}
```

- [ ] **Step 3: Verify by inspection**

Confirm `downloadQuranOffline` and `cancelQuranDownload` exist in the file and reference `_offlineDownloading`, `_offlineCancelled`, `_renderOfflineBanner`.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: downloadQuranOffline and cancelQuranDownload"
```

---

## Task 3: Offline banner CSS

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Append offline banner CSS**

Append to the end of `css/styles.css`:

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

- [ ] **Step 2: Smoke test offline banner visually**

Open the app in a browser, go to the Quran tab. Confirm the download banner appears below the search bar. Check dark mode — banner should adapt.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: offline download banner CSS with dark mode"
```

---

## Task 4: Share button in renderSurahContent() + shareAyah() + share sheet functions

**Files:**
- Modify: `js/app.js`

### Context

`renderSurahContent()` is at line 1310. Each ayah has a `.ayah-actions` div with 3 buttons: play (`▶`), bookmark (`🏷️`/`🔖`), and tafsir (`Tafsir ›`). The share button goes as the 4th button inside `.ayah-actions`, after the Tafsir button's closing `</button>` and before `</div>`.

The exact current `.ayah-actions` block to find (lines 1323–1331):
```js
      <div class="ayah-actions">
        <button class="ayah-btn" id="aud-${a.number}" onclick="playAyah(${a.number},${n},${a.numberInSurah})" title="Play">▶</button>
        <button class="ayah-btn ${isBookmarked(n, a.numberInSurah) ? 'bookmarked' : ''}" id="bm-${n}-${a.numberInSurah}"
          onclick="toggleBookmark(${n},${a.numberInSurah},'${a.text.replace(/'/g,"\\'").slice(0,60)}')" title="Bookmark">
          ${isBookmarked(n, a.numberInSurah) ? '🔖' : '🏷️'}
        </button>
        <button class="ayah-btn tafsir-btn" id="tafsir-btn-${n}-${a.numberInSurah}"
          onclick="toggleTafsir(${n},${a.numberInSurah})">Tafsir ›</button>
      </div>
```

`_pendingShareText` is a module-level variable — never pass the share text through the onclick attribute to avoid escaping issues.

`shareAyah()` and all share sheet functions go after `renderSurahContent()` (around line 1337).

- [ ] **Step 1: Add share button inside .ayah-actions**

Find the exact closing of `.ayah-actions` in `renderSurahContent()`:
```js
        <button class="ayah-btn tafsir-btn" id="tafsir-btn-${n}-${a.numberInSurah}"
          onclick="toggleTafsir(${n},${a.numberInSurah})">Tafsir ›</button>
      </div>
```

Replace with:
```js
        <button class="ayah-btn tafsir-btn" id="tafsir-btn-${n}-${a.numberInSurah}"
          onclick="toggleTafsir(${n},${a.numberInSurah})">Tafsir ›</button>
        <button class="ayah-btn" onclick="shareAyah(${n},${a.numberInSurah})" aria-label="Share ayah">📤</button>
      </div>
```

- [ ] **Step 2: Add shareAyah() and all share sheet functions**

After the closing `}` of `renderSurahContent()` (around line 1336), add:

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
    // User cancelled or share not supported — silent
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

- [ ] **Step 3: Verify by inspection**

Open a surah. Confirm each ayah row has a 📤 button as the 4th button in `.ayah-actions`. Tap it — confirm the bottom sheet slides up with Arabic text, English translation, reference line, Copy and (on iOS) Share buttons.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: share ayah button, bottom sheet, copy/share functions"
```

---

## Task 5: Share sheet + toast CSS

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Append share sheet + toast CSS**

Append to the end of `css/styles.css` (after the offline banner CSS added in Task 3):

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

- [ ] **Step 2: Smoke test share sheet visually**

Open a surah, tap 📤 on any ayah. Confirm:
- Bottom sheet slides up from bottom
- Handle bar visible at top
- Arabic text + English + reference visible in text box
- Copy button present; Share button present on iOS (uses `navigator.share`)
- Tap backdrop → sheet slides down
- Tap "Close" → sheet slides down
- Tap Copy → "Copied!" toast appears above nav bar, disappears after 2s
- Dark mode: sheet background is dark, text is light

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: share sheet and copy toast CSS with dark mode"
```

---

## Task 6: Version bump + deploy

**Files:**
- Modify: `service-worker.js`
- Modify: `index.html`

- [ ] **Step 1: Bump service worker to v95**

In `service-worker.js`, change:
```js
const CACHE_NAME = 'huda-v94';
```
To:
```js
const CACHE_NAME = 'huda-v95';
```

- [ ] **Step 2: Bump all version strings in index.html**

In `index.html`, replace all `?v=94` with `?v=95`. This covers:
- `css/styles.css?v=94` → `css/styles.css?v=95`
- `js/adhan.min.js?v=94` → `js/adhan.min.js?v=95`
- `js/auth.js?v=94` → `js/auth.js?v=95`
- `js/sync.js?v=94` → `js/sync.js?v=95`
- `js/data.js?v=94` → `js/data.js?v=95`
- `js/app.js?v=94` → `js/app.js?v=95`

- [ ] **Step 3: Commit and deploy**

```bash
git add service-worker.js index.html
git commit -m "chore: bump to v95 — offline Quran download, share ayah"
npx vercel --prod
```

- [ ] **Step 4: Smoke test on production**

Hard refresh (Cmd+Shift+R) to pick up v95 service worker, then:
- Quran tab → offline download banner visible below search bar
- Tap Download → progress bar counts up to 114/114 → banner shows "✅ Full Quran available offline"
- Open a surah while offline (airplane mode) → loads from SW cache
- Tap 📤 on any ayah → bottom sheet slides up with correct text and reference
- Tap 📋 Copy → "Copied!" toast; paste in Notes app confirms correct Arabic + English + reference
- (iOS) Tap 📤 Share → iOS share sheet appears
- Tap Cancel → sheet slides down
- Dark mode: banner and share sheet look correct
