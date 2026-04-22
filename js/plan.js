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

// Official juz starting global ayah numbers (1-indexed)
const JUZ_STARTS = [1,149,260,386,517,641,751,900,1042,1201,1328,1479,1649,1803,2030,2215,2484,2674,2876,3215,3386,3564,3733,4090,4265,4511,4706,5105,5242,5673];

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

function _getJuzProgress(completedThrough) {
  return JUZ_STARTS.map((start, i) => {
    const end = i < 29 ? JUZ_STARTS[i + 1] - 1 : TOTAL_AYAHS;
    const total = end - start + 1;
    if (completedThrough >= end) return { juz: i + 1, status: 'done', pct: 100 };
    if (completedThrough >= start) return { juz: i + 1, status: 'partial', pct: Math.round((completedThrough - start + 1) / total * 100) };
    return { juz: i + 1, status: 'upcoming', pct: 0 };
  });
}

function _getLongestStreak(plan) {
  if (!plan.log) return 0;
  const dates = Object.keys(plan.log).filter(k => plan.log[k] === true).sort();
  let longest = 0, current = 0, prev = null;
  for (const dateStr of dates) {
    if (prev) {
      const d = new Date(prev + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      const expected = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      current = expected === dateStr ? current + 1 : 1;
    } else { current = 1; }
    if (current > longest) longest = current;
    prev = dateStr;
  }
  return longest;
}

function _getProjectedDate(plan) {
  const d = new Date();
  d.setDate(d.getDate() + getPlanDaysRemaining(plan));
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function _renderHeatmap(plan) {
  const log = plan.log || {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const WEEKS = 13;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dow = (today.getDay() + 6) % 7;
  const thisMonday = new Date(today); thisMonday.setDate(today.getDate() - dow);
  const weeks = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const days = []; let monthLabel = '';
    for (let d = 0; d < 7; d++) {
      const date = new Date(thisMonday); date.setDate(thisMonday.getDate() - w * 7 + d);
      const isFuture = date > today;
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      if (d === 0 && date.getDate() <= 7) monthLabel = MONTHS[date.getMonth()];
      days.push({ done: !isFuture && !!log[key], isFuture, isToday: date.getTime() === today.getTime() });
    }
    weeks.push({ days, monthLabel });
  }
  return `
    <div class="plan-heatmap-wrap">
      <div class="hm-row-labels">
        <div class="hm-row-lbl">M</div><div class="hm-row-lbl"></div><div class="hm-row-lbl">W</div>
        <div class="hm-row-lbl"></div><div class="hm-row-lbl">F</div><div class="hm-row-lbl"></div><div class="hm-row-lbl">S</div>
      </div>
      <div style="flex:1;overflow-x:auto">
        <div class="plan-heatmap-months">${weeks.map(w => `<div class="hm-month-lbl">${w.monthLabel}</div>`).join('')}</div>
        <div class="plan-heatmap-grid">${weeks.map(w =>
          `<div class="hm-col">${w.days.map(d =>
            `<div class="hm-cell${d.done ? ' hm-done' : d.isFuture ? ' hm-future' : ''}${d.isToday ? ' hm-today' : ''}"></div>`
          ).join('')}</div>`
        ).join('')}</div>
      </div>
    </div>`;
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

let _planStartGlobal = 0; // global ayah to start from (0 = Al-Fatihah 1:1)

function startPlan(type) {
  if (type === 'custom') { openCustomPlanSetup(); return; }
  const opt = PLAN_OPTIONS.find(o => o.type === type);
  if (!opt) return;
  const completedThrough = Math.max(0, _planStartGlobal - 1);
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
  _planStartGlobal = 0;
  closePlanSetup();
  renderHome();
}

function startCustomPlan(days) {
  const d = parseInt(days, 10);
  if (!d || d < 1 || d > 3650) return;
  const completedThrough = Math.max(0, _planStartGlobal - 1);
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
  _planStartGlobal = 0;
  closePlanSetup();
  renderHome();
}

function markPlanDone() {
  const plan = _loadPlan();
  if (!plan || isPlanTodayDone(plan)) return;
  if (!plan.log) plan.log = {};
  if (!plan.logPrev) plan.logPrev = {};
  const range = getPlanTodayRange(plan);
  // Snapshot current completedThrough so goBackADay can restore it exactly
  plan.logPrev[_todayStr()] = plan.completedThrough || 0;
  plan.completedThrough = range.toGlobal;
  plan.log[_todayStr()] = true;
  if (plan.completedThrough >= TOTAL_AYAHS && !plan.completedDate) {
    plan.completedDate = _todayStr();
  }
  _savePlan(plan);
  haptic(80);
  setTimeout(renderHome, 350);
}

function markPlanDoneNoNav() {
  const plan = _loadPlan();
  if (!plan || isPlanTodayDone(plan)) return;
  if (!plan.log) plan.log = {};
  if (!plan.logPrev) plan.logPrev = {};
  const range = getPlanTodayRange(plan);
  plan.logPrev[_todayStr()] = plan.completedThrough || 0;
  plan.completedThrough = range.toGlobal;
  plan.log[_todayStr()] = true;
  if (plan.completedThrough >= TOTAL_AYAHS && !plan.completedDate) plan.completedDate = _todayStr();
  _savePlan(plan);
  haptic(80);
}

function markReadAheadDoneNoNav() {
  const plan = _loadPlan();
  if (!plan || !isPlanTodayDone(plan)) return;
  if (!plan.log) plan.log = {};
  if (!plan.logPrev) plan.logPrev = {};
  const nextFrom = (plan.completedThrough || 0) + 1;
  const nextTo = Math.min(nextFrom + plan.ayahsPerDay - 1, TOTAL_AYAHS);
  const furthest = _getFurthestRead();
  if (furthest < nextTo) return;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
  if (plan.log[tomorrowStr]) return;
  plan.logPrev[tomorrowStr] = plan.completedThrough || 0;
  plan.completedThrough = nextTo;
  plan.log[tomorrowStr] = true;
  if (plan.completedThrough >= TOTAL_AYAHS && !plan.completedDate) plan.completedDate = _todayStr();
  _savePlan(plan);
  haptic(80);
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
function catchUpPlan(fromDetail = false) {
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
  if (fromDetail) { setTimeout(openPlanDetail, 150); } else { renderHome(); }
}

function _insertMarker(html, ayahId, isVerse, position = 'afterend') {
  if (isVerse) {
    const el = document.getElementById(`ayah-${ayahId}`);
    if (el) el.insertAdjacentHTML(position, html);
  } else {
    const wrap = document.querySelector(`#mushaf-page .mushaf-ayah-wrap[data-ayah="${ayahId}"]`);
    if (!wrap) return;
    // Insert directly on the ayah-wrap span — a block <div> sibling among
    // inline spans forces a flow-break at exactly the right ayah.
    wrap.insertAdjacentHTML(position, html);
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
    if (!plan.logPrev) plan.logPrev = {};
    plan.logPrev[_todayStr()] = plan.completedThrough || 0;
    plan.completedThrough = range.toGlobal;
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
  const reached = done >= total;

  bar.style.display = 'flex';
  document.getElementById('reader-plan-fill').style.width = (pct > 0 ? Math.max(3, pct) : 0) + '%';
  document.getElementById('reader-plan-fill').className = 'reader-plan-fill' + (reached ? ' reader-plan-fill-done' : '');

  const labelEl = document.getElementById('reader-plan-label');
  if (reached && !range.isAhead) {
    labelEl.innerHTML = `Target reached &nbsp;<button class="reader-plan-done-btn" onclick="markPlanDoneFromReader()">✓ Mark done</button>`;
  } else if (reached && range.isAhead) {
    labelEl.innerHTML = `Read ahead complete! &nbsp;<button class="reader-plan-done-btn" onclick="markReadAheadDoneFromReader()">✓ Mark done</button>`;
  } else if (range.isAhead) {
    labelEl.textContent = `Tomorrow: ${done} / ${total} ayahs`;
  } else {
    labelEl.textContent = `Today: ${done} / ${total} ayahs`;
  }
}

function markPlanDoneFromReader() {
  markPlanDone();
  setTimeout(() => {
    updateReaderPlanBar();
    const surah = state.quran?.currentSurah;
    if (surah) {
      document.querySelectorAll('.plan-target-marker').forEach(el => el.remove());
      injectPlanTargetMarker(surah, state.quran?.viewMode === 'verse');
    }
  }, 400);
}

function markReadAheadDone() {
  const plan = _loadPlan();
  if (!plan || !isPlanTodayDone(plan)) return;
  if (!plan.log) plan.log = {};
  if (!plan.logPrev) plan.logPrev = {};
  const nextFrom = (plan.completedThrough || 0) + 1;
  const nextTo = Math.min(nextFrom + plan.ayahsPerDay - 1, TOTAL_AYAHS);
  const furthest = _getFurthestRead();
  if (furthest < nextTo) return; // guard: user hasn't actually read through the range
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
  if (plan.log[tomorrowStr]) return; // spam guard: already marked for tomorrow
  plan.logPrev[tomorrowStr] = plan.completedThrough || 0;
  plan.completedThrough = nextTo;
  // Log tomorrow as done so it counts toward the streak
  plan.log[tomorrowStr] = true;
  if (plan.completedThrough >= TOTAL_AYAHS && !plan.completedDate) {
    plan.completedDate = _todayStr();
  }
  _savePlan(plan);
  haptic(80);
  setTimeout(renderHome, 350);
}

function markReadAheadDoneFromReader() {
  markReadAheadDone();
  setTimeout(() => {
    updateReaderPlanBar();
    const surah = state.quran?.currentSurah;
    if (surah) {
      document.querySelectorAll('.plan-target-marker').forEach(el => el.remove());
      injectPlanTargetMarker(surah, state.quran?.viewMode === 'verse');
    }
  }, 400);
}

function redistributePlan(fromDetail = false) {
  const plan = _loadPlan();
  if (!plan) return;
  const schedule = getPlanScheduleStatus(plan);
  if (schedule.status !== 'behind') return;
  const remaining = TOTAL_AYAHS - (plan.completedThrough || 0);
  const newDays = getPlanDaysRemaining(plan) + schedule.daysBehind;
  plan.ayahsPerDay = Math.ceil(remaining / newDays);
  plan.startDate = _todayStr();
  _savePlan(plan);
  showToast('Plan extended — no days skipped ✓');
  if (fromDetail) { setTimeout(openPlanDetail, 150); } else { renderHome(); }
}

function openPlanDetail() {
  const plan = _loadPlan();
  if (!plan) return;
  const done = isPlanTodayDone(plan);
  const range = getPlanTodayRange(plan);
  const streak = getPlanStreak(plan);
  const longestStreak = _getLongestStreak(plan);
  const pct = getPlanPct(plan);
  const daysLeft = getPlanDaysRemaining(plan);
  const dayNum = getPlanDayNumber(plan);
  const schedule = getPlanScheduleStatus(plan);
  const juzProgress = _getJuzProgress(plan.completedThrough || 0);
  const projectedDate = _getProjectedDate(plan);
  const totalDaysLogged = Object.keys(plan.log || {}).filter(k => (plan.log||{})[k] === true).length;
  const daysLeftDisplay = pct >= 100 ? '—' : daysLeft + 'd';
  const _rl = (f, t) => f.surah === t.surah
    ? `${f.name} ${f.surah}:${f.ayah}–${t.ayah}`
    : `${f.name} ${f.surah}:${f.ayah} → ${t.name} ${t.surah}:${t.ayah}`;

  let todaySec;
  if (done) {
    const nextFrom = (plan.completedThrough || 0) + 1;
    const hasNext = nextFrom <= TOTAL_AYAHS;
    const nextRef = hasNext ? _globalToRef(nextFrom) : null;
    const nextTo = hasNext ? Math.min(nextFrom + plan.ayahsPerDay - 1, TOTAL_AYAHS) : 0;
    const nextRef2 = hasNext ? _globalToRef(nextTo) : null;
    const raComplete = hasNext && _getFurthestRead() >= nextTo;
    todaySec = `
      <div class="pd-today pd-today-done">
        <div class="pd-today-tick">✓</div>
        <div style="flex:1">
          <div class="pd-today-title">Today's reading complete</div>
          ${hasNext ? `<div class="pd-today-sub">Tomorrow: ${_rl(nextRef, nextRef2)}</div>` : '<div class="pd-today-sub">Quran complete!</div>'}
        </div>
        ${hasNext ? `<button class="pd-read-btn" style="flex:0;white-space:nowrap;padding:8px 14px;font-size:13px" onclick="jumpToPlanReading(true)">Read ahead ›</button>` : ''}
      </div>
      ${raComplete ? `<div style="padding:0 16px 4px"><button class="pd-done-btn" style="width:100%;padding:11px" onclick="markReadAheadDoneNoNav();setTimeout(openPlanDetail,150)">✓ Mark read-ahead done</button></div>` : ''}`;
  } else {
    const ayahsDone = getPlanTodayAyahsDone(plan);
    const total = range.toGlobal - range.fromGlobal + 1;
    const dayPct = total > 0 ? Math.round(ayahsDone / total * 100) : 0;
    todaySec = `
      <div class="pd-today">
        <div class="pd-today-label">TODAY · DAY ${dayNum}</div>
        <div class="pd-today-range">${_rl(range.from, range.to)}</div>
        <div class="pd-today-bar-wrap"><div class="pd-today-bar-fill" style="width:${ayahsDone > 0 ? Math.max(3, dayPct) : 0}%"></div></div>
        <div class="pd-today-meta">${ayahsDone} of ${total} ayahs read${schedule.status === 'behind' ? ` · <span style="color:#ef4444">${schedule.daysBehind}d behind</span>` : ''}</div>
        <div class="pd-today-actions">
          <button class="pd-read-btn" onclick="jumpToPlanReading()">▶ Read</button>
          <button class="pd-done-btn" onclick="markPlanDoneNoNav();setTimeout(openPlanDetail,150)">✓ Mark done</button>
        </div>
      </div>`;
  }

  const juzSec = `
    <div class="pd-section">
      <div class="pd-section-label">Quran Progress</div>
      <div class="plan-juz-grid">${juzProgress.map(j => `
        <div class="plan-juz-cell juz-${j.status}">
          <span class="juz-num">${j.juz}</span>
          ${j.status === 'partial' ? `<div class="juz-bar"><div class="juz-bar-fill" style="width:${j.pct}%"></div></div>` : ''}
          ${j.status === 'done' ? `<span class="juz-check">✓</span>` : ''}
        </div>`).join('')}
      </div>
    </div>`;

  const statsSec = `
    <div class="pd-section">
      <div class="pd-section-label">Stats</div>
      <div class="pd-stats-row">
        <div class="pd-stat"><div class="pd-stat-value">${streak > 0 ? '🔥&nbsp;' + streak : streak}</div><div class="pd-stat-label">Streak</div></div>
        <div class="pd-stat"><div class="pd-stat-value">${longestStreak}</div><div class="pd-stat-label">Best streak</div></div>
        <div class="pd-stat"><div class="pd-stat-value">${totalDaysLogged}</div><div class="pd-stat-label">Days done</div></div>
        <div class="pd-stat"><div class="pd-stat-value">${pct}%</div><div class="pd-stat-label">Quran done</div></div>
        <div class="pd-stat"><div class="pd-stat-value">${daysLeftDisplay}</div><div class="pd-stat-label">Days left</div></div>
        <div class="pd-stat"><div class="pd-stat-value pd-stat-date">${projectedDate}</div><div class="pd-stat-label">Est. finish</div></div>
      </div>
    </div>`;

  const heatmapSec = `
    <div class="pd-section">
      <div class="pd-section-label">Reading History</div>
      ${_renderHeatmap(plan)}
    </div>`;

  const settingsSec = `
    <div class="pd-section pd-section-last">
      <div class="pd-section-label">Settings</div>
      <div class="pd-settings-list">
        ${schedule.status === 'behind' ? `
          <button class="pd-setting-btn" onclick="catchUpPlan(true)">⚡ Skip to today's position</button>
          <button class="pd-setting-btn" onclick="redistributePlan(true)">📅 Extend plan — absorb missed days</button>
        ` : `
          <button class="pd-setting-btn" onclick="openChangePaceSheet()">⚡ Change pace</button>
        `}
        <button class="pd-setting-btn" onclick="goBackADay()">↩ Go back a day</button>
        <button class="pd-setting-btn" onclick="confirmRestartPlan()">↺ Restart from beginning</button>
        <button class="pd-setting-btn pd-setting-danger" onclick="confirmCancelPlan()">🗑 Remove plan</button>
      </div>
    </div>`;

  document.getElementById('tab-home').innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderHome()">←</button>
      <div>
        <h2>Reading Plan</h2>
        <div style="font-size:11px;opacity:0.8">Day ${dayNum} · ${plan.label}</div>
      </div>
    </div>
    <div style="padding-bottom:80px">
      ${todaySec}${juzSec}${statsSec}${heatmapSec}${settingsSec}
    </div>`;
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
        <button class="plan-goback-btn" onclick="goBackADay()">↩ Go back a day</button>
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
  plan.logPrev = {};
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

function goBackADay() {
  const plan = _loadPlan();
  if (!plan) return;
  const todayStr = _todayStr();
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const yStr = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`;
  const td = new Date(); td.setDate(td.getDate() + 1);
  const tmrStr = `${td.getFullYear()}-${String(td.getMonth()+1).padStart(2,'0')}-${String(td.getDate()).padStart(2,'0')}`;
  // Undo one entry at a time — read-ahead (tomorrow) takes priority over today,
  // today takes priority over yesterday. Each click = exactly one day back.
  let dayToUndo = null;
  if (plan.log && plan.log[tmrStr]) dayToUndo = tmrStr;
  else if (plan.log && plan.log[todayStr]) dayToUndo = todayStr;
  else if (plan.log && plan.log[yStr]) dayToUndo = yStr;
  if (!dayToUndo) {
    closePlanCancelSheet();
    showToast('Nothing to undo — no recent day was marked done');
    return;
  }
  delete plan.log[dayToUndo];
  // Restore completedThrough to what it was before this day was marked done.
  // logPrev stores the exact pre-mark-done value; fall back to flat decrement for old data.
  if (plan.logPrev && plan.logPrev[dayToUndo] !== undefined) {
    plan.completedThrough = plan.logPrev[dayToUndo];
    delete plan.logPrev[dayToUndo];
  } else {
    plan.completedThrough = Math.max(0, (plan.completedThrough || 0) - plan.ayahsPerDay);
  }
  if (plan.completedDate) delete plan.completedDate;
  _savePlan(plan);
  closePlanCancelSheet();
  haptic(40);
  // Navigate directly to the start of the restored day so the user
  // lands at the "Today starts here" / "Stop here today" markers
  const restored = getPlanTodayRange(plan);
  state.quran.viewMode = 'page';
  switchTab('quran');
  setTimeout(() => openSurah(restored.from.surah, restored.from.ayah), 150);
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
    // Only resume from last-read position if user has already logged at least one day.
    // On day 1 (no log entries), huda_last_read may point anywhere in the Quran from
    // prior browsing — always start at the beginning of today's range instead.
    const hasPriorLog = Object.keys(plan.log || {}).length > 0;
    if (hasPriorLog) {
      try {
        const lr = JSON.parse(localStorage.getItem('huda_last_read') || 'null');
        if (lr?.surah && lr?.ayah) {
          const cur = globalAyahNum(lr.surah, lr.ayah);
          if (cur >= range.fromGlobal && cur <= range.toGlobal) {
            surah = lr.surah; ayah = lr.ayah;
          }
        }
      } catch(e) {}
    }
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
      <div class="plan-card plan-card-khatm" onclick="openPlanDetail()">
        <div class="plan-khatm-star">✦</div>
        <div class="plan-khatm-title">Khatm al-Quran</div>
        <div class="plan-khatm-arabic">اللّٰهُمَّ ارْحَمْنِي بِالقُرْآنِ</div>
        <div class="plan-khatm-sub">MashAllah — you completed the Quran${plan.completedDate ? ' on ' + plan.completedDate : ''}</div>
        <button class="plan-read-btn" style="margin-top:14px" onclick="event.stopPropagation();confirmRestartPlan()">Start again ↺</button>
      </div>`;
  }

  if (done) {
    const nextFrom = (plan.completedThrough || 0) + 1;
    const hasNext = nextFrom <= TOTAL_AYAHS;
    const nextRef = hasNext ? _globalToRef(nextFrom) : null;
    const nextTo = hasNext ? Math.min(nextFrom + plan.ayahsPerDay - 1, TOTAL_AYAHS) : 0;
    const nextLabel = hasNext ? _rangeLabel(nextRef, _globalToRef(nextTo)) : null;
    const readAheadComplete = hasNext && _getFurthestRead() >= nextTo;
    return `
      <div class="plan-card plan-card-today-done" onclick="openPlanDetail()">
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
        <div class="plan-footer-row" onclick="event.stopPropagation()">
          <span class="plan-pct">${pct}% complete · ${daysLeft}d left</span>
          <div style="display:flex;gap:8px;align-items:center">
            ${hasNext ? `<button class="plan-read-btn plan-read-ahead-btn" onclick="jumpToPlanReading(true)">Read ahead ›</button>` : ''}
            ${readAheadComplete ? `<button class="plan-done-btn" onclick="markReadAheadDone()">✓ Mark done</button>` : ''}
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
    ? `<button class="plan-catchup-btn" onclick="event.stopPropagation();catchUpPlan()">Skip to today's position</button>`
    : '';

  return `
    <div class="plan-card" onclick="openPlanDetail()">
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
      <div class="plan-footer-row" onclick="event.stopPropagation()">
        <span class="plan-pct">${pct}% of Quran · ${daysLeft}d left</span>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="plan-read-btn" onclick="jumpToPlanReading()">Read ▶</button>
          <button class="plan-done-btn" onclick="markPlanDone()">✓ Done</button>
        </div>
      </div>
    </div>`;
}

function openPlanSetup() {
  _planStartGlobal = 0;
  _renderPlanSetupModal();
}

function _planStartLabel() {
  if (_planStartGlobal <= 0) return 'Al-Fatihah (1)';
  const ref = _globalToRef(_planStartGlobal);
  return `${ref.name} (${ref.surah})`;
}

function _renderPlanSetupModal() {
  let modal = document.getElementById('plan-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'plan-setup-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="plan-setup-overlay" onclick="closePlanSetup()"></div>
    <div class="plan-setup-box">
      <div class="plan-setup-title">📅 Start a Reading Plan</div>
      <div class="plan-setup-sub">Complete the entire Quran at your own pace</div>
      <div class="plan-start-from-row">
        <span class="plan-start-from-label">Start from</span>
        <button class="plan-start-from-btn" onclick="openSurahPickerForPlan()">${_planStartLabel()} ▾</button>
      </div>
      <div class="plan-setup-options">
        ${PLAN_OPTIONS.map(o => `
          <div class="plan-option" onclick="startPlan('${o.type}')">
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

function openSurahPickerForPlan() {
  let modal = document.getElementById('plan-setup-modal');
  if (!modal) return;
  modal.innerHTML = `
    <div class="plan-setup-overlay" onclick="closePlanSetup()"></div>
    <div class="plan-setup-box">
      <div class="plan-setup-title">Choose Starting Surah</div>
      <input class="plan-surah-search" id="plan-surah-search" placeholder="🔍 Search surah..."
        oninput="_filterPlanSurahs(this.value)" autocomplete="off">
      <div class="plan-surah-list" id="plan-surah-list">
        ${_renderPlanSurahList(_allSurahEntries())}
      </div>
      <button class="plan-setup-cancel" onclick="_renderPlanSetupModal()">← Back</button>
    </div>`;
  modal.style.display = 'block';
  document.getElementById('plan-surah-search').focus();
}

function _renderPlanSurahList(entries) {
  return entries.map(({ s, num }) => {
    const globalStart = globalAyahNum(num, 1);
    return `<div class="plan-surah-row" onclick="_selectPlanSurah(${globalStart})">
      <span class="plan-surah-num">${num}</span>
      <span class="plan-surah-name">${s[2]}</span>
      <span class="plan-surah-arabic">${s[1]}</span>
    </div>`;
  }).join('');
}

function _allSurahEntries() {
  return SURAHS.map((s, i) => ({ s, num: i + 1 }));
}

function _filterPlanSurahs(q) {
  const list = document.getElementById('plan-surah-list');
  if (!list) return;
  const all = _allSurahEntries();
  const filtered = !q.trim() ? all : all.filter(({ s }) =>
    s[2].toLowerCase().includes(q.toLowerCase()) || s[1].includes(q)
  );
  list.innerHTML = _renderPlanSurahList(filtered);
}

function _selectPlanSurah(globalAyah) {
  _planStartGlobal = globalAyah;
  _renderPlanSetupModal();
}

function openCustomPlanSetup(isChangePace) {
  let modal = document.getElementById('plan-setup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'plan-setup-modal';
    document.body.appendChild(modal);
  }
  const submitFn = isChangePace
    ? `changeCustomPlan(document.getElementById('plan-custom-days').value)`
    : `startCustomPlan(document.getElementById('plan-custom-days').value)`;
  modal.innerHTML = `
    <div class="plan-setup-overlay" onclick="closePlanSetup()"></div>
    <div class="plan-setup-box">
      <div class="plan-setup-title">📅 Custom Plan</div>
      <div class="plan-setup-sub">How many days to complete the Quran?</div>
      ${!isChangePace ? `<div class="plan-start-from-row"><span class="plan-start-from-label">Start from</span><span style="font-size:13px;font-weight:600;color:#059669">${_planStartLabel()}</span></div>` : ''}
      <input type="number" id="plan-custom-days" class="plan-custom-input"
        placeholder="e.g. 60" min="1" max="3650">
      <button class="plan-read-btn" style="width:100%;margin-bottom:8px" onclick="${submitFn}">Start Plan</button>
      <button class="plan-setup-cancel" onclick="${isChangePace ? 'closePlanSetup()' : '_renderPlanSetupModal()'}">← Back</button>
    </div>`;
  modal.style.display = 'block';
}

function closePlanSetup() {
  _planStartGlobal = 0;
  const modal = document.getElementById('plan-setup-modal');
  if (modal) modal.style.display = 'none';
}
