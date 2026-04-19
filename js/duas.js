/* ============================================================
   HUDA PWA — Duas
   ============================================================ */

// ── DUAS TAB ──────────────────────────────────────────────────
const DUA_ICONS = {
  'Morning Adhkar':'🌅','Evening Adhkar':'🌆','Before Sleeping':'🌙',
  'Upon Waking':'☀️','Before Eating':'🍽️','After Eating':'🤲',
  'For Anxiety & Distress':'💚','After Prayer':'📿','Entering & Leaving Home':'🏠',
  'Entering & Leaving Masjid':'🕌','Entering & Leaving Toilet':'🚻','Travelling':'✈️','For Parents':'❤️',
  'Seeking Forgiveness':'🌿','For Guidance & Knowledge':'📚',
  'Essential Duas ⭐':'⭐','Prophetic Duas ﷺ':'🌙'
};

function renderDuasHome() {
  const tab = document.getElementById('tab-duas');
  tab.innerHTML = `
    <div style="background:var(--emerald);padding:16px 20px;padding-top:calc(16px + env(safe-area-inset-top,0px));color:white">
      <h1 style="font-size:22px;font-weight:800;margin-bottom:2px">الأَدْعِيَة</h1>
      <p style="font-size:13px;opacity:0.8">Authenticated Duas · Hisnul Muslim</p>
    </div>
    <div class="category-grid">
      ${Object.keys(DUAS).map(cat => `
        <div class="category-card" onclick="openDuaCategory('${cat.replace(/'/g,"\\'")}')">
          <div class="category-icon">${DUA_ICONS[cat] || '🤲'}</div>
          <div class="category-name">${cat}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function openDuaCategory(cat) {
  state.learn.currentDuaCategory = cat;
  state.learn.currentDuaIndex = 0;
  if (cat === 'Prophetic Duas ﷺ') {
    renderProphetList();
  } else {
    renderDuaReader();
  }
}

// ── Prophet list (intermediate screen) ────────────────────────
const PROPHET_ICONS = {
  'Prophet Muhammad ﷺ': '🌙',
  'Prophet Adam ﷺ':     '🌿',
  'Prophet Nuh ﷺ':      '🌊',
  'Prophet Ibrahim ﷺ':  '🔥',
  'Prophet Musa ﷺ':     '⚡',
  'Prophet Yunus ﷺ':    '🐋',
  'Prophet Ayyub ﷺ':    '💚',
  'Prophet Zakariyya ﷺ':'🌸',
  'Prophet Sulayman ﷺ': '👑',
};

function renderProphetList() {
  const all = DUAS['Prophetic Duas ﷺ'];
  const seen = _prophetOrder();
  const counts = {};
  all.forEach(d => { counts[d.prophet] = (counts[d.prophet] || 0) + 1; });
  const tab = document.getElementById('tab-duas');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderDuasHome()">←</button>
      <div>
        <h2>Prophetic Duas ﷺ</h2>
        <div style="font-size:11px;opacity:0.8">🌙 Duas of the Prophets</div>
      </div>
    </div>
    <div style="padding:10px 16px 4px">
      <p style="font-size:13px;color:var(--gray-500)">Select a Prophet to view their supplications</p>
    </div>
    <div class="prophet-list">
      ${seen.map(name => `
        <div class="prophet-row" onclick="openProphetDuas('${name.replace(/'/g,"\\'")}')">
          <div class="prophet-row-icon">${PROPHET_ICONS[name] || '🤲'}</div>
          <div class="prophet-row-info">
            <div class="prophet-row-name">${name}</div>
            <div class="prophet-row-count">${counts[name]} dua${counts[name] > 1 ? 's' : ''}</div>
          </div>
          <div class="prophet-row-arrow">›</div>
        </div>
      `).join('')}
    </div>
  `;
}

function openProphetDuas(prophet) {
  state.learn.currentProphet = prophet;
  state.learn.currentDuaIndex = 0;
  renderProphetDuaReader();
}

function _prophetOrder() {
  return [...new Set(DUAS['Prophetic Duas ﷺ'].map(d => d.prophet))];
}

function renderProphetDuaReader() {
  const prophet = state.learn.currentProphet;
  const duas = DUAS['Prophetic Duas ﷺ'].filter(d => d.prophet === prophet);
  const i = state.learn.currentDuaIndex;
  const dua = duas[i];
  const prophets = _prophetOrder();
  const pIdx = prophets.indexOf(prophet);
  const isFirst = pIdx === 0 && i === 0;
  const isLast = pIdx === prophets.length - 1 && i === duas.length - 1;
  const tab = document.getElementById('tab-duas');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderProphetList()">←</button>
      <div>
        <h2>${prophet}</h2>
        <div style="font-size:11px;opacity:0.8">${PROPHET_ICONS[prophet] || '🤲'} Prophetic Duas</div>
      </div>
    </div>
    <div class="dua-reader-layout">
      <div class="dua-card fade-in">
        <div class="dua-counter">${i + 1} of ${duas.length}</div>
        <div class="dua-prophet">${PROPHET_ICONS[prophet] || '🤲'} ${prophet}</div>
        <div class="dua-arabic">${dua.arabic}</div>
        <div class="dua-transliteration">${dua.transliteration}</div>
        <div class="dua-meaning">${dua.meaning}</div>
        <span class="dua-source-badge">📚 ${dua.source} · ${dua.grade}</span>
        <button class="share-dua-btn" onclick="shareProphetDua(${i})">Share ↗</button>
      </div>
      <div class="dua-nav">
        <button class="dua-nav-btn" onclick="changeProphetDua(-1)" ${isFirst ? 'disabled' : ''}>← Previous</button>
        <span style="font-size:12px;color:var(--gray-400)">${i + 1} / ${duas.length}</span>
        <button class="dua-nav-btn" onclick="changeProphetDua(1)" ${isLast ? 'disabled' : ''}>Next →</button>
      </div>
    </div>
  `;
  _attachDuaSwipe(tab.querySelector('.dua-card'), dir => changeProphetDua(dir));
}

