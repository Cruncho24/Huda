/* ============================================================
   HUDA PWA — Daily Reading Plan
   ============================================================
   Data model (stored in localStorage as 'huda_plan'):
   {
     type: '30' | '90' | '365' | 'custom',
     label: '30 days',
     startDate: 'YYYY-MM-DD',
     ayahsPerDay: number,
     completedThrough: number,  // cumulative ayahs marked done (0–6236)
     log: { 'YYYY-MM-DD': true },  // one entry per day marked complete
     completedDate: 'YYYY-MM-DD',  // set when Quran is finished
   }

   huda_furthest_read (localStorage, number): highest global ayah
   number visited. Updated by quran.js on scroll/open. Used for
   today's progress (not last-read position, which can go backward).
*/

const PLAN_OPTIONS = [
  { type: '30',  label: '30 days',  sub: '~207 ayahs per day (1 Juz)', days: 30  },
  { type: '90',  label: '3 months', sub: '~70 ayahs per day',          days: 90  },
  { type: '365', label: '1 year',   sub: '~18 ayahs per day',          days: 365 },
];

const TOTAL_AYAHS = 6236;

// ── Helpers ───────────────────────────────────────────────────

function _todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function _globalToRef(globalNum) {
  const g = Math.max(1, Math.min(TOTAL_AYAHS, globalNum));
  let n = 0;
  for (let i = 0; i < SURAHS.length; i++) {
    const count = SURAHS[i][4];
    if (n + count >= g) {
      return { surah: i + 1, ayah: g - n, name: SURAHS[i][2], arabic: SURAHS[i][1] };
    }
    n += count;
  }
  return { surah: 114, ayah: SURAHS[113][4], name: SURAHS[113][2], arabic: SURAHS[113][1] };
}

function _loadPlan() {
  try { return JSON.parse(localStorage.getItem('huda_plan') || 'null'); } catch(e) { return null; }
}

function _savePlan(plan) {
  if (plan) {
    localStorage.setItem('huda_plan', JSON.stringify(plan));
    localStorage.setItem('_sync_ts_huda_plan', String(Date.now()));
    debouncedPush();
  } else {
    localStorage.setItem('huda_plan', 'null');
    localStorage.setItem('_sync_ts_huda_plan', String(Date.now()));
    debouncedPush();
  }
  state.plan = plan;
}

// Returns highest global ayah number visited (tracked by quran.js).
// Used for today's progress — never goes backward unlike huda_last_read.
function _getFurthestRead() {
  try { return parseInt(localStorage.getItem('huda_furthest_read') || '0', 10) || 0; } catch(e) { return 0; }
}

// ── Public API ────────────────────────────────────────────────

function getPlanTodayRange(plan) {
  const from = (plan.completedThrough || 0) + 1;
  const to   = Math.min(from + plan.ayahsPerDay - 1, TOTAL_AYAHS);
  return { fromGlobal: from, toGlobal: to, from: _globalToRef(from), to: _globalToRef(to) };
}

function isPlanTodayDone(plan) {
  return !!(plan.log && plan.log[_todayStr()]);
}

function getPlanStreak(plan) {
  if (!plan.log) return 0;
  let streak = 0;
  const d = new Date();
  if (!plan.log[_todayStr()]) d.setDate(d.getDate() - 1);
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!plan.log[key]) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function getPlanDayNumber(plan) {
  const start = new Date(plan.startDate);
  const today = new Date(_todayStr());
  return Math.floor((today - start) / 86400000) + 1;
}

function getPlanPct(plan) {
  return Math.min(100, Math.round(((plan.completedThrough || 0) / TOTAL_AYAHS) * 100));
}

function getPlanDaysRemaining(plan) {
  const remaining = TOTAL_AYAHS - (plan.completedThrough || 0);
  return Math.max(1, Math.ceil(remaining / plan.ayahsPerDay));
}

function getPlanScheduleStatus(plan) {
  const dayNum = getPlanDayNumber(plan);
  const expected = Math.max(0, (dayNum - 1) * plan.ayahsPerDay);
  const actual = plan.completedThrough || 0;
  if (actual >= expected) return { status: 'on-track', daysBehind: 0 };
  const rawDays = Math.floor((expected - actual) / plan.ayahsPerDay);
  // Cap at 30 so UI never shows absurd numbers
  const daysBehind = Math.max(1, Math.min(rawDays, 30));
  return { status: 'behind', daysBehind };
}

