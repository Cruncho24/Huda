/* ============================================================
   HUDA PWA — Dhikr, Tasbeeh + Islamic Calendar
   ============================================================ */

// ── DHIKR TAB ─────────────────────────────────────────────────
let _dhikrTab = 0; // 0=Tasbih, 1=Tahmid, 2=Takbir

function renderDhikr() {
  checkDhikrReset();
  const tab = document.getElementById('tab-dhikr');
  const d = DHIKRS[_dhikrTab];
  const count = state.dhikrCounts[_dhikrTab] || 0;
  const pct = Math.min((count / d.target) * 100, 100);
  const tabNames = ['Tasbih', 'Tahmid', 'Takbir'];

  tab.innerHTML = `
    <div class="dhikr-header-new">
      <div class="dhikr-header-label">Daily Dhikr</div>
      <div class="dhikr-header-arabic">التَّسْبِيح</div>
    </div>
    <div class="dhikr-counter-area">
      <div class="dhikr-counter-text">${d.arabic}</div>
      <div class="dhikr-counter-transliteration">${d.transliteration} · ${d.meaning}</div>
      <div class="dhikr-counter-number" id="dhikr-count-display">${count}</div>
      <div class="dhikr-counter-of">of ${d.target}</div>
      <div class="dhikr-progress-bar">
        <div class="dhikr-progress-fill" id="dhikr-prog" style="width:${pct}%"></div>
      </div>
      <button class="dhikr-tap-btn" onclick="tapActiveDhikr()">✦</button>
      <div class="dhikr-hint">Tap to count · Hold to reset</div>
    </div>
    <div class="dhikr-tabs-bar">
      ${tabNames.map((name, i) => `
        <button class="dhikr-tab-btn ${i === _dhikrTab ? 'active' : ''}"
          onclick="switchDhikrTab(${i})">${name}</button>
      `).join('')}
    </div>
  `;

  // Long-press reset on tap button
  let _holdTimer = null;
  const tapBtn = tab.querySelector('.dhikr-tap-btn');
  tapBtn.addEventListener('pointerdown', () => {
    _holdTimer = setTimeout(() => { resetDhikr(_dhikrTab); renderDhikr(); }, 700);
  });
  tapBtn.addEventListener('pointerup', () => clearTimeout(_holdTimer));
  tapBtn.addEventListener('pointerleave', () => clearTimeout(_holdTimer));
}

function renderDhikrCard(d, i) {
  const count = state.dhikrCounts[i] || 0;
  const pct = Math.min((count / d.target) * 100, 100);
  const done = count >= d.target;
  return `
    <div class="dhikr-card ${done ? 'complete' : ''}" id="dhikr-${i}">
      <div class="dhikr-arabic">${d.arabic}</div>
      <div class="dhikr-transliteration">${d.transliteration}</div>
      <div class="dhikr-meaning">${d.meaning}</div>
      <div class="dhikr-source">${d.source}</div>
      ${d.reward ? `<div class="dhikr-reward">🌟 ${d.reward}</div>` : ''}
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="dhikr-footer">
        <div class="dhikr-count">${count} / ${d.target}${done ? ' ✓' : ''}</div>
        <div class="dhikr-controls">
          <button class="reset-btn" onclick="resetDhikr(${i})">↺</button>
          <button class="tap-btn" onclick="tapDhikr(${i})">${done ? '✓ Done' : 'Tap'}</button>
        </div>
      </div>
    </div>`;
}

function tapDhikr(i) {
  const d = DHIKRS[i];
  const cur = state.dhikrCounts[i] || 0;
  if (cur >= d.target) return;
  state.dhikrCounts[i] = cur + 1;
  haptic();
  saveDhikr();
  const card = document.getElementById(`dhikr-${i}`);
  card.classList.add('tapped');
  setTimeout(() => card.classList.remove('tapped'), 150);
  updateDhikrCard(i);
}

function resetDhikr(i) {
  state.dhikrCounts[i] = 0;
  saveDhikr();
  updateDhikrCard(i);
}

function tapActiveDhikr() {
  const d = DHIKRS[_dhikrTab];
  const cur = state.dhikrCounts[_dhikrTab] || 0;
  if (cur >= d.target) { renderDhikr(); return; } // complete — show done state
  state.dhikrCounts[_dhikrTab] = cur + 1;
  haptic();
  saveDhikr();
  // Update display without full re-render
  const countEl = document.getElementById('dhikr-count-display');
  const progEl = document.getElementById('dhikr-prog');
  const newCount = state.dhikrCounts[_dhikrTab];
  const pct = Math.min((newCount / d.target) * 100, 100);
  if (countEl) countEl.textContent = newCount;
  if (progEl) progEl.style.width = pct + '%';
  if (newCount >= d.target) renderDhikr(); // show complete state
}

function switchDhikrTab(i) {
  _dhikrTab = i;
  renderDhikr();
}

// ── Tasbeeh Counter ───────────────────────────────────────────
function tapTasbeeh() {
  state.tasbeeh++;
  haptic();
  saveTasbeeh();
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
  debouncedPush();
}

// ── Islamic Calendar ──────────────────────────────────────────
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
      ${keyDates.map(d => `<div class="cal-legend-item"><span class="cal-dot"></span>${d.day} — ${esc(d.name)}</div>`).join('')}
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
  if (!state.calendar.displayMonth || !state.calendar.displayYear) return;
  let m = state.calendar.displayMonth + delta;
  let y = state.calendar.displayYear;
  if (m > 12) { m = 1; y++; }
  if (m < 1)  { m = 12; y--; }
  state.calendar.displayMonth = m;
  state.calendar.displayYear = y;
  renderCalendar();
}


function saveDhikr() {
  localStorage.setItem('huda_dhikr', JSON.stringify(state.dhikrCounts));
  debouncedPush();
}

