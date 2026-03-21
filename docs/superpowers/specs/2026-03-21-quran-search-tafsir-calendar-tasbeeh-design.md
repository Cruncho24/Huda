# Quran Search, Tafsir, Islamic Calendar & Tasbeeh Counter — Design Spec
**Date:** 2026-03-21
**Project:** Huda Islamic Companion PWA
**Status:** Approved for implementation

---

## Overview

Four independent features added to the existing vanilla JS PWA. Each has its own section below. They share no state and can be implemented in any order. Recommended order: Tasbeeh → Islamic Calendar → Tafsir → Quran Search (simplest to most complex).

---

## Feature 1 — Tasbeeh Counter

### What
A free-form, unlimited tap counter added to the top of the Dhikr tab. No target, no preset — just count. Designed for users doing adhkar beyond the 7 preset dhikrs.

### UI
- New card at the very top of the Dhikr tab, above the existing preset dhikr list
- Large centered count number (e.g. `0`)
- Full card is tappable — tap anywhere to increment
- Small reset button (↺) in the top-right corner of the card
- Label: "Tasbeeh Counter"

### Behaviour
- Tap → increment by 1, haptic feedback (reuse existing `haptic()`)
- Reset button → confirm with nothing (no confirm dialog needed — it's just a counter), reset to 0
- Count persists in `localStorage` as `huda_tasbeeh` (integer string)
- Count is NOT daily-reset — it persists until manually reset (unlike preset dhikrs)

### State
```js
state.tasbeeh = parseInt(localStorage.getItem('huda_tasbeeh') || '0') || 0;
```

### Functions
- `tapTasbeeh()` — increment, save, update DOM in-place (no full re-render)
- `resetTasbeeh()` — set to 0, save, update DOM in-place
- `saveTasbeeh()` — `localStorage.setItem('huda_tasbeeh', String(state.tasbeeh))`

### DOM update (in-place, no re-render)
Update `#tasbeeh-count` text content directly — avoid re-rendering the whole Dhikr tab on every tap.

### Integration
- `renderDhikr()` renders the tasbeeh card at top, then the existing preset dhikr list below
- `state.tasbeeh` added to the state object initialisation

---

## Feature 2 — Islamic Calendar

### What
A Hijri calendar card in the Learn tab showing the current month as a grid, with key Islamic dates highlighted. Previous/next month navigation.

### Where
New card in the Learn hub (`renderLearnHub`), alongside existing cards (New Muslim Guide, Children's Quran, etc.). Clicking it opens a full-screen calendar view (same pattern as other Learn sections).

### UI — Calendar View
- Header: Hijri month name + year, with ‹ › navigation arrows
- Grid: 7-column weekday header (Sun–Sat), days of the month as numbered cells
- Today's Hijri date highlighted in green
- Key dates shown with a dot indicator and label beneath the grid

### Key Islamic Dates (hardcoded)
All dates are in Hijri (month, day) — repeat annually:

| Date (Hijri) | Event |
|---|---|
| Muharram 1 | Islamic New Year |
| Muharram 10 | Ashura |
| Rabi ul-Awwal 12 | Mawlid al-Nabi ﷺ |
| Rajab 27 | Isra wal-Miraj |
| Sha'ban 15 | Laylat al-Bara'ah |
| Ramadan 1 | Start of Ramadan |
| Ramadan 27 | Laylat al-Qadr |
| Shawwal 1 | Eid ul-Fitr |
| Dhul Hijjah 9 | Day of Arafah |
| Dhul Hijjah 10 | Eid ul-Adha |

### Hijri Date Calculation
Use the existing `getHijriSync()` function already in the app. It already converts Gregorian to Hijri. To build the calendar grid:
1. Get today's Hijri date
2. Calculate the first day of the displayed Hijri month by converting Hijri → Gregorian (reverse: try Gregorian dates near the expected new moon until the Hijri month matches)
3. Simpler alternative: use the `aladhan.com` API endpoint `GET /v1/gToH/{dd}-{mm}-{yyyy}` (already in CSP) to find which Gregorian date corresponds to Hijri 1st of the target month — binary search on nearby dates

**Recommended approach:** Since the existing `getHijriSync()` works by calling `aladhan.com`, use the same API to find the Gregorian start of any Hijri month. Cache results in `localStorage` keyed by `huda_cal_{hijriYear}_{hijriMonth}`.

### State
```js
state.calendar = {
  displayMonth: null,  // { year, month } in Hijri — null = current month
};
```

### Functions
- `openCalendar()` — sets display month to current Hijri month, renders full-screen view
- `renderCalendar()` — builds the grid HTML, fetches/caches Gregorian start date if needed
- `navigateCalendar(delta)` — delta = +1 or -1, updates displayMonth, re-renders

---

## Feature 3 — Tafsir

### What
Per-ayah tafsir (Ibn Kathir) accessible from the Quran Study view. Tap a button on any ayah to see its explanation inline.

### API
`GET https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/en.ibn-kathir`

Returns a single ayah's tafsir text. Example: `/v1/ayah/2:255/en.ibn-kathir`

**Fallback:** If `en.ibn-kathir` edition is unavailable for an ayah, fall back to `en.jalalayn` (Tafsir Al-Jalalayn).

### UI
In `renderSurahContent()` (Study view), each ayah card gets a small "Tafsir ›" button below the English translation line. Tapping it:
1. Shows a loading spinner in place
2. Fetches tafsir for that specific ayah
3. Renders the tafsir text in an expandable box below the ayah
4. Button label toggles to "Hide Tafsir"
5. Tap again → collapses, button returns to "Tafsir ›"

### Caching
Tafsir is cached in `state.quran.cache[surahNum]` alongside existing `arData`/`enData`:
```js
state.quran.cache[n] = { arData, enData, tafsirData: {} }
// tafsirData[ayahNum] = "tafsir text string"
```

Also persisted to `localStorage` via the existing `huda_quran` key (same JSON blob). Since tafsir text is long, only cache what the user has actually opened — not the whole surah at once.

### State per ayah card
Track which ayahs have tafsir open using a simple Set in module scope:
```js
const _openTafsir = new Set(); // Set of "surah:ayah" strings
```

`toggleTafsir(surah, ayah)` — opens/closes tafsir for that ayah, fetches if not cached.

### Error handling
If the API fails: show "Tafsir temporarily unavailable" in the expand box. No retry — user can tap again.

### Mushaf view
Tafsir button is NOT shown in Mushaf (page) view — page layout has no room. Study view only.

---

## Feature 4 — Quran Search

### What
Full-text search across all 6,236 ayahs in both Arabic and English. Accessed via a search icon in the Quran tab header.

### API
Al-Quran Cloud search endpoint:
```
GET https://api.alquran.cloud/v1/search/{keyword}/all/{edition}
```
- Arabic: `edition = quran-uthmani`
- English: `edition = en.sahih`

Run both in parallel with `Promise.all`. Returns up to 50 results per edition.

### UI Flow
1. Search icon (🔍) added to the Quran tab header, next to the existing surah filter input
2. Tapping it shows a full-screen search view (replaces the surah list — same pattern as opening a surah)
3. Search input at top, auto-focused
4. As user types (debounced 400ms), fire both API calls
5. Results displayed as a unified list — Arabic matches and English matches merged, deduplicated by surah:ayah
6. Each result row shows:
   - Surah name (Arabic + English) + ayah number badge
   - Matched text snippet (Arabic or English depending on which matched)
7. Tap a result → `openSurah(surahNum)`, scroll to that ayah
8. Back button returns to surah list

### Deduplication
If the same ayah matches both Arabic and English queries, show it once — prefer showing the English snippet (more readable) with an Arabic indicator.

### Debounce
400ms after last keypress before firing API. Minimum 2 characters before searching.

### Empty / loading states
- Typing (< 2 chars): "Type to search the Quran"
- Loading: spinner
- No results: "No results for '{query}'"
- Error: "Search unavailable — check your connection"

### Scroll to ayah
After `openSurah()` loads the surah, scroll to the target ayah. Pass the target ayah number to `openSurah(surahNum, targetAyah)` — after render, `document.getElementById('ayah-{n}')?.scrollIntoView({ behavior: 'smooth' })`.

Each ayah `div` in `renderSurahContent` already needs an `id="ayah-{n}"` attribute added.

### Search view state
```js
state.quran.searchOpen = false;
state.quran.searchQuery = '';
```

### Functions
- `openQuranSearch()` — show search view, focus input
- `closeQuranSearch()` — hide search view, return to surah list
- `runQuranSearch(query)` — debounced, fires both API calls, renders results
- `openSurah(n, targetAyah = null)` — extend existing function with optional scroll target

---

## CSP / vercel.json
No changes needed. `api.alquran.cloud` is already in `connect-src`.

---

## Files to Modify

| File | Changes |
|---|---|
| `js/app.js` | All 4 features — new functions, updated render functions |
| `js/data.js` | Add `ISLAMIC_DATES` array (key dates for calendar) |
| `css/styles.css` | New styles for tasbeeh card, calendar grid, tafsir expand box, search results |

No new files needed. No new APIs beyond what's already in the CSP.

---

## What is NOT included
- Tasbeeh history/log — just the current count
- Multiple tafsir options — Ibn Kathir only (with Jalalayn fallback)
- Saving search results — ephemeral per session
- Calendar event reminders — display only
- Quran search in Mushaf view — Study view result navigation only
