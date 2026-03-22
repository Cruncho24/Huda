# app.js Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `js/app.js` (3,176 lines, 133KB) into 7 focused files — one core file plus one per tab — for maintainability and future extensibility.

**Architecture:** Pure mechanical cut-and-paste split. No logic changes, no rewrites, no new abstractions. All functions remain global (called from `onclick` attributes). `app.js` loads first (defines `state`, `esc()`, `RECITERS`). Tab files load after. Safe because `app.js` init uses `DOMContentLoaded` (line 249), which fires only after all synchronous scripts execute.

**Tech Stack:** Vanilla JS, no bundler, `<script>` tags in `index.html`, Vercel PWA.

---

## File Map

| File | Action | Contents |
|---|---|---|
| `js/app.js` | Modify (strip) | Security, Reciters, State, Auth Modal, Init, Dark Mode, Haptic, Dhikr Reset, Bookmarks, Audio, Navigation, PWA, Font Size |
| `js/home.js` | Create | `_hijriCacheMem` var + Hijri Date + HOME TAB (app.js lines 431–668) |
| `js/quran.js` | Create | Module vars (lines 241–246) + QURAN TAB + all audio sections (lines 669–1624) + Quran Search + Tafsir (lines 2366–2526) |
| `js/prayer.js` | Create | PRAYER TIMES TAB + Qibla Compass (lines 1625–2138) |
| `js/dhikr.js` | Create | DHIKR TAB + Tasbeeh + Calendar (lines 2139–2365) + `saveDhikr()` (lines 2527–2530) |
| `js/duas.js` | Create | DUAS TAB + Prophet list (lines 2532–2708) + Share Dua (lines 3166–3176) |
| `js/learn.js` | Create | LEARN TAB + all subsections (lines 2709–3114) |
| `index.html` | Modify | Add 6 `<script>` tags, bump `?v=95` → `?v=96` |
| `service-worker.js` | Modify | Add 6 files to `STATIC_ASSETS`, bump to `huda-v96` |

**IMPORTANT:** Tasks 1–6 only CREATE new files (verbatim copy from app.js). Do NOT modify app.js yet. Task 7 strips app.js after all new files exist. This prevents line-number drift.

**Baseline:** `js/app.js` currently has 142 top-level functions (`grep -c "^function \|^async function " js/app.js`). After the refactor, the sum across all 7 files must equal 142.

---

### Task 1: Create js/home.js

**Files:**
- Create: `js/home.js`

Extract from `js/app.js` lines 431–668. These contain:
- Line 431: `// ── Hijri Date` section header
- Line 432: `let _hijriCacheMem = null;`
- Lines 431–463: Hijri Date helpers (`_hijriDateKey`, `_hijriFromCache`, `loadHijriDate`)
- Lines 464–668: HOME TAB (`renderHome`, `dismissRamadan`, `dismissJumuah`, and helpers)

- [ ] **Step 1: Read lines 431–668 of `js/app.js`**

```bash
sed -n '431,668p' js/app.js | head -5  # spot-check first 5 lines
sed -n '431,668p' js/app.js | tail -5  # spot-check last 5 lines
```

Expected first line: `// ── Hijri Date (API-accurate, localStorage cached) ────────────`
Expected last line: closing `}` of the last HOME TAB function.

- [ ] **Step 2: Create `js/home.js` with a header + verbatim content**

Write `js/home.js` with this exact content:

```
/* ============================================================
   HUDA PWA — Home Tab
   ============================================================ */

[verbatim content of app.js lines 431–668]
```

- [ ] **Step 3: Verify line count and spot-check**

```bash
wc -l js/home.js
grep -n "^function \|^async function " js/home.js
```

Expected: ~242 lines total. Expected functions: `_hijriDateKey`, `_hijriFromCache`, `loadHijriDate`, `renderHome`, `dismissRamadan`, `dismissJumuah` (and any helpers).

- [ ] **Step 4: Commit**

```bash
git add js/home.js
git commit -m "refactor: extract js/home.js (hijri date + home tab)"
```

---

### Task 2: Create js/prayer.js

**Files:**
- Create: `js/prayer.js`

Extract from `js/app.js` lines 1625–2138. These contain:
- Lines 1625–1972: `// ── PRAYER TIMES TAB` (renderPrayer, renderPrayerFallback, renderPrayerTimes, calcPrayerTimes, and all prayer helpers)
- Lines 1973–2138: `// ── Qibla Compass` (openQiblaCompass and all compass helpers)

- [ ] **Step 1: Read lines 1625–2138 of `js/app.js`**

```bash
sed -n '1625,2138p' js/app.js | head -3
sed -n '1625,2138p' js/app.js | tail -3
```

Expected first line: `// ── PRAYER TIMES TAB ──────────────────────────────────────────`
Expected last line: closing `}` of last compass function.

