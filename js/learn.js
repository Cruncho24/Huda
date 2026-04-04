/* ============================================================
   HUDA PWA — Learn Tab
   ============================================================ */

// ── LEARN TAB ─────────────────────────────────────────────────
function renderLearnHub() {
  state.learn.currentSection = null;
  const tab = document.getElementById('tab-learn');
  tab.innerHTML = `
    <div class="learn-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
      <h1>📚 Learn Islam</h1>
      <p>Knowledge is a duty upon every Muslim — begin your journey here</p>
    </div>
    <div style="padding:12px 16px 4px">
      <div class="disclaimer">
        ⚠️ We are not scholars. All content is for educational purposes only. Please consult a qualified Islamic scholar for personal religious rulings.
      </div>
    </div>
    <div class="learn-cards">
      ${[
        { icon:'🕌', bg:'#d1fae5', title:'New Muslim Guide', desc:'8 essential lessons for new Muslims', fn:'openNewMuslimGuide' },
        { icon:'🔤', bg:'#dbeafe', title:"Children's Quran", desc:'Arabic alphabet & short surahs', fn:'openChildrensQuran' },
        { icon:'✨', bg:'#fef3c7', title:'99 Names of Allah', desc:'Asmaul Husna — all 99 names', fn:'openNamesOfAllah' },
        { icon:'🕋', bg:'#ede9fe', title:'Hajj & Umrah Guide', desc:'Complete step-by-step guide', fn:'openHajjGuide' },
        { icon:'💰', bg:'#fce7f3', title:'Zakat Calculator', desc:'Calculate your obligatory charity', fn:'openZakatCalc' },
        { icon:'🗓️', bg:'#e0f2fe', title:'Islamic Calendar', desc:'Hijri calendar with key Islamic dates', fn:'openCalendar' },
      ].map(c => `
        <div class="learn-card" onclick="${c.fn}()">
          <div class="learn-card-icon" style="background:${c.bg}">${c.icon}</div>
          <div class="learn-card-body">
            <div class="learn-card-title">${c.title}</div>
            <div class="learn-card-desc">${c.desc}</div>
          </div>
          <div class="learn-card-arrow">›</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── A) New Muslim Guide ───────────────────────────────────────
function openNewMuslimGuide() {
  const tab = document.getElementById('tab-learn');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderLearnHub()">←</button>
      <h2>New Muslim Guide</h2>
    </div>
    <div class="lesson-list">
      ${NEW_MUSLIM_LESSONS.map((l, i) => `
        <div class="lesson-item" onclick="openLesson(${i})">
          <div class="lesson-num">${i + 1}</div>
          <div class="lesson-title">${l.title}</div>
          <div class="lesson-arrow">›</div>
        </div>
      `).join('')}
    </div>
  `;
}

function openLesson(i) {
  state.learn.currentSection = 'lesson';
  state.learn.currentLesson = i;
  const l = NEW_MUSLIM_LESSONS[i];
  const tab = document.getElementById('tab-learn');
  const body = l.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="openNewMuslimGuide()">←</button>
      <h2>Lesson ${i + 1}</h2>
    </div>
    <div class="lesson-content fade-in">
      <div class="lesson-arabic">${l.arabic}</div>
      <div class="lesson-transliteration">${l.transliteration}</div>
      <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;color:var(--emerald-dark)">${l.title}</h3>
      <div class="lesson-body">${body}</div>
      <div style="display:flex;gap:10px;margin-top:20px">
        ${i > 0 ? `<button class="dua-nav-btn" style="flex:1" onclick="openLesson(${i-1})">← Previous</button>` : ''}
        ${i < NEW_MUSLIM_LESSONS.length - 1 ? `<button class="dua-nav-btn" style="flex:1;background:var(--emerald);color:white;border-color:var(--emerald)" onclick="openLesson(${i+1})">Next →</button>` : ''}
      </div>
    </div>
  `;
}

