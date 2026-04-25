/* ============================================================
   HUDA PWA — Learn Tab
   ============================================================ */

// ── LEARN TAB ─────────────────────────────────────────────────
function renderLearnHub() {
  state.learn.currentSection = null;
  state.learn.currentTopSection = null;
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
        { icon:'🤲', bg:'#f0fdf4', title:'The Etiquette of Dua', desc:'Adab, best times & conditions for accepted dua', fn:'openDuaAdab' },
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
  state.learn.currentTopSection = 'newmuslim';
  state.learn.currentSection = null;
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
  state.learn.currentTopSection = 'childrensquran';
  state.learn.currentSection = null;
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
  state.learn.currentTopSection = 'names';
  state.learn.currentSection = null;
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
      <div class="name-meaning">${n.meaning}</div>
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
  state.learn.currentTopSection = 'hajj';
  state.learn.currentSection = null;
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
  state.learn.currentTopSection = 'zakat';
  state.learn.currentSection = null;
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
    if (statusEl) { statusEl.textContent = `✓ Live prices loaded · Gold: $${zakatPrices.gold.toFixed(2)}/g · Silver: $${zakatPrices.silver.toFixed(4)}/g`; statusEl.style.color = ''; }
  } catch(e) {
    // Fallback prices — approximate as of early 2026 (~$105/g gold, ~$1.03/g silver). TODO: update annually — last reviewed 2026-04
    zakatPrices.gold = 105;
    zakatPrices.silver = 1.03;
    zakatPrices.rates = { USD:1, GBP:0.79, EUR:0.92, AED:3.67 };
    if (statusEl) { statusEl.textContent = '⚠️ Could not load live prices — using estimates from early 2026. Results may be inaccurate.'; statusEl.style.color = '#d97706'; }
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



// ── F) The Etiquette of Dua ───────────────────────────────────
const DUA_ADAB_SECTIONS = [
  {
    icon: '📖',
    title: 'Dua is Worship',
    color: '#d1fae5',
    content: `**"And your Lord said: Call upon Me, I will respond to you. Verily, those who are arrogant about My worship will enter Hell in humiliation."** (Quran 40:60)

The Prophet ﷺ said: **"Dua is worship."** (Abu Dawud 1479 — Sahih)

Dua is one of the most beloved acts to Allah. It is the direct line between the servant and his Lord — no intermediary, no barrier. Allah hears every whisper, sees every tear, knows every need before you even ask.`
  },
  {
    icon: '🌟',
    title: 'Etiquette (Adab) of Dua',
    color: '#fef3c7',
    content: `**1. Begin with praise and salah on the Prophet ﷺ**
The Prophet ﷺ heard someone making dua without praising Allah or sending salah on the Prophet. He said: "This one was hasty." Then he said: "When one of you makes dua, let him begin with praise of Allah, then send salah on the Prophet, then ask whatever he wishes." (Abu Dawud 1481 — Sahih)

**2. Face the Qibla and raise your hands**
The Prophet ﷺ raised his hands in dua. He said: "Allah is Generous and Shy — He is ashamed to return the hands of His servant empty when he raises them to Him." (Abu Dawud 1488 — Hasan)

**3. Have certainty Allah will respond**
The Prophet ﷺ said: "Call upon Allah while being certain of a response." (Tirmidhi 3479 — Hasan)

**4. Be earnest and repeat your dua**
He ﷺ said: "When one of you makes dua, let him not say: 'O Allah, forgive me if You wish' — but rather be earnest in his request." (Bukhari 6338)

**5. Be in a state of wudu if possible**
Scholars classify wudu before dua as mustahabb (recommended), derived from the Prophet's ﷺ general practice of maintaining purity before acts of worship. It is not obligatory, but it is a mark of reverence.

**6. Use Allah's Names and attributes**
"And to Allah belong the best names, so invoke Him by them." (Quran 7:180)`
  },
  {
    icon: '⏰',
    title: 'Best Times for Dua',
    color: '#dbeafe',
    content: `**1. Last third of the night (Tahajjud time)**
The Prophet ﷺ said: "Our Lord descends every night to the lowest heaven when the last third of the night remains and says: Who is calling upon Me that I may answer him? Who is asking from Me that I may give him? Who is seeking forgiveness from Me that I may forgive him?" (Bukhari 1145)

**2. In sujood (prostration)**
He ﷺ said: "The closest a servant is to his Lord is when he is in sujood, so make plentiful dua." (Muslim 482)

**3. Between the adhan and iqamah**
"Dua is not rejected between the adhan and the iqamah." (Abu Dawud 521 — Sahih)

**4. The last hour of Friday (after Asr)**
He ﷺ said: "On Friday there is an hour during which no Muslim asks Allah for something good except that Allah gives it to him." (Bukhari 935)

**5. When fasting, at the time of breaking fast**
"Three supplications are not rejected: the supplication of the fasting person when breaking his fast..." (Tirmidhi 3598 — Hasan)

**6. While travelling**
He ﷺ said: "Three duas are answered without doubt: the dua of the oppressed, the dua of the traveller, and the dua of a parent for his child." (Tirmidhi 1905 — Hasan)`
  },
  {
    icon: '✅',
    title: 'Conditions for Accepted Dua',
    color: '#f0fdf4',
    content: `**1. Halal income and food**
The Prophet ﷺ mentioned a man who travels far, dishevelled and dusty, raising his hands to the sky: "O Lord! O Lord!" — but his food is haram, his drink is haram, his clothing is haram, and he was nourished with haram. **"How can his dua be answered?"** (Muslim 1015)

**2. Sincerity and presence of heart**
Make dua with full attention and intention. The Prophet ﷺ said: "Know that Allah does not respond to a dua from a heedless, inattentive heart." (Tirmidhi 3479 — Hasan)

**3. Obedience to Allah and avoiding haram**
Allah said: **"And when My servants ask about Me — I am near. I respond to the call of the caller when he calls upon Me. So let them respond to Me and believe in Me, so they may be guided."** (Quran 2:186)

**4. Asking for something permissible**
The Prophet ﷺ said dua will be answered "as long as he does not ask for something sinful or the severing of family ties." (Muslim 2735)

**5. Persistence — do not give up**
He ﷺ said: "The dua of any of you will be answered so long as he is not hasty — meaning he says: I made dua but it was not answered." (Bukhari 6340)`
  },
  {
    icon: '💡',
    title: 'How Allah Responds',
    color: '#ede9fe',
    content: `The Prophet ﷺ said: **"There is no Muslim who calls upon Allah with any dua that does not contain sin or severance of family ties, except that Allah gives him one of three things: either He hastens the response in this world, or He stores it for him in the Hereafter, or He diverts from him an equivalent evil."**

They said: "Then we will make a lot of dua!" He said: "Allah is more than that." (Ahmad 10749 — Sahih)

**This means your dua is never wasted.** If you do not see it answered in this world, know it is stored as an immense treasure waiting for you on the Day of Judgement — or Allah protected you from a harm you never even knew was coming.

Make dua for others too — the Prophet ﷺ said: "When a Muslim supplicates for his absent brother, the angel says: Ameen, and may you have likewise." (Muslim 2733)`
  },
  {
    icon: '🤲',
    title: 'Recommended Opening Duas',
    color: '#fce7f3',
    content: `**Begin your dua with praise:**
اللّٰهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ
*Allahumma lakal-hamdu anta nurus-samawati wal-ard*
"O Allah, all praise is Yours. You are the Light of the heavens and the earth." (Bukhari 1120)

**Or start with:**
اللّٰهُمَّ رَبَّ جِبْرَائِيلَ وَمِيكَائِيلَ وَإِسْرَافِيلَ، فَاطِرَ السَّمَاوَاتِ وَالأَرْضِ
*Allahumma Rabba Jibraila wa Mikaila wa Israfila, fatiras-samawati wal-ard*
"O Allah, Lord of Jibreel, Mikail and Israfil, Creator of the heavens and earth." (Muslim 770)

**Send salah on the Prophet ﷺ:**
اللّٰهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ
*Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad*
(Bukhari 3370)

**Close with:**
رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
*Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar*
"Our Lord, give us good in this world and good in the Hereafter and protect us from the punishment of the Fire." (Quran 2:201 — the most complete dua)`
  },
];

function openDuaAdab() {
  state.learn.currentTopSection = 'duaadab';
  state.learn.currentSection = null;
  const tab = document.getElementById('tab-learn');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderLearnHub()">←</button>
      <div>
        <h2>The Etiquette of Dua</h2>
        <div style="font-size:11px;opacity:0.8">🤲 Adab, times & conditions</div>
      </div>
    </div>
    <div style="padding:12px 16px 4px">
      <div class="disclaimer">Based on authentic hadith from Bukhari, Muslim, Abu Dawud, and Tirmidhi.</div>
    </div>
    <div style="padding:12px 16px 80px">
      ${DUA_ADAB_SECTIONS.map(s => `
        <div class="dua-adab-section fade-in">
          <div class="dua-adab-header" style="background:${s.color}">
            <span class="dua-adab-icon">${s.icon}</span>
            <span class="dua-adab-title">${s.title}</span>
          </div>
          <div class="dua-adab-body lesson-body">${s.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// showToast is defined globally in app.js


