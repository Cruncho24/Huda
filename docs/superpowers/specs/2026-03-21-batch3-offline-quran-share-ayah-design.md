# Batch 3: Offline Quran + Share Ayah — Design Spec

## Goal

Add two features to the Huda PWA: (1) a one-tap "Download for offline" button that pre-fetches all 114 surahs so the full Quran works offline, and (2) a per-ayah share button that lets users copy or natively share any ayah with Arabic text, translation, and reference.

## Architecture

**Offline Quran**: The service worker already caches `api.alquran.cloud` responses using a network-first strategy. The download feature fetches all 114 surahs (Arabic + English) in batches of 5, letting the SW cache each response. No additional storage logic needed — once fetched, the SW serves them offline. A `huda_quran_offline = '1'` localStorage flag tracks completion. Download state and progress live in module-level variables (not state object) since they don't need to persist across reloads.

**Share Ayah**: A 📤 button on each ayah row opens a bottom sheet modal with the Arabic text, English translation, reference line, a Copy button (clipboard API + toast), and a Share button (Web Share API with clipboard fallback). The share sheet is rendered into a fixed overlay div, not re-rendered into the tab content.

**Tech Stack**: Vanilla JS, existing SW cache infrastructure, Web Share API (`navigator.share`), Clipboard API (`navigator.clipboard.writeText`), CSS bottom sheet animation.

---

## Files

| File | Action | Responsibility |
|---|---|---|
| `js/app.js` | Modify | `renderQuranList()` download banner, `downloadQuranOffline()`, `renderSurahContent()` share buttons, `shareAyah()`, share sheet open/close, copy toast |
| `css/styles.css` | Modify | Download banner styles, share sheet overlay + animation, copy toast |
| `service-worker.js` | Modify | Bump to v95 |
| `index.html` | Modify | Bump version strings to v95 |

---

## Feature 1: Offline Quran Download

### UI — Download Banner

Rendered at the top of `renderQuranList()`, above the surah list. Three mutually exclusive states based on `huda_quran_offline` localStorage and `_offlineDownloading` module variable:

**State A — Not downloaded** (`huda_quran_offline` not set, not downloading):
```html
<div class="offline-banner" id="offline-banner">
  <div class="offline-banner-text">
    <span class="offline-banner-icon">📥</span>
    <div>
      <div class="offline-banner-title">Download for offline reading</div>
      <div class="offline-banner-sub">Save all 114 surahs to your device</div>
    </div>
  </div>
  <button class="offline-banner-btn" onclick="downloadQuranOffline()">Download</button>
</div>
```

**State B — Downloading** (`_offlineDownloading === true`):
```html
<div class="offline-banner" id="offline-banner">
  <div class="offline-banner-progress-wrap">
    <div class="offline-banner-title">Downloading… <span id="offline-count">0</span> / 114</div>
    <div class="offline-progress-bar"><div class="offline-progress-fill" id="offline-fill" style="width:0%"></div></div>
  </div>
  <button class="offline-banner-btn offline-cancel-btn" onclick="cancelQuranDownload()">Cancel</button>
</div>
```

**State C — Done** (`huda_quran_offline === '1'`):
```html
<div class="offline-banner offline-banner-done" id="offline-banner">
  <span>✅ Full Quran available offline</span>
</div>
```

### downloadQuranOffline()

```js
let _offlineDownloading = false;
let _offlineCancelled = false;

async function downloadQuranOffline() {
  if (_offlineDownloading) return;
  _offlineDownloading = true;
  _offlineCancelled = false;
  renderQuranList(); // re-render to show progress state

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
        ]).then(([arRes, enRes]) => {
          // Consume responses so SW caches them
          return Promise.all([arRes.json(), enRes.json()]);
        }).then(([arJson, enJson]) => {
          state.quran.cache[j] = { arData: arJson.data, enData: enJson.data };
          done++;
          // Update progress UI without full re-render
          const countEl = document.getElementById('offline-count');
          const fillEl = document.getElementById('offline-fill');
          if (countEl) countEl.textContent = done;
          if (fillEl) fillEl.style.width = `${Math.round(done / 114 * 100)}%`;
        }).catch(() => { done++; }) // silent per-surah failure — don't abort batch
      );
    }
    await Promise.all(batch);
  }

  _offlineDownloading = false;
  if (!_offlineCancelled) {
    localStorage.setItem('huda_quran_offline', '1');
  }
  renderQuranList(); // re-render to show done/cancelled state
}

function cancelQuranDownload() {
  _offlineCancelled = true;
  _offlineDownloading = false;
  renderQuranList();
}
```

### Error handling

- Per-surah failures are silently skipped (counter still increments) — partial download is acceptable; the SW will retry on next open
- If the user cancels, `huda_quran_offline` is NOT set — banner returns to "Download" state
- No global error state needed

---

## Feature 2: Share Ayah

### Share button in renderSurahContent()

In the ayah row template inside `renderSurahContent()`, add a share button after the existing ayah controls:

```html
<button class="ayah-share-btn" onclick="shareAyah(${n}, ${i+1})" aria-label="Share ayah">📤</button>
```

