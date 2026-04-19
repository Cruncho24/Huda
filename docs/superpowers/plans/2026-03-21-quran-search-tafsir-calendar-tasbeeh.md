# Quran Search, Tafsir, Islamic Calendar & Tasbeeh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four independent features to the Huda PWA: a Tasbeeh counter, an Islamic Hijri calendar, per-ayah Tafsir, and full-text Quran search.

**Architecture:** All four features live entirely in the existing three files (`js/app.js`, `js/data.js`, `css/styles.css`). No new files. No new APIs beyond what's already in the CSP. Implementation order: Tasbeeh → Islamic Calendar → Tafsir → Quran Search (simplest to most complex).

**Tech Stack:** Vanilla JS, CSS custom properties, localStorage, alquran.cloud API (tafsir + search), aladhan.com API (Hijri calendar).

---

## File Map

| File | What changes |
|---|---|
| `js/data.js` | Add `ISLAMIC_DATES` array |
| `js/app.js` | Add `tasbeeh` + `calendar` + `quran.searchOpen/searchQuery` to `state`; new functions for all 4 features; update `renderDhikr`, `renderLearnHub`, `renderSurahContent`, `openSurah` |
| `css/styles.css` | New styles: tasbeeh card, calendar grid, tafsir expand box, search view + results |

---

## Task 1: Tasbeeh Counter — State + Functions

**Files:**
- Modify: `js/app.js:57-87` (state object)
- Modify: `js/app.js` (add 3 functions after existing dhikr functions ~line 1800)

- [ ] **Step 1: Add `tasbeeh` to the `state` constant**

In `js/app.js` at line 86 (just before the closing `};` of the `state` object, after the `learn` block), add:

```js
  tasbeeh: parseInt(localStorage.getItem('huda_tasbeeh') || '0') || 0,
```

The final lines of `state` should look like:
```js
  learn: {
    currentSection: null, currentLesson: null,
    currentDuaCategory: null, currentDuaIndex: 0,
    currentNameIndex: null, hajjTab: 'umrah',
    zakat: { currency: 'USD', nisab: 'gold' },
  },
  tasbeeh: parseInt(localStorage.getItem('huda_tasbeeh') || '0') || 0,
};
```

- [ ] **Step 2: Add Tasbeeh functions after `resetDhikr` (around line 1793)**

```js
// ── Tasbeeh Counter ───────────────────────────────────────────
function tapTasbeeh() {
  state.tasbeeh++;
  saveTasbeeh();
  haptic();
  const el = document.getElementById('tasbeeh-count');
  if (el) el.textContent = state.tasbeeh;
}

function resetTasbeeh() {
  state.tasbeeh = 0;
  saveTasbeeh();
  const el = document.getElementById('tasbeeh-count');
  if (el) el.textContent = '0';
}

function saveTasbeeh() {
  localStorage.setItem('huda_tasbeeh', String(state.tasbeeh));
}
```

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add Tasbeeh counter state and functions"
```

---

## Task 2: Tasbeeh Counter — UI

**Files:**
- Modify: `js/app.js` — `renderDhikr()` at line 1734
- Modify: `css/styles.css` — add tasbeeh card styles

- [ ] **Step 1: Update `renderDhikr()` to include the tasbeeh card first**

Replace the `tab.innerHTML = \`...\`` assignment in `renderDhikr()` so the tasbeeh card appears before the dhikr list:

```js
function renderDhikr() {
  checkDhikrReset();
  const total = Object.values(state.dhikrCounts).reduce((a, b) => a + b, 0);
  const tab = document.getElementById('tab-dhikr');
  tab.innerHTML = `
    <div class="dhikr-header" style="padding-top:calc(14px + env(safe-area-inset-top,0px))">
      <div>
        <div style="font-size:18px;font-weight:800;color:white">📿 Daily Dhikr</div>
        <div class="dhikr-total">Total today: ${total}</div>
      </div>
      <button class="reset-all-btn" onclick="resetAllDhikr()">Reset All</button>
    </div>
    <div class="tasbeeh-card" onclick="tapTasbeeh()">
      <div class="tasbeeh-label">Tasbeeh Counter</div>
      <div class="tasbeeh-count" id="tasbeeh-count">${state.tasbeeh}</div>
      <button class="tasbeeh-reset" onclick="event.stopPropagation();resetTasbeeh()" title="Reset">↺</button>
    </div>
    <div class="dhikr-list">
      ${DHIKRS.map((d, i) => renderDhikrCard(d, i)).join('')}
    </div>
  `;
}
```

