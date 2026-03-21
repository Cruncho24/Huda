# Quran Search, Tafsir, Islamic Calendar & Tasbeeh Counter — Design Spec
**Date:** 2026-03-21
**Project:** Huda Islamic Companion PWA
**Status:** Approved for implementation (v2 — all review issues resolved)

---

## Overview

Four independent features added to the existing vanilla JS PWA. Each has its own section below. They share no state and can be implemented in any order. Recommended order: Tasbeeh → Islamic Calendar → Tafsir → Quran Search (simplest to most complex).

---

## Feature 1 — Tasbeeh Counter

### What
A free-form, unlimited tap counter at the top of the Dhikr tab. No target, no preset — just count.

### UI
- New card at the very top of the Dhikr tab, above the existing preset dhikr list
- Large centered count number
- Full card is tappable — tap anywhere to increment
- Small reset button (↺) in the top-right corner
- Label: "Tasbeeh Counter"

### Behaviour
- Tap → increment by 1, haptic feedback (reuse existing `haptic()`)
- Reset → set to 0, no confirm dialog needed
- Count persists in `localStorage` as `huda_tasbeeh` (integer string)
- Count is NOT daily-reset — persists until manually reset (unlike preset dhikrs)

### State
Add `tasbeeh` to the existing `state` object at lines 57–87 of `app.js`:
```js
tasbeeh: parseInt(localStorage.getItem('huda_tasbeeh') || '0') || 0,
```
This must be added to the `state` constant — it is not a standalone initialiser.

### Functions
- `tapTasbeeh()` — `state.tasbeeh++`, save, update `#tasbeeh-count` text content directly (no full re-render)
- `resetTasbeeh()` — `state.tasbeeh = 0`, save, update `#tasbeeh-count` directly
- `saveTasbeeh()` — `localStorage.setItem('huda_tasbeeh', String(state.tasbeeh))`

### DOM update
Update `#tasbeeh-count` text content in-place — never re-render the whole Dhikr tab on each tap.

### Integration
`renderDhikr()` renders the tasbeeh card first, then the preset dhikr list below.

---

## Feature 2 — Islamic Calendar

### What
A Hijri calendar card in the Learn tab. Opens a full-screen calendar view showing the current Hijri month as a grid, with key Islamic dates highlighted.

### Where
New card in `renderLearnHub()`, alongside existing cards. Clicking it opens a full-screen view using the same pattern as other Learn sections (`openCalendar()`).

### UI — Calendar View
- Header: Hijri month name + year, with ‹ › navigation arrows
- Grid: 7-column weekday header (Sun–Sat), days of the month as numbered cells
- Today's Hijri date highlighted in green
- Key dates shown with a coloured dot; a legend list beneath the grid

### Key Islamic Dates (hardcoded in `data.js` as `ISLAMIC_DATES`)

Store as `{ month: number, day: number, name: string }` using numeric Hijri month (1–12) to avoid string-matching issues with the `HIJRI_MONTHS` array:

```js
const ISLAMIC_DATES = [
  { month: 1,  day: 1,  name: 'Islamic New Year' },
  { month: 1,  day: 10, name: 'Ashura' },
  { month: 3,  day: 12, name: "Mawlid al-Nabi ﷺ" },  // Rabi al-Awwal 12
  { month: 7,  day: 27, name: "Isra wal-Mi'raj" },
  { month: 8,  day: 15, name: "Laylat al-Bara'ah" },
  { month: 9,  day: 1,  name: 'Start of Ramadan' },
  { month: 9,  day: 27, name: "Laylat al-Qadr" },
  { month: 10, day: 1,  name: 'Eid ul-Fitr' },
  { month: 12, day: 9,  name: 'Day of Arafah' },
  { month: 12, day: 10, name: 'Eid ul-Adha' },
];
```

**Note on Mawlid:** The date 12 Rabi al-Awwal is the majority scholarly position. A small disclaimer note in the calendar UI is appropriate (e.g. "Dates are approximate — scholars may differ").

