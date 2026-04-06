/* ============================================================
   HUDA PWA — Dhikr, Tasbeeh + Islamic Calendar
   ============================================================ */

// ── DHIKR TAB ─────────────────────────────────────────────────
let _dhikrTab = 0; // 0=Tasbih, 1=Tahmid, 2=Takbir, 3=Tahlil, 4=Istighfar, 5=Tasbih+, 6=Hawqala, 7=Free Counter
const _FREE_COUNTER_TAB = 7;

function renderDhikr() {
  checkDhikrReset();
  const tab = document.getElementById('tab-dhikr');
  const isFree = _dhikrTab === _FREE_COUNTER_TAB;
  const tabNames = ['Tasbih', 'Tahmid', 'Takbir', 'Tahlil', 'Istighfar', 'Tasbih+', 'Hawqala', '∞ Counter'];
  const totalTabs = tabNames.length;
  const streak = computeStreak();

  const navDots = tabNames.map((_, i) => `
    <div onclick="switchDhikrTab(${i})" style="cursor:pointer;width:${i === _dhikrTab ? 20 : 6}px;height:6px;border-radius:3px;background:${i === _dhikrTab ? '#059669' : '#cbd5e1'};transition:all 0.25s ease"></div>
  `).join('');

  const tabBtns = tabNames.map((name, i) => `
    <button class="dhikr-tab-btn ${i === _dhikrTab ? 'active' : ''}"
      style="white-space:nowrap;flex-shrink:0;"
      onclick="switchDhikrTab(${i})">${name}</button>
  `).join('');

  const prevDisabled = _dhikrTab === 0;
  const nextDisabled = _dhikrTab === totalTabs - 1;
  const navStyle = (disabled, color) =>
    `flex-shrink:0;width:32px;height:32px;border-radius:50%;border:1px solid #e2e8f0;background:white;font-size:16px;cursor:pointer;color:${color};display:flex;align-items:center;justify-content:center`;

  const navBar = `
    <div style="display:flex;align-items:center;gap:6px;padding:0 12px 4px">
      <button onclick="switchDhikrTab(${_dhikrTab - 1})" ${prevDisabled ? 'disabled' : ''}
        style="${navStyle(prevDisabled, prevDisabled ? '#cbd5e1' : '#059669')}">‹</button>
      <div class="dhikr-tabs-bar" style="overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;flex:1;margin:0;padding:6px 0">
        ${tabBtns}
      </div>
      <button onclick="switchDhikrTab(${_dhikrTab + 1})" ${nextDisabled ? 'disabled' : ''}
        style="${navStyle(nextDisabled, nextDisabled ? '#cbd5e1' : '#059669')}">›</button>
    </div>
    <div style="display:flex;justify-content:center;align-items:center;gap:6px;padding:0 12px 6px">
      ${navDots}
    </div>`;

  if (isFree) {
    const count = state.tasbeeh;
    tab.innerHTML = `
      <div class="dhikr-header-new" style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div class="dhikr-header-label">Daily Dhikr</div>
          <div class="dhikr-header-arabic">∞</div>
        </div>
        <button class="dhikr-stats-btn" onclick="openDhikrStats()" style="margin-top:4px">
          ${streak > 0 ? `🔥 ${streak}` : '📊'}
        </button>
      </div>
      <div class="dhikr-counter-area">
        <div class="dhikr-counter-text" style="font-size:22px;font-weight:600;color:#059669">Free Counter</div>
        <div class="dhikr-counter-transliteration">Count anything — no limit</div>
        <div class="dhikr-counter-number" id="dhikr-count-display">${count}</div>
        <div class="dhikr-counter-of" style="opacity:0">—</div>
        <div class="dhikr-progress-bar" style="visibility:hidden">
          <div class="dhikr-progress-fill" style="width:0%"></div>
        </div>
        <button class="dhikr-tap-btn" onclick="tapFreeCounter()">✦</button>
        <div class="dhikr-hint">Tap to count · Hold to reset</div>
      </div>
      ${navBar}`;

    let _holdTimer = null;
    const tapBtn = tab.querySelector('.dhikr-tap-btn');
    tapBtn.addEventListener('pointerdown', () => {
      _holdTimer = setTimeout(() => { _clearTasbeeh(); renderDhikr(); }, 700);
    });
    tapBtn.addEventListener('pointerup', () => clearTimeout(_holdTimer));
    tapBtn.addEventListener('pointerleave', () => clearTimeout(_holdTimer));

    const counterArea = tab.querySelector('.dhikr-counter-area');
    let _sx = 0, _sy = 0;
    counterArea.addEventListener('touchstart', e => { _sx = e.touches[0].clientX; _sy = e.touches[0].clientY; }, { passive: true });
    counterArea.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - _sx;
      const dy = e.changedTouches[0].clientY - _sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) switchDhikrTab(_dhikrTab + (dx < 0 ? 1 : -1));
    }, { passive: true });
    return;
  }

  const d = DHIKRS[_dhikrTab];
  const count = state.dhikrCounts[_dhikrTab] || 0;
  const pct = Math.min((count / d.target) * 100, 100);
  const isComplete = count >= d.target;

  tab.innerHTML = `
    <div class="dhikr-header-new" style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div class="dhikr-header-label">Daily Dhikr</div>
        <div class="dhikr-header-arabic">${d.arabic}</div>
      </div>
      <button class="dhikr-stats-btn" onclick="openDhikrStats()" style="margin-top:4px">
        ${streak > 0 ? `🔥 ${streak}` : '📊'}
      </button>
    </div>
    <div class="dhikr-counter-area${isComplete ? ' dhikr-complete' : ''}">
      <div class="dhikr-counter-text">${d.arabic}</div>
      <div class="dhikr-counter-transliteration">${d.transliteration} · ${d.meaning}</div>
      <div class="dhikr-counter-number" id="dhikr-count-display">${count}</div>
      <div class="dhikr-counter-of">of ${d.target}${isComplete ? ' ✓' : ''}</div>
      <div class="dhikr-progress-bar">
        <div class="dhikr-progress-fill" id="dhikr-prog" style="width:${pct}%"></div>
      </div>
      <button class="dhikr-tap-btn" onclick="tapActiveDhikr()">✦</button>
      <div class="dhikr-hint">Tap to count · Hold to reset</div>
      ${d.reward ? `<div class="dhikr-reward" style="margin-top:16px;text-align:left">🌟 ${d.reward}</div>` : ''}
      <div class="dhikr-source" style="margin-top:6px;text-align:left">${d.source}</div>
    </div>
    ${navBar}
  `;

  // Long-press reset on tap button
  let _holdTimer = null;
  const tapBtn = tab.querySelector('.dhikr-tap-btn');
  tapBtn.addEventListener('pointerdown', () => {
    _holdTimer = setTimeout(() => { resetDhikr(_dhikrTab); renderDhikr(); }, 700);
  });
  tapBtn.addEventListener('pointerup', () => clearTimeout(_holdTimer));
  tapBtn.addEventListener('pointerleave', () => clearTimeout(_holdTimer));

  // Swipe left/right on counter area to navigate dhikrs
  const counterArea = tab.querySelector('.dhikr-counter-area');
  let _swipeStartX = 0, _swipeStartY = 0;
  counterArea.addEventListener('touchstart', e => {
    _swipeStartX = e.touches[0].clientX;
    _swipeStartY = e.touches[0].clientY;
  }, { passive: true });
  counterArea.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _swipeStartX;
    const dy = e.changedTouches[0].clientY - _swipeStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      switchDhikrTab(_dhikrTab + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });
}