// How many ayahs of today's range the user has actually read.
// Uses huda_furthest_read — the highest global ayah visited — so
// going back to re-read an earlier surah never reduces the count.
function getPlanTodayAyahsDone(plan) {
  const range = getPlanTodayRange(plan);
  const furthest = _getFurthestRead();
  if (furthest < range.fromGlobal) return 0;
  return Math.min(range.toGlobal - range.fromGlobal + 1, furthest - range.fromGlobal + 1);
}

function startPlan(type, fromCurrent) {
  if (type === 'custom') { openCustomPlanSetup(); return; }
  const opt = PLAN_OPTIONS.find(o => o.type === type);
  if (!opt) return;
  const completedThrough = fromCurrent ? Math.min(_getFurthestRead(), TOTAL_AYAHS - 1) : 0;
  const remaining = TOTAL_AYAHS - completedThrough;
  const plan = {
    type,
    label: opt.label,
    startDate: _todayStr(),
    ayahsPerDay: Math.ceil(remaining / opt.days),
    completedThrough,
    log: {},
  };
  _savePlan(plan);
  closePlanSetup();
  renderHome();
}

function startCustomPlan(days, fromCurrent) {
  const d = parseInt(days, 10);
  if (!d || d < 1 || d > 3650) return;
  const completedThrough = fromCurrent ? Math.min(_getFurthestRead(), TOTAL_AYAHS - 1) : 0;
  const remaining = TOTAL_AYAHS - completedThrough;
  const plan = {
    type: 'custom',
    label: `${d} days`,
    startDate: _todayStr(),
    ayahsPerDay: Math.ceil(remaining / d),
    completedThrough,
    log: {},
  };
  _savePlan(plan);
  closePlanSetup();
  renderHome();
}

function markPlanDone() {
  const plan = _loadPlan();
  if (!plan || isPlanTodayDone(plan)) return;
  if (!plan.log) plan.log = {};
  const range = getPlanTodayRange(plan);
  // Credit any extra ayahs read beyond today's target
  const furthest = _getFurthestRead();
  plan.completedThrough = Math.max(range.toGlobal, Math.min(furthest, TOTAL_AYAHS));
  plan.log[_todayStr()] = true;
  if (plan.completedThrough >= TOTAL_AYAHS && !plan.completedDate) {
    plan.completedDate = _todayStr();
  }
  _savePlan(plan);
  haptic(80);
  setTimeout(renderHome, 350);
}

// Change pace while keeping progress and log intact
function changePlan(type) {
  if (type === 'custom') { openCustomPlanSetup(true); return; }
  const opt = PLAN_OPTIONS.find(o => o.type === type);
  if (!opt) return;
  const plan = _loadPlan();
  if (!plan) return;
  const remaining = TOTAL_AYAHS - (plan.completedThrough || 0);
  plan.type = type;
  plan.label = opt.label;
  plan.ayahsPerDay = Math.ceil(remaining / opt.days);
  plan.startDate = _todayStr();
  _savePlan(plan);
  closePlanSetup();
  renderHome();
}

function changeCustomPlan(days) {
  const d = parseInt(days, 10);
  if (!d || d < 1 || d > 3650) return;
  const plan = _loadPlan();
  if (!plan) return;
  const remaining = TOTAL_AYAHS - (plan.completedThrough || 0);
  plan.type = 'custom';
  plan.label = `${d} days`;
  plan.ayahsPerDay = Math.ceil(remaining / d);
  plan.startDate = _todayStr();
  _savePlan(plan);
  closePlanSetup();
  renderHome();
}

// Skip ahead to today's expected position when behind schedule
function catchUpPlan() {
  const plan = _loadPlan();
  if (!plan) return;
  if (!plan.log) plan.log = {};
  const dayNum = getPlanDayNumber(plan);
  const expected = Math.min(Math.max(0, (dayNum - 1) * plan.ayahsPerDay), TOTAL_AYAHS);
  if (expected <= (plan.completedThrough || 0)) return;
  plan.completedThrough = expected;
  // Fill in all skipped days so the streak is preserved after catching up
  const start = new Date(plan.startDate + 'T12:00:00');
  for (let d = 0; d < dayNum; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    if (!plan.log[key]) plan.log[key] = true;
  }
  if (plan.completedThrough >= TOTAL_AYAHS && !plan.completedDate) {
    plan.completedDate = _todayStr();
  }
  _savePlan(plan);
  haptic(40);
  renderHome();
}