- [ ] **Step 2: Add tasbeeh card styles to `css/styles.css`**

Append at the end of the file:

```css
/* ── Tasbeeh Counter ───────────────────────────────────────── */
.tasbeeh-card {
  position: relative;
  margin: 12px 16px;
  background: var(--card);
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  -webkit-tap-highlight-color: transparent;
}
.tasbeeh-card:active { opacity: 0.85; transform: scale(0.98); }
.tasbeeh-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.tasbeeh-count {
  font-size: 64px;
  font-weight: 800;
  color: var(--emerald);
  line-height: 1;
}
.tasbeeh-reset {
  position: absolute;
  top: 10px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  color: var(--gray-400);
  cursor: pointer;
  padding: 4px 8px;
}
```

- [ ] **Step 3: Manually test**

Open the Dhikr tab. Verify:
- Tasbeeh card appears above the dhikr list
- Tapping the card increments the number
- ↺ button resets to 0 (stops propagation so card doesn't also increment)
- Count persists after page refresh

- [ ] **Step 4: Commit**

```bash
git add js/app.js css/styles.css
git commit -m "feat: Tasbeeh counter UI — tap to count, persist in localStorage"
```

---

## Task 3: Islamic Calendar — Data + State

**Files:**
- Modify: `js/data.js` — add `ISLAMIC_DATES`
- Modify: `js/app.js:57-87` — add `calendar` to `state`

- [ ] **Step 1: Add `ISLAMIC_DATES` to `js/data.js`**

Append at the end of `js/data.js`:

```js
// ── Islamic Key Dates ─────────────────────────────────────────
const ISLAMIC_DATES = [
  { month: 1,  day: 1,  name: 'Islamic New Year' },
  { month: 1,  day: 10, name: 'Ashura' },
  { month: 3,  day: 12, name: "Mawlid al-Nabi \uFDFA" },
  { month: 7,  day: 27, name: "Isra wal-Mi'raj" },
  { month: 8,  day: 15, name: "Laylat al-Bara'ah" },
  { month: 9,  day: 1,  name: 'Start of Ramadan' },
  { month: 9,  day: 27, name: "Laylat al-Qadr" },
  { month: 10, day: 1,  name: 'Eid ul-Fitr' },
  { month: 12, day: 9,  name: 'Day of Arafah' },
  { month: 12, day: 10, name: 'Eid ul-Adha' },
];
```

- [ ] **Step 2: Add `calendar` to `state` in `js/app.js`**

In the `state` constant, add `calendar` alongside `tasbeeh`:

```js
  tasbeeh: parseInt(localStorage.getItem('huda_tasbeeh') || '0') || 0,
  calendar: { displayYear: null, displayMonth: null },
};
```

- [ ] **Step 3: Commit**

```bash
git add js/data.js js/app.js
git commit -m "feat: add ISLAMIC_DATES data and calendar state"
```

---

## Task 4: Islamic Calendar — Functions

**Files:**
- Modify: `js/app.js` — add `openCalendar`, `renderCalendar`, `navigateCalendar`

- [ ] **Step 1: Add calendar functions after the tasbeeh functions**

```js
// ── Islamic Calendar ──────────────────────────────────────────
const HIJRI_MONTHS = [
  'Muharram','Safar','Rabi al-Awwal','Rabi al-Thani',
  'Jumada al-Awwal','Jumada al-Thani','Rajab','Sha\'ban',
  'Ramadan','Shawwal','Dhu al-Qi\'dah','Dhu al-Hijjah'
];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

async function openCalendar() {
  const tab = document.getElementById('tab-learn');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderLearnHub()">←</button>
      <h2>Islamic Calendar</h2>
    </div>
    <div id="cal-container" style="padding:16px">
      <div class="loading-state"><div class="spinner"></div><p>Loading calendar...</p></div>
    </div>
  `;
  // Get current Hijri date from aladhan
  try {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2,'0');
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const yyyy = today.getFullYear();
    const res = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`);
    const json = await res.json();
    const hijri = json.data.hijri;
    state.calendar.displayYear = parseInt(hijri.year);
    state.calendar.displayMonth = parseInt(hijri.month.number);
  } catch(e) {
    // fallback: keep null and renderCalendar will show error
  }
  renderCalendar();
}

async function renderCalendar() {
  const container = document.getElementById('cal-container');
  if (!container) return;
  const y = state.calendar.displayYear;
  const m = state.calendar.displayMonth;
  if (!y || !m) {
    container.innerHTML = `<p class="cal-error">⚠️ Calendar data unavailable</p>`;
    return;
  }

  container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>`;

  // Fetch Gregorian start date of this Hijri month (with cache)
  const cacheKey = `huda_cal_${y}_${m}`;
  const nextCacheKey = `huda_cal_${m === 12 ? y+1 : y}_${m === 12 ? 1 : m+1}`;

  let startGreg, monthLen;
  try {
    let startData = localStorage.getItem(cacheKey);
    if (!startData) {
      const r = await fetch(`https://api.aladhan.com/v1/hToG/01-${String(m).padStart(2,'0')}-${y}`);
      const j = await r.json();
      startData = j.data.gregorian.date; // "DD-MM-YYYY"
      try { localStorage.setItem(cacheKey, startData); } catch(e) {}
    }
    // Parse "DD-MM-YYYY"
    const [dd,mm,yyyy] = startData.split('-').map(Number);
    startGreg = new Date(yyyy, mm-1, dd);
  } catch(e) {
    container.innerHTML = `<p class="cal-error">⚠️ Calendar data unavailable</p>`;
    return;
  }

  // Fetch start of next Hijri month to determine current month length
  try {
    let nextData = localStorage.getItem(nextCacheKey);
    if (!nextData) {
      const nm = m === 12 ? 1 : m+1;
      const ny = m === 12 ? y+1 : y;
      const r = await fetch(`https://api.aladhan.com/v1/hToG/01-${String(nm).padStart(2,'0')}-${ny}`);
      const j = await r.json();
      nextData = j.data.gregorian.date;
      try { localStorage.setItem(nextCacheKey, nextData); } catch(e) {}
    }
    const [dd,mm,yyyy] = nextData.split('-').map(Number);
    const nextGreg = new Date(yyyy, mm-1, dd);
    monthLen = Math.round((nextGreg - startGreg) / 86400000);
    if (monthLen < 29 || monthLen > 30) monthLen = 30; // sanity
  } catch(e) {
    monthLen = 30; // safe fallback
  }

  // Today's Hijri date for highlighting
  const todayGreg = new Date();
  todayGreg.setHours(0,0,0,0);

  // Key dates for this month
  const keyDates = ISLAMIC_DATES.filter(d => d.month === m);

  // Build grid
  const startDow = startGreg.getDay(); // 0=Sun
  let cells = '';
  // Empty cells before day 1
  for (let i = 0; i < startDow; i++) cells += `<div class="cal-cell cal-empty"></div>`;
  for (let day = 1; day <= monthLen; day++) {
    const gregDate = new Date(startGreg);
    gregDate.setDate(startGreg.getDate() + day - 1);
    gregDate.setHours(0,0,0,0);
    const isToday = gregDate.getTime() === todayGreg.getTime();
    const keyDate = keyDates.find(d => d.day === day);
    cells += `
      <div class="cal-cell${isToday ? ' cal-today' : ''}${keyDate ? ' cal-key' : ''}">
        <span class="cal-day-num">${day}</span>
        ${keyDate ? '<span class="cal-dot"></span>' : ''}
      </div>`;
  }

  const legendHtml = keyDates.length ? `
    <div class="cal-legend">
      ${keyDates.map(d => `<div class="cal-legend-item"><span class="cal-dot"></span>${d.day} — ${d.name}</div>`).join('')}
    </div>` : '';

  container.innerHTML = `
    <div class="cal-nav">
      <button class="cal-nav-btn" onclick="navigateCalendar(-1)">‹</button>
      <div class="cal-month-title">${HIJRI_MONTHS[m-1]} ${y} AH</div>
      <button class="cal-nav-btn" onclick="navigateCalendar(1)">›</button>
    </div>
    <div class="cal-grid">
      ${WEEKDAYS.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
      ${cells}
    </div>
    ${legendHtml}
    <p class="cal-disclaimer">Dates are approximate — scholars may differ on exact sightings.</p>
  `;
}