- [ ] **Step 2: Create `js/prayer.js`**

```
/* ============================================================
   HUDA PWA — Prayer Times + Qibla Compass
   ============================================================ */

[verbatim content of app.js lines 1625–2138]
```

- [ ] **Step 3: Verify**

```bash
wc -l js/prayer.js
grep -c "^function \|^async function " js/prayer.js
```

Expected: ~517 lines. Spot-check that `renderPrayer`, `calcPrayerTimes`, and `openQiblaCompass` are present.

- [ ] **Step 4: Commit**

```bash
git add js/prayer.js
git commit -m "refactor: extract js/prayer.js (prayer times + qibla)"
```

---

### Task 3: Create js/dhikr.js

**Files:**
- Create: `js/dhikr.js`

Two non-contiguous ranges from `js/app.js`:
- Lines 2139–2365: `// ── DHIKR TAB` + `// ── Tasbeeh Counter` + `// ── Islamic Calendar`
- Lines 2527–2530: `saveDhikr()` function (sits between Tafsir and DUAS TAB in app.js)

- [ ] **Step 1: Read both ranges**

```bash
sed -n '2139,2365p' js/app.js | head -3   # should start with DHIKR TAB header
sed -n '2527,2530p' js/app.js             # should be the saveDhikr function
```

Expected at 2527: `function saveDhikr()` or similar.

- [ ] **Step 2: Create `js/dhikr.js`**

```
/* ============================================================
   HUDA PWA — Dhikr, Tasbeeh + Islamic Calendar
   ============================================================ */

[verbatim content of app.js lines 2139–2365]

[verbatim content of app.js lines 2527–2530]
```

- [ ] **Step 3: Verify**

```bash
wc -l js/dhikr.js
grep -n "^function \|^async function " js/dhikr.js
```

Expected: ~232 lines. Functions include: `renderDhikr`, `renderDhikrCard`, tasbeeh functions, `renderCalendar`, `saveDhikr`.

- [ ] **Step 4: Commit**

```bash
git add js/dhikr.js
git commit -m "refactor: extract js/dhikr.js (dhikr + tasbeeh + calendar)"
```

---

### Task 4: Create js/duas.js

**Files:**
- Create: `js/duas.js`

Two non-contiguous ranges from `js/app.js`:
- Lines 2532–2708: `// ── DUAS TAB` + `// ── Prophet list`
- Lines 3166–3176: `// ── Share Dua` (at the very end of app.js)

- [ ] **Step 1: Read both ranges**

```bash
sed -n '2532,2708p' js/app.js | head -3   # should start with DUAS TAB header
sed -n '3166,3176p' js/app.js             # should be shareDua function
```

- [ ] **Step 2: Create `js/duas.js`**

```
/* ============================================================
   HUDA PWA — Duas
   ============================================================ */

[verbatim content of app.js lines 2532–2708]

[verbatim content of app.js lines 3166–3176]
```

- [ ] **Step 3: Verify**

```bash
wc -l js/duas.js
grep -n "^function \|^async function " js/duas.js
```

Expected: ~185 lines. Functions include: `renderDuasHome`, `openDuaCategory`, `renderDuaReader`, `renderProphetList`, `openProphetDuas`, `renderProphetDuaReader`, `shareDua`.

- [ ] **Step 4: Commit**

```bash
git add js/duas.js
git commit -m "refactor: extract js/duas.js (duas + share dua)"
```

---

### Task 5: Create js/learn.js

**Files:**
- Create: `js/learn.js`

Extract from `js/app.js` lines 2709–3114. These contain:
- `// ── LEARN TAB` (2709): `renderLearnHub`
- `// ── A) New Muslim Guide` (2744)
- `// ── B) Children's Quran` (2786)
- `// ── C) 99 Names of Allah` (2864)
- `// ── D) Hajj & Umrah Guide` (2923)
- `// ── E) Zakat Calculator` (2961)

Note: `showToast` lives just before line 3115 (lines 3107–3114) — it stays with this section and goes into learn.js since it currently lives there in app.js. Check whether other tabs call `showToast`. If so it belongs in app.js core. Check with:

```bash
grep -n "showToast" js/app.js
```

If `showToast` is called from multiple non-learn sections, keep it in app.js (lines 3107–3114 stay in app.js, and learn.js only takes 2709–3106). If only called from learn/zakat, include it in learn.js.

- [ ] **Step 1: Check showToast usage**

```bash
grep -n "showToast" js/app.js
```

- [ ] **Step 2: Read lines 2709–3114 from `js/app.js`** (adjust end to 3106 if showToast should stay in core)

```bash
sed -n '2709,3114p' js/app.js | head -3
sed -n '2709,3114p' js/app.js | tail -3
```

