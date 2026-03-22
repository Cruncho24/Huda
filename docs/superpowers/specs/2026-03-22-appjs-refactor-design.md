# app.js Refactor — Design Spec

## Goal

Split the monolithic `js/app.js` (3,176 lines, 133KB) into 7 focused files — one core file plus one per tab — for maintainability and to keep future feature additions scoped to a single file.

## Architecture

Pure mechanical cut-and-paste split. No logic changes, no rewrites, no new abstractions. Each section is lifted verbatim from `app.js` into its new file. All functions remain global (called from `onclick` attributes in HTML strings), `state` stays global defined in `app.js`, and everything continues to work exactly as-is.

Load order: `app.js` first (defines `state`, `esc()`, `RECITERS`), then tab files in any order. Safe because `app.js` registers its init in `DOMContentLoaded` (line 249), which fires only after all synchronous scripts have executed.

**Tech Stack**: Vanilla JS, no bundler, `<script>` tags in `index.html`.

---

## Files

| File | Sections moved from app.js (line ranges) | Est. lines |
|---|---|---|
| `js/app.js` | Keep: Security (5), Reciters (17), State (56), Auth Modal (93), Init (248), Dark Mode (284), Haptic (297), Daily Dhikr Reset (302), Bookmarks (312), Audio (365), Navigation (402), PWA (3115), Font Size (3153) | ~400 |
| `js/home.js` | Hijri Date (431), HOME TAB (464) | ~205 |
| `js/quran.js` | QURAN TAB (669), Surah-level audio (970), Mushaf word-timing (1021), Ayatul Kursi audio (1072), Long-press (1507), Preloaded audio pool (1512), Quran Search (2366), Tafsir (2454) | ~1,400 |
| `js/prayer.js` | PRAYER TIMES TAB (1625), Qibla Compass (1973) | ~514 |
| `js/dhikr.js` | DHIKR TAB (2139), Tasbeeh Counter (2206), Islamic Calendar (2227) | ~226 |
| `js/duas.js` | DUAS TAB (2532), Prophet list (2570), Share Dua (3166) | ~180 |
| `js/learn.js` | LEARN TAB (2709), New Muslim Guide (2744), Children's Quran (2786), 99 Names (2864), Hajj Guide (2923), Zakat Calculator (2961) | ~406 |

**Module-level vars** `_offlineDownloading`, `_offlineCancelled`, `_pendingShareText` move from app.js to `quran.js` (they belong to Quran features).

---

## index.html Changes

Add 6 new `<script>` tags after the existing `app.js` tag, in this order:

```html
<script src="/js/app.js?v=96"></script>
<script src="/js/home.js?v=96"></script>
<script src="/js/quran.js?v=96"></script>
<script src="/js/prayer.js?v=96"></script>
<script src="/js/dhikr.js?v=96"></script>
<script src="/js/duas.js?v=96"></script>
<script src="/js/learn.js?v=96"></script>
```

All existing `?v=95` version strings bump to `?v=96`.

---

## service-worker.js Changes

Add the 6 new JS files to `STATIC_ASSETS` for offline pre-caching:

```js
'/js/home.js',
'/js/quran.js',
'/js/prayer.js',
'/js/dhikr.js',
'/js/duas.js',
'/js/learn.js',
```

Bump `CACHE_NAME` to `'huda-v96'`.

---

## Migration Approach

Each task in the implementation plan follows this pattern:

1. Create the new file with the extracted sections (verbatim copy)
2. Delete those sections from `app.js`
3. Verify `app.js` line count decreased by the expected amount (sanity check against accidental duplication or drops)

Final task: smoke-test by opening the app and clicking through every tab to confirm nothing is broken, then bump versions and deploy.

---

## What Does NOT Change

- All function signatures and names
- All `onclick="..."` attributes in HTML strings
- `state` object structure
- `data.js`, `auth.js`, `sync.js` — untouched
- `css/styles.css` — untouched
- No new abstractions, no module system, no bundler