function navigateCalendar(delta) {
  let m = state.calendar.displayMonth + delta;
  let y = state.calendar.displayYear;
  if (m > 12) { m = 1; y++; }
  if (m < 1)  { m = 12; y--; }
  state.calendar.displayMonth = m;
  state.calendar.displayYear = y;
  renderCalendar();
}
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "feat: Islamic calendar functions — Hijri grid with key dates and navigation"
```

---

## Task 5: Islamic Calendar — UI Card + Styles

**Files:**
- Modify: `js/app.js` — `renderLearnHub()` at line 2001
- Modify: `css/styles.css` — calendar styles

- [ ] **Step 1: Add Islamic Calendar card to `renderLearnHub()`**

In the `.map()` array inside `renderLearnHub()`, add a calendar entry:

```js
{ icon:'🗓️', bg:'#e0f2fe', title:'Islamic Calendar', desc:'Hijri calendar with key Islamic dates', fn:'openCalendar' },
```

So the array becomes:
```js
[
  { icon:'🕌', bg:'#d1fae5', title:'New Muslim Guide', desc:'7 essential lessons for new Muslims', fn:'openNewMuslimGuide' },
  { icon:'🔤', bg:'#dbeafe', title:"Children's Quran", desc:'Arabic alphabet & short surahs', fn:'openChildrensQuran' },
  { icon:'✨', bg:'#fef3c7', title:'99 Names of Allah', desc:'Asmaul Husna — all 99 names', fn:'openNamesOfAllah' },
  { icon:'🕋', bg:'#ede9fe', title:'Hajj & Umrah Guide', desc:'Complete step-by-step guide', fn:'openHajjGuide' },
  { icon:'💰', bg:'#fce7f3', title:'Zakat Calculator', desc:'Calculate your obligatory charity', fn:'openZakatCalc' },
  { icon:'🗓️', bg:'#e0f2fe', title:'Islamic Calendar', desc:'Hijri calendar with key Islamic dates', fn:'openCalendar' },
]
```

- [ ] **Step 2: Add calendar styles to `css/styles.css`**

```css
/* ── Islamic Calendar ──────────────────────────────────────── */
.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.cal-nav-btn {
  background: var(--emerald);
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cal-month-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--gray-800);
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 16px;
}
.cal-weekday {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-500);
  padding: 4px 0;
}
.cal-cell {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--card);
}
.cal-cell.cal-empty { background: transparent; }
.cal-cell.cal-today {
  background: var(--emerald);
}
.cal-cell.cal-today .cal-day-num { color: white; font-weight: 800; }
.cal-day-num { font-size: 13px; color: var(--gray-700); }
.cal-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f59e0b;
  margin-top: 2px;
}
.cal-cell.cal-today .cal-dot { background: white; }
.cal-legend {
  background: var(--card);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.cal-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--gray-700);
  padding: 4px 0;
}
.cal-disclaimer {
  font-size: 11px;
  color: var(--gray-400);
  text-align: center;
  margin-top: 8px;
}
.cal-error {
  text-align: center;
  color: var(--gray-500);
  padding: 24px;
}
```

- [ ] **Step 3: Manually test**

Open Learn tab → tap "Islamic Calendar". Verify:
- Calendar grid shows current Hijri month
- Today's date is highlighted in green
- Key dates have amber dots with legend below
- ‹ › navigation changes month correctly (including Dec→Jan wrap)
- Navigating to same month again uses cached data (no new API call)
- Disclaimer shown

- [ ] **Step 4: Commit**

```bash
git add js/app.js css/styles.css
git commit -m "feat: Islamic calendar UI — Hijri grid card in Learn tab"
```

---

## Task 6: Tafsir — Functions

**Files:**
- Modify: `js/app.js` — add `_openTafsir`, `toggleTafsir`, update `renderSurahContent`

- [ ] **Step 1: Add `_openTafsir` Set at module scope**

Near the top of `js/app.js`, after the existing module-level variables (e.g., near `_qiblaRafId` or after the `state` object), add:

```js
// Tracks which ayahs have tafsir expanded; cleared on each renderSurahContent
const _openTafsir = new Set(); // "surah:ayah" strings
```

- [ ] **Step 2: Add `toggleTafsir` function**

Add after the `saveTasbeeh` function or near the Quran functions:

```js
// ── Tafsir ────────────────────────────────────────────────────
async function toggleTafsir(surah, ayah) {
  const key = `${surah}:${ayah}`;
  const boxId = `tafsir-box-${surah}-${ayah}`;
  const btnId = `tafsir-btn-${surah}-${ayah}`;
  const box = document.getElementById(boxId);
  const btn = document.getElementById(btnId);
  if (!box || !btn) return;

  if (_openTafsir.has(key)) {
    _openTafsir.delete(key);
    box.style.display = 'none';
    btn.textContent = 'Tafsir ›';
    return;
  }

  _openTafsir.add(key);
  btn.textContent = 'Hide Tafsir';
  box.style.display = 'block';
  box.innerHTML = '<div class="spinner" style="margin:8px auto"></div>';

  // Check cache
  let text;
  try {
    const cache = JSON.parse(localStorage.getItem(`huda_tafsir_${surah}`) || '{}');
    if (cache[ayah]) {
      text = cache[ayah];
    } else {
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.maududi`);
      const json = await res.json();
      text = json.data?.text;
      if (text) {
        cache[ayah] = text;
        try { localStorage.setItem(`huda_tafsir_${surah}`, JSON.stringify(cache)); } catch(e) {}
      }
    }
  } catch(e) {
    text = null;
  }

  // Check box is still open (user may have toggled while loading)
  if (!_openTafsir.has(key)) return;

  box.innerHTML = text
    ? `<p class="tafsir-text">${esc(text)}</p>`
    : `<p class="tafsir-error">Tafsir temporarily unavailable.</p>`;
}
```

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: tafsir toggle function with en.maududi API and per-surah localStorage cache"
```

---

## Task 7: Tafsir — UI in renderSurahContent

**Files:**
- Modify: `js/app.js` — `renderSurahContent()` at line 1096
- Modify: `css/styles.css` — tafsir styles

- [ ] **Step 1: Update `renderSurahContent` to add ayah IDs, tafsir button, and tafsir box**

Replace the current `renderSurahContent` function:

```js
function renderSurahContent(n, arData, enData) {
  _openTafsir.clear();
  const content = document.getElementById('reader-content');
  const bismillah = n !== 9 && n !== 1
    ? `<div class="bismillah">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيم</div>`
    : '';
  const hasBism = n !== 9 && n !== 1;
  const ayahs = arData.ayahs.map((a, i) => {
    const displayText = (hasBism && a.numberInSurah === 1) ? stripBismillah(a.text) : a.text;
    return `
    <div class="ayah" id="ayah-${a.numberInSurah}" data-global="${a.number}" data-surah="${n}" data-ayah="${a.numberInSurah}">
      <div class="ayah-arabic"><span class="ayah-num-badge">${a.numberInSurah}</span> ${esc(displayText)}</div>
      <div class="ayah-english">${esc(enData.ayahs[i]?.text ?? '')}</div>
      <div class="ayah-actions">
        <button class="ayah-btn" id="aud-${a.number}" onclick="playAyah(${a.number},${n},${a.numberInSurah})" title="Play">▶</button>
        <button class="ayah-btn ${isBookmarked(n, a.numberInSurah) ? 'bookmarked' : ''}" id="bm-${n}-${a.numberInSurah}"
          onclick="toggleBookmark(${n},${a.numberInSurah},'${a.text.replace(/'/g,"\\'").slice(0,60)}')" title="Bookmark">
          ${isBookmarked(n, a.numberInSurah) ? '🔖' : '🏷️'}
        </button>
        <button class="ayah-btn tafsir-btn" id="tafsir-btn-${n}-${a.numberInSurah}"
          onclick="toggleTafsir(${n},${a.numberInSurah})">Tafsir ›</button>
      </div>
      <div class="tafsir-box" id="tafsir-box-${n}-${a.numberInSurah}" style="display:none"></div>
    </div>`;
  }).join('');
  content.innerHTML = bismillah + ayahs;
}
```

- [ ] **Step 2: Add tafsir styles to `css/styles.css`**

```css
/* ── Tafsir ────────────────────────────────────────────────── */
.tafsir-btn {
  font-size: 11px;
  color: var(--emerald);
  border: 1px solid var(--emerald);
  border-radius: 6px;
  padding: 2px 8px;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
}
.tafsir-box {
  margin-top: 8px;
  background: var(--gray-50, #f9fafb);
  border-left: 3px solid var(--emerald);
  border-radius: 0 8px 8px 0;
  padding: 10px 12px;
}
.dark .tafsir-box { background: var(--gray-800, #1f2937); }
.tafsir-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--gray-700);
  margin: 0;
}
.dark .tafsir-text { color: var(--gray-300); }
.tafsir-error {
  font-size: 13px;
  color: var(--gray-400);
  margin: 0;
  font-style: italic;
}
```

- [ ] **Step 3: Manually test**

Open any surah in Study view. Verify:
- Each ayah has a "Tafsir ›" button
- Tapping shows loading spinner then tafsir text
- Button label changes to "Hide Tafsir"
- Tapping again collapses
- Navigating to a new surah clears open tafsir state
- Tafsir not visible in Mushaf view
- On API failure: "Tafsir temporarily unavailable."
- Second tap on same ayah uses cached data (no network call)

- [ ] **Step 4: Commit**

```bash
git add js/app.js css/styles.css
git commit -m "feat: Tafsir UI — per-ayah expand button in Study view with en.maududi commentary"
```

---

## Task 8: Quran Search — State + Functions

**Files:**
- Modify: `js/app.js:72-80` — add `searchOpen`, `searchQuery` to `state.quran`
- Modify: `js/app.js` — add search functions, extend `openSurah`

- [ ] **Step 1: Add search properties to `state.quran`**

In the `state` constant, update the `quran` object:

```js
  quran: {
    currentSurah: null,
    cache: (() => { try { return JSON.parse(localStorage.getItem('huda_quran') || '{}'); } catch(e) { return {}; } })(),
    filteredSurahs: [...SURAHS],
    viewMode: 'verse',
    currentPage: 0,
    showTranslation: false,
    timings: {},
    searchOpen: false,
    searchQuery: '',
  },
```

- [ ] **Step 2: Extend `openSurah` to accept `targetAyah` parameter**

Change the function signature and add scroll logic. Current signature is `async function openSurah(n)`. Replace with:

```js
async function openSurah(n, targetAyah = null) {
```

After `document.getElementById('quran-reader').scrollTop = 0;` (currently line 585), add:

```js
    if (targetAyah) {
      requestAnimationFrame(() => {
        document.getElementById(`ayah-${targetAyah}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
```

- [ ] **Step 3: Add `_searchDebounce` timer and search functions**

Add a module-level debounce timer variable near other module-level vars:

```js
let _searchDebounce = null;
```

Add the search functions (after the calendar functions or near the Quran functions):

```js
// ── Quran Search ──────────────────────────────────────────────
function openQuranSearch() {
  state.quran.searchOpen = true;
  state.quran.searchQuery = '';
  const listView = document.getElementById('quran-list-view');
  if (!listView) return;
  // Inject search view inside the tab
  let sv = document.getElementById('quran-search-view');
  if (!sv) {
    sv = document.createElement('div');
    sv.id = 'quran-search-view';
    listView.parentNode.insertBefore(sv, listView);
  }
  listView.style.display = 'none';
  sv.style.display = 'block';
  sv.innerHTML = `
    <div class="qs-header" style="padding-top:calc(16px + env(safe-area-inset-top,0px))">
      <button class="back-btn" onclick="closeQuranSearch()">←</button>
      <h2>Search Quran</h2>
    </div>
    <div class="qs-input-wrap">
      <input class="qs-input" id="qs-input" placeholder="Search in English translation..."
        oninput="scheduleQuranSearch(this.value)" autocomplete="off">
    </div>
    <div id="qs-results" class="qs-results">
      <p class="qs-hint">Type at least 2 characters to search</p>
    </div>
  `;
  document.getElementById('qs-input')?.focus();
}

function closeQuranSearch() {
  state.quran.searchOpen = false;
  const sv = document.getElementById('quran-search-view');
  if (sv) sv.style.display = 'none';
  const listView = document.getElementById('quran-list-view');
  if (listView) listView.style.display = 'block';
}

function scheduleQuranSearch(query) {
  state.quran.searchQuery = query;
  clearTimeout(_searchDebounce);
  if (query.length < 2) {
    document.getElementById('qs-results').innerHTML = `<p class="qs-hint">Type at least 2 characters to search</p>`;
    return;
  }
  _searchDebounce = setTimeout(() => runQuranSearch(query), 400);
}

async function runQuranSearch(query) {
  const results = document.getElementById('qs-results');
  if (!results) return;
  results.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en.sahih`);
    const json = await res.json();
    const matches = json.data?.matches ?? [];
    if (matches.length === 0) {
      results.innerHTML = `<p class="qs-hint">No results for '<strong>${esc(query)}</strong>'</p>`;
      return;
    }
    const truncated = matches.length === 60;
    results.innerHTML = matches.map(m => {
      const surahNum = m.surah.number;
      const ayahNum = m.numberInSurah;
      const surahName = m.surah.englishName;
      const snippet = esc(m.text);
      return `
        <div class="qs-result" onclick="selectSearchResult(${surahNum},${ayahNum})">
          <div class="qs-result-meta">
            <span class="qs-surah-name">${esc(surahName)}</span>
            <span class="qs-ayah-badge">${ayahNum}</span>
          </div>
          <div class="qs-snippet">${snippet}</div>
        </div>`;
    }).join('') + (truncated ? `<p class="qs-truncated">Showing top 60 results — try a more specific search.</p>` : '');
  } catch(e) {
    results.innerHTML = `<p class="qs-hint">Search unavailable — check your connection</p>`;
  }
}

function selectSearchResult(surahNum, ayahNum) {
  closeQuranSearch();
  openSurah(surahNum, ayahNum);
}
```

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: Quran search functions — debounced en.sahih search, result selection with scroll"
```

---

## Task 9: Quran Search — Search Icon + Styles

**Files:**
- Modify: `js/app.js` — `renderQuranList()` at line 464 — add 🔍 button to header
- Modify: `css/styles.css` — search view styles

- [ ] **Step 1: Add search icon button to the Quran tab header in `renderQuranList()`**

In `renderQuranList()`, the header div currently is:

```js
      <div style="background:var(--emerald);padding:16px 20px;padding-top:calc(16px + env(safe-area-inset-top,0px));color:white">
        <h1 style="font-size:22px;font-weight:800;margin-bottom:2px">القُرْآن الكَرِيم</h1>
        <p style="font-size:13px;opacity:0.8">The Noble Quran · 114 Surahs</p>
      </div>
```

Replace with:

```js
      <div style="background:var(--emerald);padding:16px 20px;padding-top:calc(16px + env(safe-area-inset-top,0px));color:white;display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <h1 style="font-size:22px;font-weight:800;margin-bottom:2px">القُرْآن الكَرِيم</h1>
          <p style="font-size:13px;opacity:0.8">The Noble Quran · 114 Surahs</p>
        </div>
        <button onclick="openQuranSearch()" style="background:rgba(255,255,255,0.2);border:none;color:white;border-radius:8px;padding:6px 10px;font-size:18px;cursor:pointer;margin-top:2px" title="Search Quran">🔍</button>
      </div>
```

- [ ] **Step 2: Add search view styles to `css/styles.css`**

```css
/* ── Quran Search ──────────────────────────────────────────── */
#quran-search-view { display: none; }
.qs-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--emerald);
  color: white;
}
.qs-header h2 { font-size: 18px; font-weight: 700; color: white; margin: 0; }
.qs-input-wrap {
  padding: 12px 16px;
  background: var(--card);
  border-bottom: 1px solid var(--gray-200);
}
.qs-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--gray-300);
  font-size: 15px;
  background: var(--bg);
  color: var(--text);
  outline: none;
}
.qs-input:focus { border-color: var(--emerald); }
.qs-results { padding: 8px 0; }
.qs-hint {
  text-align: center;
  color: var(--gray-400);
  font-size: 14px;
  padding: 24px 16px;
}
.qs-result {
  padding: 12px 16px;
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
}
.qs-result:active { background: var(--gray-50); }
html.dark .qs-result:active { background: var(--gray-800, #1f2937); }
.qs-result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.qs-surah-name { font-size: 13px; font-weight: 600; color: var(--emerald); }
.qs-ayah-badge {
  background: var(--emerald);
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  padding: 1px 6px;
}
.qs-snippet {
  font-size: 13px;
  color: var(--gray-700);
  line-height: 1.5;
}
html.dark .qs-snippet { color: var(--gray-300); }
.qs-truncated {
  font-size: 12px;
  color: var(--gray-400);
  text-align: center;
  padding: 12px 16px;
  font-style: italic;
}
```

- [ ] **Step 3: Manually test**

Open the Quran tab. Verify:
- 🔍 button appears in the top-right of the green header
- Tapping opens search view with input auto-focused
- Typing < 2 chars shows hint message
- Typing 2+ chars waits 400ms then fires API
- Results show surah name, ayah number badge, and translation snippet
- Tapping a result opens the surah and scrolls to that ayah
- ← back button returns to surah list
- If 60 results: truncation note shown
- On API error: "Search unavailable — check your connection"
- Dark mode looks correct

- [ ] **Step 4: Commit**

```bash
git add js/app.js css/styles.css
git commit -m "feat: Quran search UI — search icon in header, full-screen results view"
```

---

## Task 10: Version Bump + Final Test

**Files:**
- Modify: `index.html` — bump `?v=` query strings
- Modify: `service-worker.js` — bump `CACHE_NAME`

- [ ] **Step 1: Bump version**

In `index.html`, change all `?v=88` to `?v=89`.

In `service-worker.js`, change `huda-v88` to `huda-v89`.

- [ ] **Step 2: Full end-to-end test checklist**

| Feature | Test |
|---|---|
| Tasbeeh | Tap card increments; ↺ resets; count survives refresh |
| Calendar | Opens from Learn; shows correct Hijri month; today highlighted; key dates shown; navigation wraps; cached on revisit |
| Tafsir | "Tafsir ›" on each Study ayah; toggle open/close; cached; "unavailable" on error |
| Search | 🔍 opens search; < 2 chars hint; results with scroll; back closes; 60 cap note |
| Combined | Opening surah via search scrolls to correct ayah |

- [ ] **Step 3: Commit**

```bash
git add index.html service-worker.js
git commit -m "chore: bump to v89 — Tasbeeh, Calendar, Tafsir, Quran Search"
```

---

## Rollback Notes

Each task is an independent commit. If any feature has a bug, revert just that commit:

```bash
git revert <commit-sha>  # reverts one commit cleanly
```