function _insertMarker(html, ayahId, isVerse, position = 'afterend') {
  if (isVerse) {
    const el = document.getElementById(`ayah-${ayahId}`);
    if (el) el.insertAdjacentHTML(position, html);
  } else {
    const wrap = document.querySelector(`#mushaf-page .mushaf-ayah-wrap[data-ayah="${ayahId}"]`);
    if (!wrap) return;
    // Always insert at page-block level — inserting a div inline inside
    // flowing Arabic <span> elements breaks the text layout
    const block = wrap.closest('.mushaf-page-block');
    if (block) block.insertAdjacentHTML(position, html);
  }
}

function _getPlanActiveRange(plan) {
  // Returns the range to guide reading: today's if not done, tomorrow's if done (read-ahead)
  if (isPlanTodayDone(plan)) {
    const nextFrom = (plan.completedThrough || 0) + 1;
    if (nextFrom > TOTAL_AYAHS) return null;
    const nextTo = Math.min(nextFrom + plan.ayahsPerDay - 1, TOTAL_AYAHS);
    return { fromGlobal: nextFrom, toGlobal: nextTo,
      from: _globalToRef(nextFrom), to: _globalToRef(nextTo), isAhead: true };
  }
  return { ...getPlanTodayRange(plan), isAhead: false };
}

function injectPlanTargetMarker(surahNum, isVerse) {
  const plan = _loadPlan();
  if (!plan) return;
  const range = _getPlanActiveRange(plan);
  if (!range) return;

  const ahead = range.isAhead;
  const stopWord = ahead ? 'Tomorrow stops here' : 'Stop here today';
  const startWord = ahead ? 'Tomorrow starts here' : 'Today starts here';
  const continueWord = ahead ? 'Tomorrow: continue into' : 'Continue into';
  const fullWord = ahead ? 'Full surah in tomorrow\'s reading' : 'Full surah in today\'s reading';

  // Inject "starts here" before the first ayah when range starts mid-surah
  if (range.from.surah === surahNum && range.from.ayah > 1) {
    _insertMarker(`
      <div class="plan-target-marker">
        <div class="plan-target-marker-line"></div>
        <span class="plan-target-marker-badge plan-target-marker-continue">${startWord} — ${range.from.name} ${surahNum}:${range.from.ayah}</span>
        <div class="plan-target-marker-line"></div>
      </div>`, range.from.ayah, isVerse, 'beforebegin');
  }

  // Case 1: this surah contains the stop point
  if (range.to.surah === surahNum) {
    const targetAyah = range.to.ayah;
    // Only show "Keep reading" once the user has actually reached the target
    const furthest = _getFurthestRead();
    const reachedTarget = furthest >= range.toGlobal;
    const keepBtn = (!ahead && reachedTarget && range.toGlobal + 1 <= TOTAL_AYAHS)
      ? `<button class="plan-keep-reading-btn" onclick="keepReadingPlan()">Keep reading →</button>`
      : '';
    _insertMarker(`
      <div class="plan-target-marker plan-target-marker-stop">
        <div class="plan-target-marker-line"></div>
        <div class="plan-target-marker-inner">
          <span class="plan-target-marker-badge">${stopWord} — ${range.to.name} ${surahNum}:${targetAyah}</span>
          ${keepBtn}
        </div>
        <div class="plan-target-marker-line"></div>
      </div>`, targetAyah, isVerse);
    return;
  }

  // Case 2: this surah is the start of a cross-surah range
  if (range.from.surah === surahNum && range.from.surah !== range.to.surah) {
    const lastAyah = SURAHS[surahNum - 1][4];
    _insertMarker(`
      <div class="plan-target-marker">
        <div class="plan-target-marker-line"></div>
        <span class="plan-target-marker-badge plan-target-marker-continue">${continueWord} ${range.to.name} → stop at ${range.to.surah}:${range.to.ayah}</span>
        <div class="plan-target-marker-line"></div>
      </div>`, lastAyah, isVerse);
    return;
  }

  // Case 3: surah fully inside range
  if (surahNum > range.from.surah && surahNum < range.to.surah) {
    const lastAyah = SURAHS[surahNum - 1][4];
    _insertMarker(`
      <div class="plan-target-marker">
        <div class="plan-target-marker-line"></div>
        <span class="plan-target-marker-badge plan-target-marker-continue">${fullWord} — continue to ${range.to.name}</span>
        <div class="plan-target-marker-line"></div>
      </div>`, lastAyah, isVerse);
  }
}