// ── B) Children's Quran ───────────────────────────────────────
function openChildrensQuran() {
  const tab = document.getElementById('tab-learn');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderLearnHub()">←</button>
      <h2>Children's Quran</h2>
    </div>
    <div class="tab-switcher">
      <button class="tab-switch-btn active" id="cq-letters-btn" onclick="showCQTab('letters')">Arabic Letters</button>
      <button class="tab-switch-btn" id="cq-surahs-btn" onclick="showCQTab('surahs')">Short Surahs</button>
    </div>
    <div id="cq-content"></div>
  `;
  showCQTab('letters');
}

function showCQTab(tab) {
  document.querySelectorAll('.tab-switch-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`cq-${tab}-btn`).classList.add('active');
  const content = document.getElementById('cq-content');
  if (tab === 'letters') {
    content.innerHTML = `
      <div class="letters-grid">
        ${ARABIC_LETTERS.map((l, i) => `
          <div class="letter-card" onclick="showLetterDetail(${i})">
            <div class="letter-big">${l.letter}</div>
            <div class="letter-name">${l.name}</div>
            <div class="letter-sound">"${l.sound}"</div>
          </div>
        `).join('')}
      </div>`;
  } else {
    content.innerHTML = `
      <div style="padding:12px 16px">
        <p style="font-size:13px;color:var(--gray-500);margin-bottom:12px">Short surahs for children to memorize:</p>
        ${SHORT_SURAHS.map(n => {
          const s = SURAHS[n-1];
          return `<div class="surah-item" onclick="openChildSurah(${n})">
            <div class="surah-num">${s[0]}</div>
            <div class="surah-info"><div class="surah-english">${s[2]}</div><div class="surah-meta">${s[4]} verses · ${s[5]}</div></div>
            <div class="surah-arabic-name">${s[1]}</div>
            <div class="surah-arrow">›</div>
          </div>`;
        }).join('')}
      </div>`;
  }
}

function showLetterDetail(i) {
  state.learn.currentSection = 'letter';
  state.learn.currentLetterIndex = i;
  const l = ARABIC_LETTERS[i];
  const tab = document.getElementById('tab-learn');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="openChildrensQuran()">←</button>
      <h2>Arabic Letter — ${l.name}</h2>
    </div>
    <div style="padding:32px 20px;text-align:center" class="fade-in">
      <div style="font-size:96px;direction:rtl;margin-bottom:12px;color:var(--emerald-dark)">${l.letter}</div>
      <h2 style="font-size:28px;font-weight:800;margin-bottom:6px">${l.name}</h2>
      <p style="font-size:18px;color:var(--gray-500);margin-bottom:16px">Sound: <strong>${l.sound}</strong></p>
      <div style="background:var(--emerald-light);border-radius:12px;padding:14px">
        <div style="font-size:13px;color:var(--gray-500);margin-bottom:4px">Example word:</div>
        <div style="font-size:16px;font-weight:600;color:var(--emerald-dark)">${l.example}</div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:24px;gap:10px">
        ${i > 0 ? `<button class="dua-nav-btn" onclick="showLetterDetail(${i-1})">← ${ARABIC_LETTERS[i-1].letter} ${ARABIC_LETTERS[i-1].name}</button>` : '<div></div>'}
        ${i < ARABIC_LETTERS.length - 1 ? `<button class="dua-nav-btn" onclick="showLetterDetail(${i+1})">${ARABIC_LETTERS[i+1].letter} ${ARABIC_LETTERS[i+1].name} →</button>` : '<div></div>'}
      </div>
    </div>
  `;
}

function openChildSurah(n) {
  switchTab('quran');
  setTimeout(() => openSurah(n), 100);
}

// ── C) 99 Names of Allah ──────────────────────────────────────
function openNamesOfAllah() {
  const tab = document.getElementById('tab-learn');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderLearnHub()">←</button>
      <h2>99 Names of Allah</h2>
    </div>
    <div class="search-bar">
      <input class="search-input" id="names-search" placeholder="🔍 Search names..." oninput="filterNames(this.value)">
    </div>
    <div class="names-grid" id="names-grid">
      ${renderNamesGrid(NAMES_OF_ALLAH)}
    </div>
  `;
}

function renderNamesGrid(names) {
  return names.map(n => `
    <div class="name-card" onclick="openNameDetail(${n.n - 1})">
      <div class="name-num">${n.n}</div>
      <div class="name-arabic">${n.arabic}</div>
      <div class="name-trans">${n.transliteration}</div>
      <div class="name-meaning">${n.meaning.substring(0, 40)}...</div>
    </div>
  `).join('');
}

function filterNames(q) {
  const filtered = !q.trim() ? NAMES_OF_ALLAH : NAMES_OF_ALLAH.filter(n =>
    n.transliteration.toLowerCase().includes(q.toLowerCase()) ||
    n.meaning.toLowerCase().includes(q.toLowerCase()) ||
    n.arabic.includes(q)
  );
  document.getElementById('names-grid').innerHTML = renderNamesGrid(filtered);
}

function openNameDetail(i) {
  state.learn.currentSection = 'name';
  state.learn.currentNameIndex = i;
  const n = NAMES_OF_ALLAH[i];
  const tab = document.getElementById('tab-learn');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="openNamesOfAllah()">←</button>
      <h2>Name ${n.n} of 99</h2>
    </div>
    <div class="name-detail-card fade-in">
      <div class="name-detail-arabic">${n.arabic}</div>
      <div class="name-detail-trans">${n.transliteration}</div>
      <div class="name-detail-en">${n.meaning.split('—')[0].trim()}</div>
      <div class="name-detail-meaning">${n.meaning}</div>
      <div style="margin-bottom:16px"><span class="badge badge-emerald">Source: ${n.source}</span></div>
      <div style="display:flex;gap:10px">
        ${i > 0 ? `<button class="dua-nav-btn" style="flex:1" onclick="openNameDetail(${i-1})">← ${NAMES_OF_ALLAH[i-1].transliteration}</button>` : '<div style="flex:1"></div>'}
        ${i < NAMES_OF_ALLAH.length - 1 ? `<button class="dua-nav-btn" style="flex:1;background:var(--emerald);color:white;border-color:var(--emerald)" onclick="openNameDetail(${i+1})">${NAMES_OF_ALLAH[i+1].transliteration} →</button>` : '<div style="flex:1"></div>'}
      </div>
    </div>
  `;
}

