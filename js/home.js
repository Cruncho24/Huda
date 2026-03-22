/* ============================================================
   HUDA PWA — Home Tab
   ============================================================ */

// ── Hijri Date (API-accurate, localStorage cached) ────────────
let _hijriCacheMem = null; // { key: 'YYYY-MM-DD', hijri: {...} }

function _hijriDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getHijriSync(date) {
  const key = _hijriDateKey(date);
  if (_hijriCacheMem && _hijriCacheMem.key === key) return _hijriCacheMem.hijri;
  const stored = localStorage.getItem('huda_hijri_' + key);
  if (stored) { try { const h = JSON.parse(stored); _hijriCacheMem = { key, hijri: h }; return h; } catch(e) {} }
  return toHijri(date);
}

async function fetchAndCacheHijri(date) {
  const key = _hijriDateKey(date);
  if (localStorage.getItem('huda_hijri_' + key)) return; // already cached
  try {
    const dd = String(date.getDate()).padStart(2,'0');
    const mm = String(date.getMonth()+1).padStart(2,'0');
    const yyyy = date.getFullYear();
    const res = await fetch(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`);
    if (!res.ok) return;
    const json = await res.json();
    const h = json.data.hijri;
    const hijri = { day: parseInt(h.day), month: h.month.number, year: parseInt(h.year), monthName: HIJRI_MONTHS[h.month.number - 1] };
    localStorage.setItem('huda_hijri_' + key, JSON.stringify(hijri));
    _hijriCacheMem = { key, hijri };
    if (state.activeTab === 'home') renderHome(); // refresh with accurate date
  } catch(e) {}
}

// ── HOME TAB ──────────────────────────────────────────────────
function renderHome() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const hijri = getHijriSync(now);
  const hijriStr = `${hijri.day} ${hijri.monthName} ${hijri.year} AH`;
  const isRamadan = hijri.month === 9;
  const h = HADITHS[state.hadithIndex % HADITHS.length];
  const lastRead = (() => { try { return JSON.parse(localStorage.getItem('huda_last_read') || 'null'); } catch(e) { return null; } })();

  // Ramadan countdown (to Iftar = Maghrib, or Suhoor = Fajr)
  let ramadanCard = '';
  if (isRamadan && state.prayer.times) {
    const maghrib = new Date(state.prayer.times.maghrib);
    const fajr = new Date(state.prayer.times.fajr);
    const nowT = new Date();
    const isBeforeIftar = nowT < maghrib;
    const target = isBeforeIftar ? maghrib : fajr;
    const label = isBeforeIftar ? 'Iftar' : 'Suhoor (tomorrow)';
    const diff = target - nowT;
    const hh = Math.floor(diff/3600000), mm = Math.floor((diff%3600000)/60000), ss = Math.floor((diff%60000)/1000);
    ramadanCard = `
      <div class="ramadan-card">
        <div class="ramadan-label">🌙 Ramadan ${hijri.year} AH</div>
        <div class="ramadan-countdown-label">${label} in</div>
        <div class="ramadan-time" id="ramadan-countdown">${hh}h ${String(mm).padStart(2,'0')}m ${String(ss).padStart(2,'0')}s</div>
      </div>`;
    // start live countdown (clear any existing one first)
    if (state.prayer.ramadanInterval) clearInterval(state.prayer.ramadanInterval);
    state.prayer.ramadanInterval = setInterval(() => {
      const el = document.getElementById('ramadan-countdown');
      if (!el) { clearInterval(state.prayer.ramadanInterval); state.prayer.ramadanInterval = null; return; }
      const d = target - new Date();
      if (d <= 0) { clearInterval(state.prayer.ramadanInterval); state.prayer.ramadanInterval = null; renderHome(); return; }
      const h2 = Math.floor(d/3600000), m2 = Math.floor((d%3600000)/60000), s2 = Math.floor((d%60000)/1000);
      el.textContent = `${h2}h ${String(m2).padStart(2,'0')}m ${String(s2).padStart(2,'0')}s`;
    }, 1000);
  }

  // Friday Jumu'ah banner — uses local date parts to match getDay() which is also local
  const isFriday = now.getDay() === 5;
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const localDateStr = `${now.getFullYear()}-${mm}-${dd}`;
  const jumuahDismissKey = `huda_jumuah_dismissed_${localDateStr}`;
  const jumuahDismissed = localStorage.getItem(jumuahDismissKey) === '1';
  const jumuahCard = (isFriday && !jumuahDismissed) ? `
    <div class="jumuah-card" id="jumuah-card">
      <div class="jumuah-content">
        <div class="jumuah-title">🕌 Jumu'ah Mubarak</div>
        <div class="jumuah-sub">Read Surah Al-Kahf today — whoever reads it on Friday, a light will shine for them until the next Friday.</div>
        <button class="jumuah-btn" onclick="switchTab('quran');setTimeout(()=>openSurah(18),100);dismissJumuah()">Read Surah Al-Kahf →</button>
      </div>
      <button class="jumuah-dismiss" onclick="dismissJumuah()" aria-label="Dismiss">✕</button>
    </div>` : '';

  document.getElementById('tab-home').innerHTML = `
    <div class="hero fade-in" style="position:relative">
      <button class="help-btn" onclick="openHelpScreen()" aria-label="Help">?</button>
      <button class="account-btn" id="account-btn" onclick="openAuthModal()" title="Account">🔑</button>
      <div class="hero-arabic">السَّلَامُ عَلَيْكُمْ</div>
      <div class="hero-sub">Peace be upon you</div>
      <div class="hero-date">${dateStr}</div>
      <div class="hero-hijri">${hijriStr}${isRamadan ? ' · 🌙 Ramadan Mubarak' : ''}</div>
    </div>

    <div class="theme-bar">
      <span class="theme-bar-label">Appearance</span>
      <div class="theme-toggle-track" onclick="toggleDarkMode()" title="Toggle theme">
        <div class="theme-toggle-thumb ${state.darkMode ? 'dark' : ''}">
          ${state.darkMode ? '🌙' : '☀️'}
        </div>
        <span class="theme-toggle-text">${state.darkMode ? 'Dark' : 'Light'}</span>
      </div>
    </div>

    ${ramadanCard}

    ${jumuahCard}

    ${lastRead ? `
    <div class="continue-card" onclick="switchTab('quran');setTimeout(()=>openSurah(${lastRead.surah},${lastRead.ayah||null}),100)">
      <div class="continue-icon">📖</div>
      <div class="continue-info">
        <div class="continue-label">Continue Reading</div>
        <div class="continue-name">${esc(lastRead.arabic)} — ${esc(lastRead.name)}</div>
      </div>
      <div style="color:var(--gray-300);font-size:20px">›</div>
    </div>` : ''}

    ${state.bookmarks.length ? `
    <div style="padding:16px 16px 0">
      <div class="section-title">🔖 Bookmarked Ayahs</div>
    </div>
    <div class="bookmarks-list">
      ${state.bookmarks.slice(0, 5).map(b => {
        const s = SURAHS[b.s - 1];
        return `
        <div class="bookmark-row" onclick="switchTab('quran');setTimeout(()=>openSurah(${b.s}),100)">
          <div class="bookmark-badge">${b.s}:${b.a}</div>
          <div class="bookmark-info">
            <div class="bookmark-surah">${s ? s[1] + ' — ' + s[2] : 'Surah ' + b.s}</div>
            <div class="bookmark-preview">${esc(b.ar)}</div>
          </div>
          <button class="bookmark-del" onclick="event.stopPropagation();removeBookmark(${b.s},${b.a})" title="Remove">✕</button>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${state.surahBookmarks.length ? `
    <div style="padding:16px 16px 0">
      <div class="section-title">📌 Saved Surahs</div>
    </div>
    <div class="saved-surahs-list">
      ${state.surahBookmarks.map(num => {
        const s = SURAHS[num - 1];
        return s ? `
        <div class="saved-surah-row" onclick="switchTab('quran');setTimeout(()=>openSurah(${num}),100)">
          <div class="saved-surah-num">${num}</div>
          <div class="saved-surah-info">
            <div class="saved-surah-name">${s[2]}</div>
            <div class="saved-surah-arabic">${s[1]}</div>
          </div>
          <div class="saved-surah-meta">${s[4]} verses</div>
          <button class="bookmark-del" onclick="event.stopPropagation();removeSurahBookmark(${num})" title="Remove">✕</button>
        </div>` : '';
      }).join('')}
    </div>` : ''}

    <div style="padding:16px 16px 0">
      <div class="section-title">📖 Hadith of the Day</div>
    </div>
    <div class="hadith-card" id="hadith-card">
      <p class="hadith-text">"${h.text}"</p>
      <div class="hadith-source">
        <span class="badge badge-emerald">${h.source}</span>
        <span class="badge badge-gold">${h.grade}</span>
      </div>
    </div>

    <div style="padding:8px 16px 8px">
      <div class="section-title">✨ Ayatul Kursi</div>
    </div>
    <div class="ayatul-kursi-card">
      <div class="ak-arabic">${AYATUL_KURSI.arabic}</div>
      <div class="ak-translation">${AYATUL_KURSI.translation}</div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="badge badge-emerald">${AYATUL_KURSI.ref}</span>
        <button class="ak-play-btn" id="ak-play" onclick="playAyatulKursi()">▶ Play</button>
        <select class="ak-reciter-select" onchange="setReciter(this.value)" title="Reciter">
          ${RECITERS.map(r => `<option value="${r.id}" ${state.reciter === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <div style="padding:8px 16px 12px">
      <div class="section-title">🌙 Your Islamic Companion</div>
    </div>
    <div class="feature-grid">
      ${[
        ['📖','Quran','All 114 surahs','quran'],
        ['🕌','Prayer','Times & Qibla','prayer'],
        ['📿','Dhikr','Daily remembrance','dhikr'],
        ['🤲','Duas','Authenticated supplications','duas'],
        ['📚','Learn','Islamic knowledge','learn'],
        ['🌟','99 Names','Asmaul Husna','learn-names'],
      ].map(([icon,title,desc,tab])=>`
        <div class="feature-card" onclick="switchTab('${tab === 'learn-names' ? 'learn' : tab}')${tab === 'learn-names' ? '; setTimeout(()=>openNamesOfAllah(),100)' : ''}">
          <div class="feature-icon">${icon}</div>
          <div class="feature-title">${title}</div>
          <div class="feature-desc">${desc}</div>
        </div>
      `).join('')}
    </div>
  `;
  updateAccountBtn(authGetCachedUser());
}

function dismissJumuah() {
  const now = new Date();
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const key = `huda_jumuah_dismissed_${now.getFullYear()}-${mm}-${dd}`;
  localStorage.setItem(key, '1');
  const el = document.getElementById('jumuah-card');
  if (el) el.remove();
}

function rotateHadith() {
  state.hadithIndex = (state.hadithIndex + 1) % HADITHS.length;
  const card = document.getElementById('hadith-card');
  if (!card) return;
  const h = HADITHS[state.hadithIndex];
  card.style.opacity = '0';
  setTimeout(() => {
    card.innerHTML = `
      <p class="hadith-text">"${h.text}"</p>
      <div class="hadith-source">
        <span class="badge badge-emerald">${h.source}</span>
        <span class="badge badge-gold">${h.grade}</span>
      </div>`;
    card.style.opacity = '1';
    card.style.transition = 'opacity 0.5s';
  }, 400);
}

function openHelpScreen() {
  document.getElementById('tab-home').innerHTML = `
    <div class="help-screen">
      <div class="help-header">
        <button class="help-back-btn" onclick="closeHelpScreen()">← Back</button>
        <div class="help-title">About Huda</div>
      </div>
      <div class="help-body">
        <p class="help-intro">Huda is your all-in-one Islamic companion. Here's what's inside.</p>

        <div class="help-section">
          <div class="help-section-title">📖 Quran</div>
          <ul class="help-list">
            <li>Browse all 114 surahs</li>
            <li>Verse view or Mushaf (page) view</li>
            <li>Audio playback with 5 reciters</li>
            <li>Bookmarks — save ayahs and surahs</li>
            <li>Tafsir — tap any ayah for commentary</li>
            <li>Share any ayah (Arabic + translation)</li>
            <li>Download all surahs for offline reading</li>
            <li>Search the Quran by English keyword</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">🕌 Prayer Times</div>
          <ul class="help-list">
            <li>GPS-based prayer times for your location</li>
            <li>Live countdown to the next prayer</li>
            <li>Qibla compass with live needle</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">📿 Dhikr</div>
          <ul class="help-list">
            <li>Daily dhikr cards with tap counter</li>
            <li>Tasbeeh counter</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">🤲 Duas</div>
          <ul class="help-list">
            <li>Categorised duas for everyday situations</li>
            <li>Duas from the Prophets</li>
            <li>Share any dua</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">📚 Learn</div>
          <ul class="help-list">
            <li>New Muslim Guide — essentials of Islam</li>
            <li>Children's Quran — Arabic alphabet + short surahs</li>
            <li>99 Names of Allah (Asmaul Husna)</li>
            <li>Hajj & Umrah Guide — step-by-step rituals</li>
            <li>Zakat Calculator</li>
            <li>Islamic (Hijri) calendar</li>
          </ul>
        </div>

        <div class="help-section">
          <div class="help-section-title">🏠 Home</div>
          <ul class="help-list">
            <li>Continue reading — picks up where you left off</li>
            <li>Bookmarked ayahs and saved surahs</li>
            <li>Hadith of the Day</li>
            <li>Ayatul Kursi with audio playback</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function closeHelpScreen() {
  renderHome();
}