function tapFreeCounter() {
  state.tasbeeh++;
  haptic();
  saveTasbeeh();
  const el = document.getElementById('dhikr-count-display');
  if (el) {
    el.textContent = state.tasbeeh;
    el.classList.add('dhikr-pop');
    setTimeout(() => el.classList.remove('dhikr-pop'), 300);
  }
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
  if (_dhikrTab === _FREE_COUNTER_TAB) { tapFreeCounter(); return; }
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
  if (newCount >= d.target) {
    haptic(150);
    renderDhikr();
    setTimeout(() => {
      const el = document.getElementById('dhikr-count-display');
      if (el) { el.classList.add('dhikr-pop'); setTimeout(() => el.classList.remove('dhikr-pop'), 500); }
    }, 30);
  }
}

function switchDhikrTab(i) {
  _dhikrTab = Math.max(0, Math.min(i, _FREE_COUNTER_TAB));
  renderDhikr();
}

// ── Dhikr History & Stats ─────────────────────────────────────
function _dateToKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getTodayKey() { return _dateToKey(new Date()); }

// Cache parsed history to avoid repeated JSON.parse on every tap
let _historyCache = null;
function getDhikrHistory() {
  if (_historyCache) return _historyCache;
  try { _historyCache = JSON.parse(localStorage.getItem('huda_dhikr_history') || '{}'); } catch(e) { _historyCache = {}; }
  return _historyCache;
}
function _invalidateHistoryCache() { _historyCache = null; }