Where `n` is the surah number and `i+1` is the ayah number.

### shareAyah(surahNum, ayahNum)

Reads from `state.quran.cache[surahNum]` (already loaded since we're in the reader). Builds share text and opens the share sheet:

```js
function shareAyah(surahNum, ayahNum) {
  const cached = state.quran.cache[surahNum];
  if (!cached) return;
  const ar = cached.arData.ayahs[ayahNum - 1].text;
  const en = cached.enData.ayahs[ayahNum - 1].text;
  const surahName = SURAHS[surahNum - 1][2]; // e.g. "Al-Fatiha"
  const ref = `Surah ${surahName} (${surahNum}:${ayahNum})`;
  const shareText = `${ar}\n\n${en}\n\n— ${ref}`;
  openShareSheet(shareText, ref);
}
```

### Share sheet

A fixed bottom-sheet overlay rendered into a `<div id="share-sheet-overlay">` appended to `document.body` (created once on first use, reused thereafter).

```js
function openShareSheet(text, title) {
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
      <div class="share-sheet-text">${esc(text)}</div>
      <div class="share-sheet-actions">
        <button class="share-action-btn" onclick="copyShareText(${JSON.stringify(esc(text))})">📋 Copy</button>
        ${navigator.share ? `<button class="share-action-btn share-action-primary" onclick="nativeShare(${JSON.stringify(esc(text))}, ${JSON.stringify(esc(title))})">📤 Share</button>` : ''}
      </div>
      <button class="share-close-btn" onclick="closeShareSheet()">Close</button>
    </div>
  `;
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.querySelector('.share-sheet').classList.add('open'));
}

function closeShareSheet() {
  const overlay = document.getElementById('share-sheet-overlay');
  if (!overlay) return;
  const sheet = overlay.querySelector('.share-sheet');
  if (sheet) sheet.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
}

async function copyShareText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch(e) {
    // Fallback: textarea select
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  showCopyToast();
}

async function nativeShare(text, title) {
  try { await navigator.share({ title, text }); } catch(e) {}
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

### Security note

All user-sourced text passed into `innerHTML` must go through `esc()` (already defined in app.js). The `JSON.stringify(esc(text))` pattern safely passes the escaped text as a JS string argument in the onclick attribute.

---

## CSS

### Download banner

```css
/* ── Offline Download Banner ──────────────────────────────── */
.offline-banner {
  margin: 12px 16px;
  background: var(--surface, #fff);
  border: 1.5px solid var(--border, #e2e8f0);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.offline-banner-done {
  justify-content: center;
  color: var(--emerald, #059669);
  font-weight: 600;
  font-size: 14px;
}
.offline-banner-text { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.offline-banner-icon { font-size: 22px; flex-shrink: 0; }
.offline-banner-title { font-size: 14px; font-weight: 600; color: var(--text, #0f172a); }
.offline-banner-sub { font-size: 12px; color: var(--gray-500, #64748b); margin-top: 1px; }
.offline-banner-btn {
  background: var(--emerald, #059669);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
.offline-cancel-btn { background: var(--gray-400, #94a3b8); }
.offline-banner-progress-wrap { flex: 1; min-width: 0; }
.offline-progress-bar {
  height: 4px;
  background: var(--border, #e2e8f0);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}
.offline-progress-fill {
  height: 100%;
  background: var(--emerald, #059669);
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

### Share sheet

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
  background: var(--surface, #fff);
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
  background: var(--border, #e2e8f0);
  border-radius: 2px;
  margin: 0 auto 16px;
}
.share-sheet-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text, #0f172a);
  white-space: pre-wrap;
  background: var(--bg, #f8fafc);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 14px;
  max-height: 200px;
  overflow-y: auto;
}
.share-sheet-actions { display: flex; gap: 10px; margin-bottom: 10px; }
.share-action-btn {
  flex: 1; padding: 11px;
  border: 1.5px solid var(--border, #e2e8f0);
  background: var(--surface, #fff);
  border-radius: 10px;
  font-size: 14px; font-weight: 600;
  cursor: pointer; color: var(--text, #0f172a);
}
.share-action-primary {
  background: var(--emerald, #059669);
  border-color: var(--emerald, #059669);
  color: #fff;
}
.share-close-btn {
  width: 100%; padding: 11px;
  background: none;
  border: 1.5px solid var(--border, #e2e8f0);
  border-radius: 10px;
  font-size: 14px; font-weight: 600;
  cursor: pointer; color: var(--gray-500, #64748b);
}

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

## Constraints

- `esc()` is already defined in app.js — use it for all user-visible text in innerHTML
- `SURAHS` array is defined in data.js: `SURAHS[n-1][2]` = English name, `SURAHS[n-1][1]` = Arabic name
- `state.quran.cache[n]` has `{ arData, enData }` where `arData.ayahs` and `enData.ayahs` are arrays indexed 0-based
- The share sheet overlay is appended to `document.body`, not to any tab div, so it survives tab switches
- Dark mode: use CSS variables (`var(--surface)`, `var(--text)`, `var(--emerald)`, `var(--border)`, `var(--bg)`) throughout — the existing dark mode class on `body` flips these automatically