function changeProphetDua(dir) {
  const prophets = _prophetOrder();
  const duas = DUAS['Prophetic Duas ﷺ'].filter(d => d.prophet === state.learn.currentProphet);
  const newIndex = state.learn.currentDuaIndex + dir;
  if (newIndex >= 0 && newIndex < duas.length) {
    state.learn.currentDuaIndex = newIndex;
  } else if (dir === 1) {
    const pIdx = prophets.indexOf(state.learn.currentProphet);
    if (pIdx < prophets.length - 1) {
      state.learn.currentProphet = prophets[pIdx + 1];
      state.learn.currentDuaIndex = 0;
    }
  } else {
    const pIdx = prophets.indexOf(state.learn.currentProphet);
    if (pIdx > 0) {
      state.learn.currentProphet = prophets[pIdx - 1];
      const prevDuas = DUAS['Prophetic Duas ﷺ'].filter(d => d.prophet === prophets[pIdx - 1]);
      state.learn.currentDuaIndex = prevDuas.length - 1;
    }
  }
  renderProphetDuaReader();
}

function shareProphetDua(index) {
  const dua = DUAS['Prophetic Duas ﷺ'].filter(d => d.prophet === state.learn.currentProphet)[index];
  const text = `${dua.arabic}\n\n${dua.transliteration}\n\n"${dua.meaning}"\n\n— ${dua.source} | ${dua.grade}\n\nShared from Huda Islamic Companion`;
  if (navigator.share) {
    navigator.share({ title: `Dua of ${dua.prophet}`, text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => showToast('Dua copied ✓')).catch(() => {});
  }
}

function renderDuaReader() {
  const cat = state.learn.currentDuaCategory;
  const duas = DUAS[cat];
  const i = state.learn.currentDuaIndex;
  const dua = duas[i];
  const tab = document.getElementById('tab-duas');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderDuasHome()">←</button>
      <div>
        <h2>${cat}</h2>
        <div style="font-size:11px;opacity:0.8">${DUA_ICONS[cat] || '🤲'} Hisnul Muslim</div>
      </div>
    </div>
    <div class="dua-reader-layout">
      <div class="dua-card fade-in">
        <div class="dua-counter">${i + 1} of ${duas.length}</div>
        <div class="dua-arabic">${dua.arabic}</div>
        <div class="dua-transliteration">${dua.transliteration}</div>
        <div class="dua-meaning">${dua.meaning}</div>
        <span class="dua-source-badge">📚 ${dua.source} · ${dua.grade}</span>
        <button class="share-dua-btn" onclick="shareDua(${state.learn.currentDuaIndex})">Share ↗</button>
      </div>
      <div class="dua-nav">
        <button class="dua-nav-btn" onclick="changeDua(-1)" ${i === 0 ? 'disabled' : ''}>← Previous</button>
        <span style="font-size:12px;color:var(--gray-400)">${i + 1} / ${duas.length}</span>
        <button class="dua-nav-btn" onclick="changeDua(1)" ${i === duas.length - 1 ? 'disabled' : ''}>Next →</button>
      </div>
    </div>
  `;
  _attachDuaSwipe(tab.querySelector('.dua-card'), dir => changeDua(dir));
}

function _attachDuaSwipe(el, onSwipe) {
  let _sx = 0, _sy = 0;
  el.addEventListener('touchstart', e => {
    _sx = e.touches[0].clientX;
    _sy = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _sx;
    const dy = e.changedTouches[0].clientY - _sy;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    onSwipe(dx < 0 ? 1 : -1);
  }, { passive: true });
}

function changeDua(dir) {
  const cat = state.learn.currentDuaCategory;
  const max = DUAS[cat].length - 1;
  state.learn.currentDuaIndex = Math.max(0, Math.min(max, state.learn.currentDuaIndex + dir));
  renderDuaReader();
}

// ── Share Dua ─────────────────────────────────────────────────
function shareDua(index) {
  const cat = state.learn.currentDuaCategory;
  const dua = DUAS[cat][index];
  const text = `${dua.arabic}\n\n${dua.transliteration}\n\n"${dua.meaning}"\n\n— ${dua.source} | ${dua.grade}\n\nShared from Huda Islamic Companion`;
  if (navigator.share) {
    navigator.share({ title: `Dua: ${cat}`, text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => showToast('Dua copied ✓')).catch(() => {});
  }
}