- [ ] **Step 3: Create `js/learn.js`**

```
/* ============================================================
   HUDA PWA — Learn Tab
   ============================================================ */

[verbatim content of app.js lines 2709–3114]
```

- [ ] **Step 4: Verify**

```bash
wc -l js/learn.js
grep -c "^function \|^async function " js/learn.js
```

Expected: ~409 lines. Functions include: `renderLearnHub`, `openNewMuslimGuide`, `openLesson`, `openChildrensQuran`, `openNamesOfAllah`, `openNameDetail`, `openHajjGuide`, `renderHajjGuide`, `openZakatCalc`, and zakat helpers.

- [ ] **Step 5: Commit**

```bash
git add js/learn.js
git commit -m "refactor: extract js/learn.js (learn tab + all sections)"
```

---

### Task 6: Create js/quran.js

**Files:**
- Create: `js/quran.js`

Three ranges from `js/app.js` (combined into one file):
1. Lines 241–246: module-level vars (`_openTafsir`, `_searchDebounce`, `_offlineDownloading`, `_offlineCancelled`, `_pendingShareText`)
2. Lines 669–1624: `// ── QURAN TAB` through `// ── Preloaded audio pool` (all Quran rendering + audio)
3. Lines 2366–2526: `// ── Quran Search` + `// ── Tafsir`

- [ ] **Step 1: Spot-check the three ranges**

```bash
sed -n '241,246p' js/app.js      # should show 5 module-level var declarations
sed -n '669,672p' js/app.js      # should show QURAN TAB header + renderQuranList start
sed -n '1622,1625p' js/app.js    # should end just before PRAYER TIMES TAB header
sed -n '2366,2368p' js/app.js    # should show Quran Search header
sed -n '2524,2526p' js/app.js    # should end just before saveDhikr
```

- [ ] **Step 2: Create `js/quran.js`**

```
/* ============================================================
   HUDA PWA — Quran Tab
   ============================================================ */

[verbatim content of app.js lines 241–246]

[verbatim content of app.js lines 669–1624]

[verbatim content of app.js lines 2366–2526]
```

- [ ] **Step 3: Verify**

```bash
wc -l js/quran.js
grep -c "^function \|^async function " js/quran.js
```

Expected: ~1,415 lines. Functions include: `renderQuranList`, `renderSurahList`, `renderSurahContent`, `renderMushafPage`, `openSurah`, `openQuranSearch`, `shareAyah`, `downloadQuranOffline`, `cancelQuranDownload`, `_renderOfflineBanner`, `openShareSheet`, `closeShareSheet`, `copyShareText`, `nativeShare`, `showCopyToast`, and all audio/tafsir helpers.

- [ ] **Step 4: Commit**

```bash
git add js/quran.js
git commit -m "refactor: extract js/quran.js (quran tab + audio + search + tafsir)"
```

---

### Task 7: Strip js/app.js

**Files:**
- Modify: `js/app.js`

All 6 new files are created. Now rewrite app.js to contain only the core sections.

The new app.js must contain exactly these ranges from the original file:
- **Lines 1–240**: Security (`esc`), Reciters, State, Auth Modal (up to but not including the module vars)
- **Lines 247–430**: Init, Dark Mode, Haptic, Daily Dhikr Reset, Bookmarks, Audio player, Navigation
- **Lines 3115–3165**: PWA functions + Font Size (adjust to 3107–3165 if `showToast` stayed in app.js per Task 5)

Do NOT include:
- Lines 241–246 (moved to quran.js)
- Lines 431–668 (moved to home.js)
- Lines 669–1624 (moved to quran.js)
- Lines 1625–2138 (moved to prayer.js)
- Lines 2139–2365 (moved to dhikr.js)
- Lines 2366–2526 (moved to quran.js)
- Lines 2527–2530 (moved to dhikr.js)
- Lines 2532–2708 (moved to duas.js)
- Lines 2709–3114 (moved to learn.js)
- Lines 3166–3176 (moved to duas.js)

- [ ] **Step 1: Write new app.js**