// ── D) Hajj & Umrah Guide ─────────────────────────────────────
function openHajjGuide() {
  renderHajjGuide(state.learn.hajjTab);
}

function renderHajjGuide(tab) {
  state.learn.hajjTab = tab;
  const steps = tab === 'umrah' ? HAJJ_UMRAH.umrah : HAJJ_UMRAH.hajj;
  const el = document.getElementById('tab-learn');
  el.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderLearnHub()">←</button>
      <h2>${tab === 'umrah' ? 'Umrah Guide' : 'Hajj Guide'}</h2>
    </div>
    <div class="tab-switcher">
      <button class="tab-switch-btn ${tab === 'umrah' ? 'active' : ''}" onclick="renderHajjGuide('umrah')">🕋 Umrah (4 Steps)</button>
      <button class="tab-switch-btn ${tab === 'hajj' ? 'active' : ''}" onclick="renderHajjGuide('hajj')">🌙 Hajj (8 Steps)</button>
    </div>
    <div class="hajj-steps">
      ${steps.map((s, i) => `
        <div class="hajj-step fade-in">
          <div class="step-badge">Step ${s.step}</div>
          <div class="step-title">${s.title}</div>
          <div class="step-subtitle">${s.subtitle}</div>
          <div class="step-content">${s.content}</div>
          <div class="step-supplication">
            <div style="font-size:11px;color:var(--emerald-dark);font-weight:700;margin-bottom:6px">SUPPLICATION</div>
            <div class="step-sup-arabic">${s.supplication.arabic}</div>
            <div class="step-sup-trans">${s.supplication.transliteration}</div>
            <div class="step-sup-meaning">${s.supplication.meaning}</div>
          </div>
          <div class="step-notes">📝 ${s.notes}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── E) Zakat Calculator ───────────────────────────────────────
function openZakatCalc() {
  const tab = document.getElementById('tab-learn');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderLearnHub()">←</button>
      <h2>Zakat Calculator</h2>
    </div>
    <div id="zakat-price-status" style="padding:8px 16px;font-size:12px;color:var(--gray-400)">Loading live prices...</div>
    <div class="zakat-form">
      <div class="zakat-section-title">Currency</div>
      <div class="zakat-field">
        <div class="currency-selector">
          ${['USD','GBP','EUR','AED'].map(c => `
            <button class="currency-btn ${state.learn.zakat.currency === c ? 'active' : ''}" onclick="setZakatCurrency('${c}')">${c}</button>
          `).join('')}
        </div>
      </div>

      <div class="zakat-section-title">Nisab Based On</div>
      <div class="zakat-field">
        <div class="nisab-type">
          <button class="nisab-btn ${state.learn.zakat.nisab === 'gold' ? 'active' : ''}" onclick="setNisabType('gold', this)">Gold (87.48g)</button>
          <button class="nisab-btn ${state.learn.zakat.nisab === 'silver' ? 'active' : ''}" onclick="setNisabType('silver', this)">Silver (612.36g)</button>
        </div>
      </div>

      <div class="zakat-section-title">Your Wealth</div>
      ${[
        ['cash', 'Cash on Hand', '0'],
        ['bank', 'Bank Savings', '0'],
        ['gold_g', 'Gold (grams)', '0'],
        ['silver_g', 'Silver (grams)', '0'],
        ['investments', 'Investments / Stocks', '0'],
        ['crypto', 'Cryptocurrency', '0'],
        ['business', 'Business Stock', '0'],
        ['receivables', 'Money Owed to You', '0'],
        ['debts', 'Debts You Owe (deduct)', '0'],
      ].map(([id, label]) => `
        <div class="zakat-field">
          <label>${label} <span style="color:var(--gray-400)">(${state.learn.zakat.currency})</span></label>
          <input class="zakat-input" type="number" id="z-${id}" value="0" min="0" step="any" placeholder="0">
        </div>
      `).join('')}

      <button class="calc-btn" onclick="calculateZakat()">Calculate Zakat</button>
    </div>
    <div id="zakat-result" style="margin-top:8px"></div>
  `;
  fetchZakatPrices();
}

let zakatPrices = { gold: 0, silver: 0, rates: { USD:1 } };

async function fetchZakatPrices() {
  const statusEl = document.getElementById('zakat-price-status');
  try {
    const [goldRes, silverRes, ratesRes] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU'),
      fetch('https://api.gold-api.com/price/XAG'),
      fetch('https://open.er-api.com/v6/latest/USD')
    ]);
    const goldData = await goldRes.json();
    const silverData = await silverRes.json();
    const ratesData = await ratesRes.json();
    // Gold API returns price per troy oz in USD; 1 troy oz = 31.1035g
    zakatPrices.gold = (goldData.price || goldData.bid || 0) / 31.1035;
    zakatPrices.silver = (silverData.price || silverData.bid || 0) / 31.1035;
    zakatPrices.rates = ratesData.rates || { USD: 1 };
    if (statusEl) statusEl.textContent = `✓ Live prices loaded · Gold: $${zakatPrices.gold.toFixed(2)}/g · Silver: $${zakatPrices.silver.toFixed(4)}/g`;
  } catch(e) {
    // Fallback prices (approximate)
    zakatPrices.gold = 146;
    zakatPrices.silver = 2.34;
    zakatPrices.rates = { USD:1, GBP:0.75, EUR:0.92, AED:3.67 };
    if (statusEl) statusEl.textContent = '⚠️ Using approximate prices (offline)';
  }
}