function saveDhikrHistory() {
  const history = getDhikrHistory();
  const todayKey = getTodayKey();
  // Use max values so a reset doesn't erase completed counts from today's history record
  const existing = history[todayKey] || {};
  const merged = { ...existing };
  for (const [k, v] of Object.entries(state.dhikrCounts)) {
    merged[k] = Math.max(merged[k] || 0, v);
  }
  history[todayKey] = merged;
  _invalidateHistoryCache();
  localStorage.setItem('huda_dhikr_history', JSON.stringify(history));
  localStorage.setItem('_sync_ts_huda_dhikr_history', String(Date.now()));
}

function _getDayLevel(dayData) {
  if (!dayData) return 0;
  const completed = DHIKRS.filter((d, i) => (dayData[i] || 0) >= d.target).length;
  if (completed === 0) return Object.values(dayData).some(v => v > 0) ? 1 : 0;
  if (completed <= 2) return 1;
  if (completed <= 5) return 2;
  return 3;
}

function computeStreak() {
  const history = getDhikrHistory();
  const cursor = new Date();
  // If today has no activity yet, don't break streak — start count from yesterday
  const todayKey = _dateToKey(cursor);
  if (!history[todayKey] || !Object.values(history[todayKey]).some(v => v > 0)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (streak < 3650) {
    const key = _dateToKey(cursor);
    const dayData = history[key];
    if (!dayData || !Object.values(dayData).some(v => v > 0)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function computeBestStreak() {
  const history = getDhikrHistory();
  const keys = Object.keys(history).filter(k => Object.values(history[k]).some(v => v > 0)).sort();
  if (!keys.length) return 0;
  let best = 0, cur = 0, prevKey = null;
  for (const key of keys) {
    if (!prevKey) { cur = 1; }
    else {
      // Parse as local noon to avoid ISO UTC-midnight shifting date in UTC- timezones
      const prev = new Date(prevKey + 'T12:00:00'); prev.setDate(prev.getDate() + 1);
      cur = _dateToKey(prev) === key ? cur + 1 : 1;
    }
    if (cur > best) best = cur;
    prevKey = key;
  }
  return best;
}

function getTotalActiveDays() {
  const history = getDhikrHistory();
  return Object.values(history).filter(d => Object.values(d).some(v => v > 0)).length;
}

function getDhikrLifetimeTotals() {
  const history = getDhikrHistory();
  const totals = Array(DHIKRS.length).fill(0);
  for (const dayData of Object.values(history)) {
    for (let i = 0; i < DHIKRS.length; i++) {
      totals[i] += dayData[i] || 0;
    }
  }
  return totals;
}

// ── Dhikr Stats Screen ────────────────────────────────────────
let _statsYear = new Date().getFullYear();
let _statsMonth = new Date().getMonth(); // 0-indexed

function openDhikrStats() {
  _statsYear = new Date().getFullYear();
  _statsMonth = new Date().getMonth();
  const tab = document.getElementById('tab-dhikr');
  tab.innerHTML = _buildStatsHTML();
}

function closeDhikrStats() { renderDhikr(); }

function navDhikrStatsMonth(dir) {
  _statsMonth += dir;
  if (_statsMonth > 11) { _statsMonth = 0; _statsYear++; }
  if (_statsMonth < 0)  { _statsMonth = 11; _statsYear--; }
  const tab = document.getElementById('tab-dhikr');
  tab.innerHTML = _buildStatsHTML();
}

function _buildStatsHTML() {
  const history = getDhikrHistory();
  const today = new Date();
  const todayKey = _dateToKey(today);
  const streak = computeStreak();
  const best = Math.max(computeBestStreak(), streak);
  const activeDays = getTotalActiveDays();
  const totals = getDhikrLifetimeTotals();
  const maxTotal = Math.max(...totals, 1);

  // Calendar build
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_LABELS = ['S','M','T','W','T','F','S'];
  const firstDay = new Date(_statsYear, _statsMonth, 1).getDay();
  const daysInMonth = new Date(_statsYear, _statsMonth + 1, 0).getDate();
  // Merge live state for today so stats reflect taps before first saveDhikrHistory() call
  const effectiveTodayData = (history[todayKey] && Object.keys(history[todayKey]).length > 0)
    ? history[todayKey]
    : (Object.keys(state.dhikrCounts).length > 0 ? state.dhikrCounts : null);
  const nowYear = today.getFullYear(), nowMonth = today.getMonth(), nowDay = today.getDate();
  const isPastMax = _statsYear > nowYear || (_statsYear === nowYear && _statsMonth > nowMonth);

  let calCells = DAY_LABELS.map(l => `<div class="dhikr-cal-header-cell">${l}</div>`).join('');
  for (let i = 0; i < firstDay; i++) calCells += `<div class="dhikr-cal-day empty"></div>`;
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${_statsYear}-${String(_statsMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isFuture = _statsYear > nowYear || (_statsYear === nowYear && (_statsMonth > nowMonth || (_statsMonth === nowMonth && day > nowDay)));
    const isToday = key === todayKey;
    const dayData = isToday ? effectiveTodayData : history[key];
    const level = isFuture ? 'future' : `lv${_getDayLevel(dayData)}`;
    calCells += `<div class="dhikr-cal-day ${level}${isToday ? ' is-today' : ''}" title="${key}">${day}</div>`;
  }

  // This week (last 7 days including today)
  const weekDayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let weekCols = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = _dateToKey(d);
    const isT = key === todayKey;
    const weekDayData = isT ? effectiveTodayData : history[key];
    const lv = _getDayLevel(weekDayData);
    const completed = weekDayData ? DHIKRS.filter((dh, idx) => (weekDayData[idx] || 0) >= dh.target).length : 0;
    weekCols += `
      <div class="dhikr-week-col${isT ? ' today' : ''}">
        <div class="dhikr-week-day-label">${weekDayLabels[d.getDay()]}</div>
        <div class="dhikr-week-dot lv${lv}">${lv >= 3 ? '✓' : lv > 0 ? '·' : ''}</div>
        <div class="dhikr-week-count">${completed > 0 ? completed+'/7' : ''}</div>
      </div>`;
  }

  // Lifetime bars
  const dhikrNames = ['Subḥān Allāh','Alḥamdulillāh','Allāhu Akbar','Lā ilāha illallāh','Astaghfirullāh','Subḥ. wa biḥamdih','Lā ḥawla...'];
  let lifetimeBars = '';
  for (let i = 0; i < DHIKRS.length; i++) {
    const pct = totals[i] > 0 ? Math.max(4, Math.round((totals[i] / maxTotal) * 100)) : 0;
    const count = totals[i] >= 1000 ? `${(totals[i]/1000).toFixed(1)}k` : String(totals[i]);
    lifetimeBars += `
      <div class="dhikr-lifetime-row">
        <div class="dhikr-lifetime-name">${dhikrNames[i]}</div>
        <div class="dhikr-lifetime-bar-wrap"><div class="dhikr-lifetime-bar-fill" style="width:${pct}%"></div></div>
        <div class="dhikr-lifetime-count">${count}</div>
      </div>`;
  }

  return `
    <div class="dhikr-stats-header">
      <button class="dhikr-stats-back" onclick="closeDhikrStats()">‹</button>
      <div>
        <div class="dhikr-stats-title">Dhikr Journey</div>
        <div class="dhikr-stats-sub">Your remembrance of Allah</div>
      </div>
    </div>
    <div style="overflow-y:auto;padding-bottom:30px">
      <div class="dhikr-stat-cards">
        <div class="dhikr-stat-card">
          <div class="dhikr-stat-icon">🔥</div>
          <div class="dhikr-stat-num">${streak}</div>
          <div class="dhikr-stat-label">Streak</div>
          <div class="dhikr-stat-sub">days</div>
        </div>
        <div class="dhikr-stat-card">
          <div class="dhikr-stat-icon">⭐</div>
          <div class="dhikr-stat-num">${best}</div>
          <div class="dhikr-stat-label">Best</div>
          <div class="dhikr-stat-sub">days</div>
        </div>
        <div class="dhikr-stat-card">
          <div class="dhikr-stat-icon">📅</div>
          <div class="dhikr-stat-num">${activeDays}</div>
          <div class="dhikr-stat-label">Active</div>
          <div class="dhikr-stat-sub">days total</div>
        </div>
      </div>

      <div class="dhikr-section-card">
        <div class="dhikr-cal-nav">
          <button class="dhikr-cal-nav-btn" onclick="navDhikrStatsMonth(-1)">‹</button>
          <div class="dhikr-cal-month">${MONTH_NAMES[_statsMonth]} ${_statsYear}</div>
          <button class="dhikr-cal-nav-btn" onclick="navDhikrStatsMonth(1)" ${isPastMax ? 'disabled' : ''}>›</button>
        </div>
        <div class="dhikr-cal-grid">${calCells}</div>
        <div class="dhikr-cal-legend">
          <div class="dhikr-cal-legend-item"><div class="dhikr-cal-legend-dot" style="background:#d1fae5"></div>Started</div>
          <div class="dhikr-cal-legend-item"><div class="dhikr-cal-legend-dot" style="background:#6ee7b7"></div>Partial</div>
          <div class="dhikr-cal-legend-item"><div class="dhikr-cal-legend-dot" style="background:#059669"></div>Full (6–7/7)</div>
        </div>
      </div>

      <div class="dhikr-section-card">
        <div class="dhikr-section-title">This Week</div>
        <div class="dhikr-week-grid">${weekCols}</div>
      </div>

      <div class="dhikr-section-card">
        <div class="dhikr-section-title">Lifetime Totals</div>
        ${lifetimeBars}
      </div>
    </div>`;
}

// ── Tasbeeh Counter ───────────────────────────────────────────
// _clearTasbeeh: state-only reset, no DOM update — called by both the
// legacy bead counter and the free dhikr counter tab hold-to-reset handler.
function _clearTasbeeh() {
  state.tasbeeh = 0;
  saveTasbeeh();
}

function tapTasbeeh() {
  state.tasbeeh++;
  haptic();
  saveTasbeeh();
  const el = document.getElementById('tasbeeh-count');
  if (el) el.textContent = state.tasbeeh;
}

function resetTasbeeh() {
  _clearTasbeeh();
  const el = document.getElementById('tasbeeh-count');
  if (el) el.textContent = '0';
}

function saveTasbeeh() {
  localStorage.setItem('huda_tasbeeh', String(state.tasbeeh));
  localStorage.setItem('_sync_ts_huda_tasbeeh', String(Date.now()));
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
  const now = String(Date.now());
  localStorage.setItem('huda_dhikr', JSON.stringify(state.dhikrCounts));
  localStorage.setItem('_sync_ts_huda_dhikr', now);
  saveDhikrHistory();
  debouncedPush();
}