function keepReadingPlan() {
  const plan = _loadPlan();
  if (!plan) return;
  if (!plan.log) plan.log = {};
  if (!isPlanTodayDone(plan)) {
    // Guard: only mark done if user has actually scrolled to the target
    const range = getPlanTodayRange(plan);
    const furthest = _getFurthestRead();
    if (furthest < range.toGlobal) return;
    plan.completedThrough = Math.max(range.toGlobal, Math.min(furthest, TOTAL_AYAHS));
    plan.log[_todayStr()] = true;
    if (plan.completedThrough >= TOTAL_AYAHS && !plan.completedDate) {
      plan.completedDate = _todayStr();
    }
    _savePlan(plan);
  }
  // Re-inject tomorrow's markers and update bar
  const surah = state.quran?.currentSurah;
  if (surah) {
    document.querySelectorAll('.plan-target-marker').forEach(el => el.remove());
    const isVerse = state.quran?.viewMode === 'verse';
    injectPlanTargetMarker(surah, isVerse);
    updateReaderPlanBar();
  }
}

function updateReaderPlanBar() {
  const bar = document.getElementById('reader-plan-bar');
  if (!bar) return;
  const plan = _loadPlan();
  if (!plan) { bar.style.display = 'none'; return; }

  const range = _getPlanActiveRange(plan);
  if (!range) { bar.style.display = 'none'; return; }

  const total = range.toGlobal - range.fromGlobal + 1;
  if (total <= 0) { bar.style.display = 'none'; return; }

  // Only show the bar when the currently open surah is part of the active range
  const currentSurah = state.quran?.currentSurah;
  if (!currentSurah || currentSurah < range.from.surah || currentSurah > range.to.surah) {
    bar.style.display = 'none'; return;
  }

  // Use furthest-read for progress — never goes backward when re-reading
  const furthest = _getFurthestRead();
  const done = furthest >= range.fromGlobal
    ? Math.min(total, furthest - range.fromGlobal + 1)
    : 0;

  const pct = Math.round((done / total) * 100);
  const reached = !range.isAhead && done >= total;

  bar.style.display = 'flex';
  document.getElementById('reader-plan-fill').style.width = (pct > 0 ? Math.max(3, pct) : 0) + '%';
  document.getElementById('reader-plan-fill').className = 'reader-plan-fill' + (reached ? ' reader-plan-fill-done' : '');

  const labelEl = document.getElementById('reader-plan-label');
  if (reached) {
    labelEl.innerHTML = `Target reached &nbsp;<button class="reader-plan-done-btn" onclick="markPlanDoneFromReader()">✓ Mark done</button>`;
  } else if (range.isAhead) {
    labelEl.textContent = `Tomorrow: ${done} / ${total} ayahs`;
  } else {
    labelEl.textContent = `Today: ${done} / ${total} ayahs`;
  }
}

function markPlanDoneFromReader() {
  markPlanDone();
  // Short delay gives renderHome's internal setTimeout (350ms) time to complete
  setTimeout(() => {
    updateReaderPlanBar();
    const surah = state.quran?.currentSurah;
    if (surah) {
      document.querySelectorAll('.plan-target-marker').forEach(el => el.remove());
      injectPlanTargetMarker(surah, state.quran?.viewMode === 'verse');
    }
  }, 400);
}

function cancelPlan() {
  let sheet = document.getElementById('plan-cancel-sheet');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.id = 'plan-cancel-sheet';
    document.body.appendChild(sheet);
  }
  sheet.innerHTML = `
    <div class="plan-setup-overlay" onclick="closePlanCancelSheet()"></div>
    <div class="plan-cancel-box">
      <div class="plan-cancel-title">Reading Plan</div>
      <div class="plan-cancel-sub">What would you like to do?</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px">
        <button class="plan-change-pace-btn" onclick="openChangePaceSheet()">⚡ Change pace</button>
        <button class="plan-restart-btn" onclick="confirmRestartPlan()">↺ Restart from beginning</button>
        <button class="plan-cancel-confirm-btn" onclick="confirmCancelPlan()">Remove plan</button>
        <button class="plan-setup-cancel" onclick="closePlanCancelSheet()">Keep my plan</button>
      </div>
    </div>`;
  sheet.style.display = 'block';
}