### Hijri Calendar Grid Construction

To render a month grid, need to know which Gregorian date corresponds to Hijri day 1 of the displayed month. Use `hToG` (Hijri to Gregorian), **not** `gToH`:

```
GET https://api.aladhan.com/v1/hToG/01-{hijriMonth}-{hijriYear}
```

Returns the Gregorian date for the 1st of that Hijri month. One API call per month navigation. Cache result in `localStorage` as `huda_cal_{hijriYear}_{hijriMonth}`.

Once the Gregorian start date is known:
1. Determine day-of-week for Hijri 1st (using JS `Date` with the Gregorian date)
2. Hijri months are 29 or 30 days — determine length from the Gregorian offset to the 1st of the next Hijri month (one more `hToG` call, also cacheable)
3. Build the grid cells

### State
Add `calendar` to the existing `state` constant at lines 57–87 of `app.js` (same pattern as `tasbeeh`):
```js
calendar: { displayYear: null, displayMonth: null },
```

### Functions
- `openCalendar()` — sets `state.calendar.displayYear/Month` to current Hijri, calls `renderCalendar()`
- `renderCalendar()` — fetches/caches Gregorian start via two `hToG` calls (current month + next month to determine length), builds and injects grid HTML
  - **Error handling:** if either `hToG` call fails, assume 30 days (Hijri maximum) and show a "⚠️ Calendar data unavailable" note beneath the grid
  - **Error handling:** wrap each API call in try/catch independently — first call (month start) failing is fatal for the grid; second call (month length) failing gracefully falls back to 30 days
- `navigateCalendar(delta)` — delta = +1 or -1, advances month with wrap:
  ```js
  let m = state.calendar.displayMonth + delta;
  let y = state.calendar.displayYear;
  if (m > 12) { m = 1; y++; }
  if (m < 1)  { m = 12; y--; }
  state.calendar.displayMonth = m;
  state.calendar.displayYear = y;
  renderCalendar();
  ```

---

## Feature 3 — Tafsir

### What
Per-ayah tafsir accessible from the Quran Study view. Tap a button on any ayah to see its explanation inline.

### API
```
GET https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/en.maududi
```

Maududi's Tafheem ul Quran — a respected English-language Quranic commentary, confirmed available on the API. Example: `/v1/ayah/2:255/en.maududi`.

**Note:** This is not a line-by-line tafsir but a section-level commentary. The response `text` field contains the commentary text for the ayah. This is the best English tafsir option available on the free alquran.cloud API — `en.ibn-kathir` does not exist on this API.

### UI
In `renderSurahContent()` (Study view only — not Mushaf view), each ayah card gets a small "Tafsir ›" button below the English translation. Tapping it:
1. Shows a loading spinner inline
2. Fetches tafsir for that specific ayah
3. Renders the tafsir text in an expandable box below the ayah
4. Button label toggles to "Hide Tafsir"
5. Tap again → collapses

### Caching
Tafsir is cached **separately** from the Quran text — in its own `localStorage` key per surah: `huda_tafsir_{n}`. This is a JSON object mapping ayah numbers to tafsir text strings.

Do NOT store tafsir inside `state.quran.cache[n]` or serialize it into `huda_quran` — tafsir text is long (500–2000 words per ayah) and would cause `QuotaExceededError` when the whole surah cache is serialised together.

```js
// On fetch:
const tafsirCache = JSON.parse(localStorage.getItem(`huda_tafsir_${surahNum}`) || '{}');
tafsirCache[ayahNum] = responseText;
try { localStorage.setItem(`huda_tafsir_${surahNum}`, JSON.stringify(tafsirCache)); } catch(e) {}

// On lookup:
const tafsirCache = JSON.parse(localStorage.getItem(`huda_tafsir_${surahNum}`) || '{}');
const cached = tafsirCache[ayahNum];
```

### Open tafsir tracking
```js
const _openTafsir = new Set(); // Set of "surah:ayah" strings — module scope
```