Construct the new file as: content of lines 1–240, then content of lines 247–430, then content of lines 3115–3165 (adjust for showToast as noted above). Keep the existing `/* HUDA PWA — App Logic */` file header at the top (it's within lines 1–240).

- [ ] **Step 2: Verify line count**

```bash
wc -l js/app.js
```

Expected: 380–430 lines.

- [ ] **Step 3: Verify core globals are present**

```bash
grep -n "^const state\b" js/app.js
grep -n "^function esc\b" js/app.js
grep -n "^const RECITERS\b" js/app.js
grep -n "DOMContentLoaded" js/app.js
```

All four must be found.

- [ ] **Step 4: Verify moved vars are GONE from app.js**

```bash
grep -n "_hijriCacheMem\|_openTafsir\|_searchDebounce\|_offlineDownloading\|_pendingShareText" js/app.js
```

Expected: no output (0 matches).

- [ ] **Step 5: Verify total function count across all 7 files = 142**

```bash
grep -c "^function \|^async function " js/app.js js/home.js js/quran.js js/prayer.js js/dhikr.js js/duas.js js/learn.js
```

Sum the counts. Must equal **142** (the baseline from the original app.js).

- [ ] **Step 6: Commit**

```bash
git add js/app.js
git commit -m "refactor: strip js/app.js to core only (~400 lines)"
```

---

### Task 8: Update index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Read `index.html`**

Find the script block near the bottom:
```html
<link rel="stylesheet" href="/css/styles.css?v=95">
...
<script src="/js/adhan.min.js?v=95"></script>
...
<script src="/js/auth.js?v=95"></script>
<script src="/js/sync.js?v=95"></script>
<script src="/js/data.js?v=95"></script>
<script src="/js/app.js?v=95"></script>
```

- [ ] **Step 2: Replace all `?v=95` with `?v=96` and add 6 new script tags**

The final script block must be:
```html
<script src="/js/auth.js?v=96"></script>
<script src="/js/sync.js?v=96"></script>
<script src="/js/data.js?v=96"></script>
<script src="/js/app.js?v=96"></script>
<script src="/js/home.js?v=96"></script>
<script src="/js/quran.js?v=96"></script>
<script src="/js/prayer.js?v=96"></script>
<script src="/js/dhikr.js?v=96"></script>
<script src="/js/duas.js?v=96"></script>
<script src="/js/learn.js?v=96"></script>
```

Also update:
```html
<link rel="stylesheet" href="/css/styles.css?v=96">
<script src="/js/adhan.min.js?v=96"></script>
```

- [ ] **Step 3: Verify**

```bash
grep "?v=" index.html
```

Expected: all occurrences show `?v=96`. No `?v=95` remaining. 10 JS script tags total.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "chore: add tab script tags, bump index.html to v96"
```

---

### Task 9: Update service-worker.js

**Files:**
- Modify: `service-worker.js`

- [ ] **Step 1: Read `service-worker.js`**

Find `const CACHE_NAME` and `STATIC_ASSETS`.

- [ ] **Step 2: Bump cache name**

Change:
```js
const CACHE_NAME = 'huda-v95';
```
To:
```js
const CACHE_NAME = 'huda-v96';
```

- [ ] **Step 3: Add new JS files to STATIC_ASSETS**

After the `/js/app.js` entry, add:
```js
'/js/home.js',
'/js/quran.js',
'/js/prayer.js',
'/js/dhikr.js',
'/js/duas.js',
'/js/learn.js',
```

- [ ] **Step 4: Verify**

```bash
grep "huda-v\|js/home\|js/quran\|js/prayer\|js/dhikr\|js/duas\|js/learn" service-worker.js
```

Expected: `huda-v96` and all 6 new files listed.

- [ ] **Step 5: Commit**

```bash
git add service-worker.js
git commit -m "chore: bump SW to v96, add tab JS files to STATIC_ASSETS"
```

---

### Task 10: Smoke test + deploy

**Files:** None (verification + deployment)

No automated test suite exists. Verification is via browser checks and static analysis.

- [ ] **Step 1: Verify no moved vars remain in app.js**

```bash
grep "_hijriCacheMem\|_openTafsir\|_searchDebounce\|_offlineDownloading\|_pendingShareText\|_offlineCancelled" js/app.js
```

Expected: 0 matches.

- [ ] **Step 2: Verify each var is in its correct file**

```bash
grep "_hijriCacheMem" js/home.js
grep "_openTafsir\|_searchDebounce\|_offlineDownloading\|_offlineCancelled\|_pendingShareText" js/quran.js
```

Expected: each found in exactly one file.

- [ ] **Step 3: Confirm function count baseline**

```bash
grep -c "^function \|^async function " js/app.js js/home.js js/quran.js js/prayer.js js/dhikr.js js/duas.js js/learn.js
```

Sum must equal **142**.

- [ ] **Step 4: Confirm script load order in index.html**

```bash
grep "script src" index.html
```

Expected order: `adhan.min.js` → `auth.js` → `sync.js` → `data.js` → `app.js` → `home.js` → `quran.js` → `prayer.js` → `dhikr.js` → `duas.js` → `learn.js`

- [ ] **Step 5: Deploy to Vercel**

```bash
npx vercel --prod
```

Wait for completion. Note the deployment URL (should be https://huda-six.vercel.app).

- [ ] **Step 6: Final commit if any loose changes**

```bash
git status
git log --oneline -12
```

Verify all 10 refactor commits are present and clean.