function setZakatCurrency(c) {
  state.learn.zakat.currency = c;
  document.querySelectorAll('.currency-btn').forEach(b => {
    b.classList.toggle('active', b.textContent === c);
  });
  document.querySelectorAll('label span').forEach(s => { s.textContent = `(${c})`; });
}

function setNisabType(t, btn) {
  state.learn.zakat.nisab = t;
  document.querySelectorAll('.nisab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function calculateZakat() {
  const cur = state.learn.zakat.currency;
  const rate = (zakatPrices.rates[cur] || 1);
  const usdRate = rate;

  const g = id => parseFloat(document.getElementById(`z-${id}`)?.value || 0) || 0;
  const toUSD = v => v / usdRate;

  let totalUSD = 0;
  totalUSD += toUSD(g('cash'));
  totalUSD += toUSD(g('bank'));
  totalUSD += g('gold_g') * zakatPrices.gold;
  totalUSD += g('silver_g') * zakatPrices.silver;
  totalUSD += toUSD(g('investments'));
  totalUSD += toUSD(g('crypto'));
  totalUSD += toUSD(g('business'));
  totalUSD += toUSD(g('receivables'));
  totalUSD -= toUSD(g('debts'));

  const toCur = v => v * usdRate;

  const goldNisabUSD = 87.48 * zakatPrices.gold;
  const silverNisabUSD = 612.36 * zakatPrices.silver;
  const nisabUSD = state.learn.zakat.nisab === 'gold' ? goldNisabUSD : silverNisabUSD;
  const nisabCur = toCur(nisabUSD);

  const netCur = toCur(totalUSD);
  const eligible = netCur >= nisabCur && netCur > 0;
  const zakatDue = eligible ? netCur * 0.025 : 0;

  const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  document.getElementById('zakat-result').innerHTML = `
    <div class="zakat-result">
      <div class="result-header ${eligible ? 'eligible' : 'not-eligible'}">
        <div class="result-status">${eligible ? 'Zakat Due' : 'Below Nisab'}</div>
        <div class="result-amount">${cur} ${fmt(zakatDue)}</div>
        <div style="font-size:13px;opacity:0.85;margin-top:4px">${eligible ? '2.5% of net wealth' : 'No Zakat due'}</div>
      </div>
      <div class="result-rows">
        <div class="result-row"><span class="result-row-label">Net Wealth</span><span class="result-row-value">${cur} ${fmt(netCur)}</span></div>
        <div class="result-row"><span class="result-row-label">Nisab Threshold (${state.learn.zakat.nisab})</span><span class="result-row-value">${cur} ${fmt(nisabCur)}</span></div>
        <div class="result-row"><span class="result-row-label">Zakat Rate</span><span class="result-row-value">2.5%</span></div>
        <div class="result-row"><span class="result-row-label">Zakat Due</span><span class="result-row-value" style="color:var(--emerald)">${cur} ${fmt(zakatDue)}</span></div>
      </div>
      <div class="result-dua">رَبَّنَا تَقَبَّلْ مِنَّا</div>
    </div>
  `;
  document.getElementById('zakat-result').scrollIntoView({ behavior: 'smooth' });
}



// showToast is defined globally in app.js