Call `_openTafsir.clear()` at the start of each `renderSurahContent()` call (DOM is fully rebuilt). Use `const` + `.clear()` — do not reassign the Set. Do NOT restore open tafsir boxes after re-render — ephemeral UI state.

### Error handling
If the API fails: show "Tafsir temporarily unavailable" in the expand box. No retry.

### `toggleTafsir(surah, ayah)`
- If in `_openTafsir`: remove, collapse the box
- If not: add, fetch (check cache first), render text

---

## Feature 4 — Quran Search

### What
Full-text search of English Quran translation (Sahih International) across all 6,236 ayahs. Arabic search is **not included** — the alquran.cloud search endpoint does not support Uthmani script or simple Arabic editions (returns 404). English-only covers the primary use case for this app's audience.

### API
```
GET https://api.alquran.cloud/v1/search/{keyword}/all/en.sahih
```

Returns up to 60 matching ayahs. No pagination available. If results are truncated (60 returned), show a note: "Showing top 60 results — try a more specific search."

### UI Flow
1. Search icon (🔍) added to the Quran tab header — confirm exact DOM anchor in the surah list header during implementation
2. Tapping opens a full-screen search view (hides surah list, shows search UI)
3. Search input at top, auto-focused
4. Typing (debounced 400ms, minimum 2 chars) → fires API call
5. Results list: each row shows surah name, ayah number badge, matching text snippet
6. Tap result → `openSurah(surahNum, targetAyah)` then close search view
7. Back button → returns to surah list

### Search state
Add `searchOpen` and `searchQuery` to the `state.quran` object in the `state` constant at lines 57–87 of `app.js`:
```js
quran: {
  // ... existing properties ...
  searchOpen: false,
  searchQuery: '',
},
```
These are additions to the literal — not runtime assignments.

### Functions
- `openQuranSearch()` — `state.quran.searchOpen = true`, render search view, focus input
- `closeQuranSearch()` — `state.quran.searchOpen = false`, show surah list
- `runQuranSearch(query)` — debounced 400ms; fetches `en.sahih` search; renders results
  - Wrap the fetch in try/catch; on error show "Search unavailable — check your connection"
  - On empty results: "No results for '{query}'"
  - While loading: spinner

### `openSurah(n, targetAyah = null)` — extend existing function
All existing call sites pass only `n` — no changes to call sites needed. `targetAyah` defaults to `null` and existing behaviour is unchanged when not provided.
After `renderSurahContent()` completes and `scrollTop = 0` runs:
```js
if (targetAyah) {
  requestAnimationFrame(() => {
    document.getElementById(`ayah-${targetAyah}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
```

Use `requestAnimationFrame` to ensure scroll runs **after** the existing `scrollTop = 0` reset. Do NOT skip the reset — just schedule the scroll target after it.

Each ayah `div` in `renderSurahContent` needs `id="ayah-{ayahNumber}"` added.

### Empty / error states
| State | Message |
|---|---|
| < 2 chars typed | "Type at least 2 characters to search" |
| Loading | Spinner |
| 0 results | "No results for '{query}'" |
| 60 results | Show results + "Showing top 60 results — try a more specific search" |
| API error | "Search unavailable — check your connection" |

---

## CSP / vercel.json
No changes needed. `api.alquran.cloud` and `api.aladhan.com` are already in `connect-src`.

---

## Files to Modify

| File | Changes |
|---|---|
| `js/app.js` | All 4 features — new functions, updated `renderDhikr`, `renderLearnHub`, `renderSurahContent`, `openSurah` |
| `js/data.js` | Add `ISLAMIC_DATES` array |
| `css/styles.css` | New styles: tasbeeh card, calendar grid, tafsir expand box, search view + results |

No new files. No new APIs beyond what's already allowed in CSP.

---

## What is NOT included
- Tasbeeh history or session log
- Multiple tafsir options (Maududi only; Ibn Kathir not available on this API)
- Arabic Quran search (API limitation)
- Saving search results across sessions
- Calendar event reminders or notifications
- Quran search in Mushaf view
