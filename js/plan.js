/* ============================================================
   HUDA PWA — Daily Reading Plan
   ============================================================
   Data model (stored in localStorage as 'huda_plan'):
   {
     type: '30' | '90' | '365',
     label: '30 days',
     startDate: 'YYYY-MM-DD',
     ayahsPerDay: number,
     completedThrough: number,  // cumulative ayahs marked done (0–6236)
     log: { 'YYYY-MM-DD': true } // one entry per day marked complete
   }
*/

const PLAN_OPTIONS = [
  { type: '30',  label: '30 days',  sub: '1 Juz per day',       days: 30  },
  { type: '90',  label: '3 months', sub: '~70 ayahs per day',   days: 90  },
  { type: '365', label: '1 year',   sub: '~18 ayahs per day',   days: 365 },
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
  // Start from today or yesterday (if today not yet done)
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

function startPlan(type) {
  const opt = PLAN_OPTIONS.find(o => o.type === type);
  if (!opt) return;
  const plan = {
    type,
    label: opt.label,
    startDate: _todayStr(),
    ayahsPerDay: Math.ceil(TOTAL_AYAHS / opt.days),
    completedThrough: 0,
    log: {},
  };
  _savePlan(plan);
  renderHome();
}

function markPlanDone() {
  const plan = _loadPlan();
  if (!plan || isPlanTodayDone(plan)) return;
  const range = getPlanTodayRange(plan);
  plan.completedThrough = range.toGlobal;
  plan.log[_todayStr()] = true;
  _savePlan(plan);
  haptic(40);
  renderHome();
}

function cancelPlan() {
  if (!confirm('Remove your reading plan? Your progress will be lost.')) return;
  _savePlan(null);
  renderHome();
}

function jumpToPlanReading() {
  const plan = _loadPlan();
  if (!plan) return;
  const range = getPlanTodayRange(plan);
  switchTab('quran');
  setTimeout(() => openSurah(range.from.surah, range.from.ayah), 100);
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

  const done    = isPlanTodayDone(plan);
  const range   = getPlanTodayRange(plan);
  const streak  = getPlanStreak(plan);
  const pct     = getPlanPct(plan);
  const dayNum  = getPlanDayNumber(plan);
  const finished = (plan.completedThrough || 0) >= TOTAL_AYAHS;

  const fromLabel = range.from.surah === range.to.surah
    ? `${range.from.name} ${range.from.surah}:${range.from.ayah}–${range.to.ayah}`
    : `${range.from.name} ${range.from.surah}:${range.from.ayah} → ${range.to.name} ${range.to.surah}:${range.to.ayah}`;

  if (finished) {
    return `
      <div class="plan-card plan-card-done">
        <div class="plan-done-icon">🎉</div>
        <div style="flex:1">
          <div class="plan-done-title">Quran Complete!</div>
          <div class="plan-done-sub">MashAllah — you've completed the Quran</div>
        </div>
        <button class="plan-cancel-btn" onclick="event.stopPropagation();cancelPlan()">✕</button>
      </div>`;
  }

  if (done) {
    const nextRange = (() => {
      const nextFrom = (plan.completedThrough || 0) + 1;
      if (nextFrom > TOTAL_AYAHS) return null;
      const nextTo = Math.min(nextFrom + plan.ayahsPerDay - 1, TOTAL_AYAHS);
      const f = _globalToRef(nextFrom), t = _globalToRef(nextTo);
      return f.surah === t.surah
        ? `${f.name} ${f.surah}:${f.ayah}–${t.ayah}`
        : `${f.name} ${f.surah}:${f.ayah} → ${t.name} ${t.surah}:${t.ayah}`;
    })();
    return `
      <div class="plan-card plan-card-today-done">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="plan-label">Reading Plan · ${plan.label}</div>
          ${streak > 1 ? `<div class="plan-streak">🔥 ${streak}</div>` : ''}
        </div>
        <div class="plan-done-check">✓ Today's reading complete</div>
        ${nextRange ? `<div class="plan-next-label">Tomorrow: ${nextRange}</div>` : ''}
        <div class="plan-progress-wrap">
          <div class="plan-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="plan-footer-row">
          <span class="plan-pct">${pct}% complete</span>
          <button class="plan-cancel-btn" onclick="event.stopPropagation();cancelPlan()">Cancel plan</button>
        </div>
      </div>`;
  }

  return `
    <div class="plan-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div class="plan-label">Reading Plan · Day ${dayNum}</div>
        ${streak > 1 ? `<div class="plan-streak">🔥 ${streak}</div>` : ''}
      </div>
      <div class="plan-range">${fromLabel}</div>
      <div class="plan-progress-wrap">
        <div class="plan-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="plan-footer-row">
        <span class="plan-pct">${pct}% of Quran</span>
        <div style="display:flex;gap:8px">
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
  modal.innerHTML = `
    <div class="plan-setup-overlay" onclick="closePlanSetup()"></div>
    <div class="plan-setup-box">
      <div class="plan-setup-title">📅 Start a Reading Plan</div>
      <div class="plan-setup-sub">Complete the entire Quran at your own pace</div>
      <div class="plan-setup-options">
        ${PLAN_OPTIONS.map(o => `
          <div class="plan-option" onclick="startPlan('${o.type}');closePlanSetup()">
            <div class="plan-option-label">${o.label}</div>
            <div class="plan-option-sub">${o.sub}</div>
          </div>
        `).join('')}
      </div>
      <button class="plan-setup-cancel" onclick="closePlanSetup()">Not now</button>
    </div>`;
  modal.style.display = 'block';
}

function closePlanSetup() {
  const modal = document.getElementById('plan-setup-modal');
  if (modal) modal.style.display = 'none';
}