function closePlanCancelSheet() {
  const sheet = document.getElementById('plan-cancel-sheet');
  if (sheet) sheet.style.display = 'none';
}

function openChangePaceSheet() {
  closePlanCancelSheet();
  let modal = document.getElementById('plan-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'plan-setup-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="plan-setup-overlay" onclick="closePlanSetup()"></div>
    <div class="plan-setup-box">
      <div class="plan-setup-title">⚡ Change Pace</div>
      <div class="plan-setup-sub">Pick a new pace — your progress is kept</div>
      <div class="plan-setup-options">
        ${PLAN_OPTIONS.map(o => `
          <div class="plan-option" onclick="changePlan('${o.type}')">
            <div class="plan-option-label">${o.label}</div>
            <div class="plan-option-sub">${o.sub}</div>
          </div>
        `).join('')}
        <div class="plan-option" onclick="openCustomPlanSetup(true)">
          <div class="plan-option-label">Custom</div>
          <div class="plan-option-sub">Set your own pace</div>
        </div>
      </div>
      <button class="plan-setup-cancel" onclick="closePlanSetup()">Cancel</button>
    </div>`;
  modal.style.display = 'block';
}

function confirmRestartPlan() {
  closePlanCancelSheet();
  const plan = _loadPlan();
  if (!plan) return;
  plan.completedThrough = 0;
  plan.log = {};
  plan.startDate = _todayStr();
  delete plan.completedDate;
  _savePlan(plan);
  // Reset furthest-read so progress bar starts fresh
  localStorage.removeItem('huda_furthest_read');
  try {
    const lr = JSON.parse(localStorage.getItem('huda_last_read') || 'null');
    if (lr) { lr.ayah = null; localStorage.setItem('huda_last_read', JSON.stringify(lr)); }
  } catch(e) {}
  haptic(60);
  renderHome();
}

function confirmCancelPlan() {
  closePlanCancelSheet();
  _savePlan(null);
  renderHome();
}

function jumpToPlanReading(readAhead = false) {
  const plan = _loadPlan();
  if (!plan) return;
  let surah, ayah;

  if (readAhead) {
    // Tomorrow's first ayah = one past today's completedThrough
    const ref = _globalToRef((plan.completedThrough || 0) + 1);
    surah = ref.surah; ayah = ref.ayah;
  } else {
    const range = getPlanTodayRange(plan);
    // Resume from last read position if it falls within today's range
    try {
      const lr = JSON.parse(localStorage.getItem('huda_last_read') || 'null');
      if (lr?.surah && lr?.ayah) {
        const cur = globalAyahNum(lr.surah, lr.ayah);
        if (cur >= range.fromGlobal && cur <= range.toGlobal) {
          surah = lr.surah; ayah = lr.ayah;
        }
      }
    } catch(e) {}
    // Fallback: start of today's range
    if (!surah) { surah = range.from.surah; ayah = range.from.ayah; }
  }

  state.quran.viewMode = 'page';
  switchTab('quran');
  setTimeout(() => openSurah(surah, ayah), 100);
}

// ── Render helpers ─────────────────────────────────────────────

function _renderWeekCalendar(plan) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const names = ['S','M','T','W','T','F','S'];
    days.push({ name: names[d.getDay()], done: !!(plan.log && plan.log[key]), isToday: i === 0 });
  }
  return `<div class="plan-week-cal">${days.map(d => `
    <div class="plan-week-day${d.isToday ? ' plan-week-today' : ''}">
      <div class="plan-week-dot${d.done ? ' plan-week-dot-done' : ''}">${d.done ? '✓' : ''}</div>
      <div class="plan-week-name">${d.name}</div>
    </div>`).join('')}</div>`;
}

// ── Render ─────────────────────────────────────────────────────

function renderPlanCard() {
  const plan = _loadPlan();

  // No plan — show a compact "Start a plan" prompt
  if (!plan) {
    return `
      <div class="plan-card plan-card-empty" onclick="openPlanSetup()">
        <div class="plan-empty-icon">📅</div>
        <div>
          <div class="plan-empty-title">Start a Reading Plan</div>
          <div class="plan-empty-sub">Complete the Quran in 30 days, 3 months, or 1 year</div>
        </div>
        <div class="plan-empty-arrow">›</div>
      </div>`;
  }

  const done     = isPlanTodayDone(plan);
  const range    = getPlanTodayRange(plan);
  const streak   = getPlanStreak(plan);
  const pct      = getPlanPct(plan);
  const dayNum   = getPlanDayNumber(plan);
  const finished = (plan.completedThrough || 0) >= TOTAL_AYAHS;
  const daysLeft = getPlanDaysRemaining(plan);
  const schedule = getPlanScheduleStatus(plan);

  const _rangeLabel = (f, t) => f.surah === t.surah
    ? `${f.name} ${f.surah}:${f.ayah}–${t.ayah}`
    : `${f.name} ${f.surah}:${f.ayah} → ${t.name} ${t.surah}:${t.ayah}`;
  const fromLabel = _rangeLabel(range.from, range.to);
  const stopLabel = `${range.to.name} ${range.to.surah}:${range.to.ayah}`;

  if (finished) {
    return `
      <div class="plan-card plan-card-done">
        <div class="plan-done-icon">🎉</div>
        <div style="flex:1">
          <div class="plan-done-title">Quran Complete!</div>
          <div class="plan-done-sub">MashAllah — completed ${plan.completedDate ? 'on ' + plan.completedDate : 'the full Quran'}</div>
        </div>
        <button class="plan-cancel-btn" onclick="event.stopPropagation();cancelPlan()">✕</button>
      </div>`;
  }

  if (done) {
    const nextFrom = (plan.completedThrough || 0) + 1;
    const hasNext = nextFrom <= TOTAL_AYAHS;
    const nextRef = hasNext ? _globalToRef(nextFrom) : null;
    const nextLabel = hasNext ? (() => {
      const nextTo = Math.min(nextFrom + plan.ayahsPerDay - 1, TOTAL_AYAHS);
      return _rangeLabel(nextRef, _globalToRef(nextTo));
    })() : null;
    return `
      <div class="plan-card plan-card-today-done">
        <div class="plan-card-header">
          <div class="plan-label">Reading Plan · Day ${dayNum}</div>
          ${streak > 1 ? `<div class="plan-streak">🔥 ${streak}</div>` : ''}
        </div>
        <div class="plan-done-check">✓ Today's reading complete</div>
        ${nextLabel ? `<div class="plan-next-label">Tomorrow: ${nextLabel}</div>` : ''}
        ${_renderWeekCalendar(plan)}
        <div class="plan-progress-wrap" style="margin-bottom:6px">
          <div class="plan-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="plan-footer-row">
          <span class="plan-pct">${pct}% complete · ${daysLeft}d left</span>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="plan-cancel-btn" onclick="event.stopPropagation();cancelPlan()">⋯</button>
            ${hasNext ? `<button class="plan-read-btn plan-read-ahead-btn" onclick="jumpToPlanReading(true)">Read ahead ›</button>` : ''}
          </div>
        </div>
      </div>`;
  }

  const totalToday    = range.toGlobal - range.fromGlobal + 1;
  const ayahsDone     = getPlanTodayAyahsDone(plan);
  const dayPct        = totalToday > 0 ? Math.round((ayahsDone / totalToday) * 100) : 0;
  const reachedTarget = ayahsDone >= totalToday;

  let badgeHtml = '';
  if (schedule.status === 'behind') {
    badgeHtml = `<div class="plan-status-badge plan-status-behind">${schedule.daysBehind}d behind</div>`;
  } else if (streak > 1) {
    badgeHtml = `<div class="plan-streak">🔥 ${streak}</div>`;
  }

  const catchUpBtn = schedule.status === 'behind'
    ? `<button class="plan-catchup-btn" onclick="catchUpPlan()">Skip to today's position</button>`
    : '';

  return `
    <div class="plan-card">
      <div class="plan-card-header">
        <div class="plan-label">Reading Plan · Day ${dayNum}</div>
        ${badgeHtml}
      </div>
      <div class="plan-range">${fromLabel}</div>
      <div class="plan-stop-row">
        <span class="plan-stop-label">Stop at</span>
        <span class="plan-stop-ref">${stopLabel}</span>
      </div>
      ${catchUpBtn}
      <div class="plan-today-row">
        <span class="plan-day-count">${ayahsDone} of ${totalToday} ayahs today</span>
        ${reachedTarget ? '<span class="plan-target-reached">Target reached ✓</span>' : ''}
      </div>
      <div class="plan-progress-wrap plan-progress-today">
        <div class="plan-progress-fill${reachedTarget ? ' plan-fill-complete' : ''}" style="width:${ayahsDone > 0 ? Math.max(3, dayPct) : 0}%"></div>
      </div>
      ${_renderWeekCalendar(plan)}
      <div class="plan-progress-wrap" style="margin-bottom:6px">
        <div class="plan-progress-fill plan-fill-overall" style="width:${pct}%"></div>
      </div>
      <div class="plan-footer-row">
        <span class="plan-pct">${pct}% of Quran · ${daysLeft}d left</span>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="plan-cancel-btn" onclick="event.stopPropagation();cancelPlan()">⋯</button>
          <button class="plan-read-btn" onclick="jumpToPlanReading()">Read ▶</button>
          <button class="plan-done-btn" onclick="markPlanDone()">✓ Done</button>
        </div>
      </div>
    </div>`;
}

function openPlanSetup() {
  let modal = document.getElementById('plan-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'plan-setup-modal';
    document.body.appendChild(modal);
  }
  const hasFurthest = _getFurthestRead() > 0;
  modal.innerHTML = `
    <div class="plan-setup-overlay" onclick="closePlanSetup()"></div>
    <div class="plan-setup-box">
      <div class="plan-setup-title">📅 Start a Reading Plan</div>
      <div class="plan-setup-sub">Complete the entire Quran at your own pace</div>
      ${hasFurthest ? `
        <label class="plan-from-current-row">
          <input type="checkbox" id="plan-from-current">
          <span>Start from where I left off</span>
        </label>` : ''}
      <div class="plan-setup-options">
        ${PLAN_OPTIONS.map(o => `
          <div class="plan-option" onclick="startPlan('${o.type}', ${hasFurthest ? "document.getElementById('plan-from-current')?.checked||false" : 'false'})">
            <div class="plan-option-label">${o.label}</div>
            <div class="plan-option-sub">${o.sub}</div>
          </div>
        `).join('')}
        <div class="plan-option" onclick="openCustomPlanSetup()">
          <div class="plan-option-label">Custom</div>
          <div class="plan-option-sub">Set your own pace</div>
        </div>
      </div>
      <button class="plan-setup-cancel" onclick="closePlanSetup()">Not now</button>
    </div>`;
  modal.style.display = 'block';
}

function openCustomPlanSetup(isChangePace) {
  let modal = document.getElementById('plan-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'plan-setup-modal';
    document.body.appendChild(modal);
  }
  const hasFurthest = !isChangePace && _getFurthestRead() > 0;
  const submitFn = isChangePace
    ? `changeCustomPlan(document.getElementById('plan-custom-days').value)`
    : `startCustomPlan(document.getElementById('plan-custom-days').value, ${hasFurthest ? "document.getElementById('plan-from-current')?.checked||false" : 'false'})`;
  modal.innerHTML = `
    <div class="plan-setup-overlay" onclick="closePlanSetup()"></div>
    <div class="plan-setup-box">
      <div class="plan-setup-title">📅 Custom Plan</div>
      <div class="plan-setup-sub">How many days to complete the Quran?</div>
      <input type="number" id="plan-custom-days" class="plan-custom-input"
        placeholder="e.g. 60" min="1" max="3650">
      ${hasFurthest ? `
        <label class="plan-from-current-row" style="margin-bottom:12px">
          <input type="checkbox" id="plan-from-current">
          <span>Start from where I left off</span>
        </label>` : ''}
      <button class="plan-read-btn" style="width:100%;margin-bottom:8px" onclick="${submitFn}">Start Plan</button>
      <button class="plan-setup-cancel" onclick="closePlanSetup()">Cancel</button>
    </div>`;
  modal.style.display = 'block';
}

function closePlanSetup() {
  const modal = document.getElementById('plan-setup-modal');
  if (modal) modal.style.display = 'none';
}
