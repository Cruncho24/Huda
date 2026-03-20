/* ============================================================
   HUDA PWA — App Logic
   ============================================================ */

// ── Reciters ──────────────────────────────────────────────────
const RECITERS = [
  { id: 'ar.alafasy',        name: 'Mishary Alafasy',      qurancdnId: 7 },
  {
    id: 'ar.mahermuaiqly', name: 'Maher Al-Muqaili',
    surahUrl: n => `https://server8.mp3quran.net/maher/${String(n).padStart(3,'0')}.mp3`,
  },
  {
    id: 'ar.abdullahbasfar', name: 'Abdullah Basfar',
    // cdn.islamic.network returns 403 for this reciter's per-ayah files
    perAyahUrl: (s, a) => `https://everyayah.com/data/Abdullah_Basfar_192kbps/${String(s).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,
  },
  {
    id: 'ar.yasserdossari', name: 'Yasser Al-Dosari', qurancdnId: 97,
    surahUrl: n => `https://download.quranicaudio.com/quran/yasser_ad-dussary//${String(n).padStart(3,'0')}.mp3`,
    // cdn.islamic.network returns 403 for this reciter's per-ayah files
    perAyahUrl: (s, a) => `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${String(s).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,
  },
  {
    id: 'ar.abdurrahmanalsudais', name: 'Abdurrahman Al-Sudais',
    surahUrl: n => `https://server11.mp3quran.net/sds/${String(n).padStart(3,'0')}.mp3`,
    perAyahUrl: (s, a) => `https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${String(s).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,
  },
];

// Returns the per-ayah audio URL for the active reciter
function getAyahUrl(globalNum, surahNum, ayahNum) {
  const r = RECITERS.find(r => r.id === state.reciter);
  if (r?.perAyahUrl) return r.perAyahUrl(surahNum, ayahNum);
  return `https://cdn.islamic.network/quran/audio/128/${state.reciter}/${globalNum}.mp3`;
}

// Returns the full-surah audio URL, or null to fall back to per-ayah chain
function getSurahAudioUrl(surahNum) {
  const r = RECITERS.find(r => r.id === state.reciter);
  if (r?.surahUrl) return r.surahUrl(surahNum);
  return `https://cdn.islamic.network/quran/audio-surah/128/${state.reciter}/${surahNum}.mp3`;
}

// ── State ────────────────────────────────────────────────────
const state = {
  activeTab: 'home',
  dhikrCounts: JSON.parse(localStorage.getItem('huda_dhikr') || '{}'),
  hadithIndex: 0,
  darkMode: localStorage.getItem('huda_dark') === '1',
  fontSize: parseInt(localStorage.getItem('huda_fontsize') || '24'),
  bookmarks: JSON.parse(localStorage.getItem('huda_bookmarks') || '[]'),
  surahBookmarks: JSON.parse(localStorage.getItem('huda_surah_bm') || '[]'),
  reciter: localStorage.getItem('huda_reciter') || 'ar.alafasy',
  audio: { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false },
  prayer: {
    times: null, location: null, qibla: null, city: '',
    countdownInterval: null, ramadanInterval: null, homeInterval: null,
  },
  quran: {
    currentSurah: null,
    cache: JSON.parse(localStorage.getItem('huda_quran') || '{}'),
    filteredSurahs: [...SURAHS],
    viewMode: 'verse',
    currentPage: 0,
    showTranslation: false,
    timings: {},
  },
  learn: {
    currentSection: null, currentLesson: null,
    currentDuaCategory: null, currentDuaIndex: 0,
    currentNameIndex: null, hajjTab: 'umrah',
    zakat: { currency: 'USD', nisab: 'gold' },
  }
};

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyDarkMode();
  checkDhikrReset();
  // Pre-load cached prayer times so home live cards appear immediately
  const _cp = localStorage.getItem('huda_prayer');
  if (_cp) { try { const p = JSON.parse(_cp); state.prayer.times = p.times; state.prayer.city = p.city || ''; state.prayer.qibla = p.qibla; } catch(e) {} }
  setupNav();
  renderHome();
  fetchAndCacheHijri(new Date());
  registerSW();
  setupInstallPrompt();
  setupReminders();
  setInterval(rotateHadith, 12000);
});

// ── Dark Mode ─────────────────────────────────────────────────
function applyDarkMode() {
  document.documentElement.classList.toggle('dark', state.darkMode);
}
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  localStorage.setItem('huda_dark', state.darkMode ? '1' : '0');
  applyDarkMode();
  renderHome();
}

// ── Haptic ────────────────────────────────────────────────────
function haptic(ms = 30) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

// ── Daily Dhikr Reset ─────────────────────────────────────────
function checkDhikrReset() {
  const today = new Date().toDateString();
  if (localStorage.getItem('huda_dhikr_date') !== today) {
    state.dhikrCounts = {};
    localStorage.setItem('huda_dhikr', '{}');
    localStorage.setItem('huda_dhikr_date', today);
  }
}

// ── Bookmarks ─────────────────────────────────────────────────
function toggleBookmark(surahNum, ayahNum, arText) {
  const idx = state.bookmarks.findIndex(b => b.s === surahNum && b.a === ayahNum);
  if (idx >= 0) state.bookmarks.splice(idx, 1);
  else state.bookmarks.unshift({ s: surahNum, a: ayahNum, ar: arText.slice(0, 80) });
  localStorage.setItem('huda_bookmarks', JSON.stringify(state.bookmarks));
  // refresh bookmark btn
  const btn = document.getElementById(`bm-${surahNum}-${ayahNum}`);
  if (btn) btn.textContent = isBookmarked(surahNum, ayahNum) ? '🔖' : '🏷️';
}
function isBookmarked(s, a) { return state.bookmarks.some(b => b.s === s && b.a === a); }
function removeBookmark(s, a) {
  state.bookmarks = state.bookmarks.filter(b => !(b.s === s && b.a === a));
  localStorage.setItem('huda_bookmarks', JSON.stringify(state.bookmarks));
  renderHome();
}

function isSurahBookmarked(num) { return state.surahBookmarks.includes(num); }
function toggleSurahBookmark(num) {
  if (isSurahBookmarked(num)) {
    state.surahBookmarks = state.surahBookmarks.filter(n => n !== num);
  } else {
    state.surahBookmarks = [num, ...state.surahBookmarks];
  }
  localStorage.setItem('huda_surah_bm', JSON.stringify(state.surahBookmarks));
  // refresh button in list if visible
  const btn = document.getElementById(`sbm-${num}`);
  if (btn) btn.textContent = isSurahBookmarked(num) ? '🔖' : '🏷️';
  if (state.activeTab === 'home') renderHome();
}
function removeSurahBookmark(num) {
  state.surahBookmarks = state.surahBookmarks.filter(n => n !== num);
  localStorage.setItem('huda_surah_bm', JSON.stringify(state.surahBookmarks));
  const btn = document.getElementById(`sbm-${num}`);
  if (btn) btn.textContent = '🏷️';
  renderHome();
}

// ── Audio ─────────────────────────────────────────────────────
function playAyah(globalNum, surahNum, ayahNum) {
  const btnId = `aud-${globalNum}`;
  if (state.audio.player) {
    state.audio.player.pause();
    const prev = document.getElementById(`aud-${state.audio.playingId}`);
    if (prev) { prev.textContent = '▶'; prev.classList.remove('playing'); }
    if (state.audio.playingId === globalNum) {
      state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
      return;
    }
  }
  const audio = new Audio(getAyahUrl(globalNum, surahNum, ayahNum));
  state.audio = { player: audio, playingId: globalNum, playingSurah: surahNum, playingAyah: ayahNum, paused: false };
  const btn = document.getElementById(btnId);
  if (btn) { btn.textContent = '⏸'; btn.classList.add('playing'); }
  audio.play().catch(() => {
    if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
  });
  audio.onended = () => {
    if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
    const nextBtn = document.getElementById(`aud-${globalNum + 1}`);
    if (nextBtn) nextBtn.click();
    else advanceToNextSurah();
  };
  audio.onerror = () => {
    if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
    // Skip broken ayah and advance
    const nextBtn = document.getElementById(`aud-${globalNum + 1}`);
    if (nextBtn) nextBtn.click();
    else advanceToNextSurah();
  };
}

// ── Navigation ────────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add('active');
  // Lazy-render tabs
  const renderers = {
    home: renderHome,
    quran: renderQuranList,
    prayer: renderPrayer,
    dhikr: renderDhikr,
    duas: renderDuasHome,
    learn: renderLearnHub,
  };
  if (renderers[tab]) renderers[tab]();
}

// ── Hijri Date (API-accurate, localStorage cached) ────────────
let _hijriCacheMem = null; // { key: 'YYYY-MM-DD', hijri: {...} }

function _hijriDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getHijriSync(date) {
  const key = _hijriDateKey(date);
  if (_hijriCacheMem && _hijriCacheMem.key === key) return _hijriCacheMem.hijri;
  const stored = localStorage.getItem('huda_hijri_' + key);
  if (stored) { const h = JSON.parse(stored); _hijriCacheMem = { key, hijri: h }; return h; }
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
  const lastRead = JSON.parse(localStorage.getItem('huda_last_read') || 'null');

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

  // Build dhikr reminder live countdown (shown inside reminder card)
  const fmtMs = ms => { const t = Math.max(0, ms); return `${String(Math.floor(t/3600000)).padStart(2,'0')}:${String(Math.floor((t%3600000)/60000)).padStart(2,'0')}:${String(Math.floor((t%60000)/1000)).padStart(2,'0')}`; };
  const notifEnabled = localStorage.getItem('huda_notifs') === '1' && 'Notification' in window && Notification.permission === 'granted';
  if (notifEnabled) {
    if (state.prayer.homeInterval) clearInterval(state.prayer.homeInterval);
    state.prayer.homeInterval = setInterval(() => {
      const elN = document.getElementById('home-notif-cd');
      if (!elN) { clearInterval(state.prayer.homeInterval); state.prayer.homeInterval = null; return; }
      const lastR = parseInt(localStorage.getItem('huda_last_reminder') || '0');
      const hoursR = parseInt(localStorage.getItem('huda_notifs_interval') || '2');
      elN.textContent = fmtMs((lastR + hoursR * 3600000) - Date.now());
    }, 1000);
  }

  document.getElementById('tab-home').innerHTML = `
    <div class="hero fade-in">
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

    ${lastRead ? `
    <div class="continue-card" onclick="switchTab('quran');setTimeout(()=>openSurah(${lastRead.surah}),100)">
      <div class="continue-icon">📖</div>
      <div class="continue-info">
        <div class="continue-label">Continue Reading</div>
        <div class="continue-name">${lastRead.arabic} — ${lastRead.name}</div>
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
            <div class="bookmark-preview">${b.ar}</div>
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

    ${renderReminderCard()}

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

// ── QURAN TAB ─────────────────────────────────────────────────
function renderQuranList() {
  if (document.getElementById('quran-list-view')) return;
  const tab = document.getElementById('tab-quran');
  tab.innerHTML = `
    <div id="quran-list-view">
      <div style="background:var(--emerald);padding:16px 20px;padding-top:calc(16px + env(safe-area-inset-top,0px));color:white">
        <h1 style="font-size:22px;font-weight:800;margin-bottom:2px">القُرْآن الكَرِيم</h1>
        <p style="font-size:13px;opacity:0.8">The Noble Quran · 114 Surahs</p>
      </div>
      <div class="search-bar">
        <input class="search-input" id="surah-search" placeholder="🔍 Search by name or number..." oninput="filterSurahs(this.value)">
      </div>
      <div id="surah-list"></div>
    </div>
    <div id="quran-reader" style="display:none">
      <div class="page-header">
        <button class="back-btn" onclick="closeQuranReader()">←</button>
        <div style="flex:1">
          <h2 id="reader-title">Surah</h2>
          <div style="font-size:11px;opacity:0.8" id="reader-meta"></div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
          <button class="mhdr-btn" id="surah-prev-btn" onclick="navigateSurah(-1)" title="Previous surah">‹</button>
          <button class="mhdr-btn" id="surah-next-btn" onclick="navigateSurah(1)" title="Next surah">›</button>
        </div>
        <div id="mushaf-header-controls" style="display:none;align-items:center;gap:6px;flex-shrink:0">
          <span id="mpb-info" style="font-size:11px;opacity:0.9;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>
          <button id="mpb-pause-btn" class="mhdr-btn" onclick="toggleMushafPlayback()">⏸</button>
          <button class="mhdr-btn" title="Next surah" onclick="advanceToNextSurah()">⏭</button>
          <button class="mhdr-btn" onclick="mushafStop()">■</button>
        </div>
      </div>
      <div class="reader-toolbar">
        <button class="view-toggle-btn active" id="btn-verse" onclick="setQuranView('verse')">Study</button>
        <button class="view-toggle-btn" id="btn-page" onclick="setQuranView('page')">📖 Mushaf</button>
        <div class="font-size-ctrl" id="font-ctrl" style="display:none">
          <button class="font-btn" onclick="changeFontSize(-2)">A−</button>
          <button class="font-btn" onclick="changeFontSize(2)">A+</button>
        </div>
        <select class="reciter-select" id="reciter-select" onchange="setReciter(this.value)">
          ${RECITERS.map(r => `<option value="${r.id}" ${state.reciter === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
        </select>
      </div>
      <div id="reader-content"></div>
      <div id="mushaf-page" style="display:none"></div>
    </div>
  `;
  renderSurahList(SURAHS);
}

function renderSurahList(list) {
  document.getElementById('surah-list').innerHTML = list.map(s => `
    <div class="surah-item" onclick="openSurah(${s[0]})">
      <div class="surah-num">${s[0]}</div>
      <div class="surah-info">
        <div class="surah-english">${s[2]} <span style="color:var(--gray-400);font-weight:400">— ${s[3]}</span></div>
        <div class="surah-meta">${s[5]} · ${s[4]} verses</div>
      </div>
      <div class="surah-arabic-name">${s[1]}</div>
      <button class="surah-bm-btn" id="sbm-${s[0]}" onclick="event.stopPropagation();toggleSurahBookmark(${s[0]})" title="Bookmark surah">${isSurahBookmarked(s[0]) ? '🔖' : '🏷️'}</button>
    </div>
  `).join('');
}

function filterSurahs(query) {
  const q = query.toLowerCase().trim();
  const filtered = !q ? SURAHS : SURAHS.filter(s =>
    s[2].toLowerCase().includes(q) ||
    s[1].includes(q) ||
    s[3].toLowerCase().includes(q) ||
    String(s[0]).includes(q)
  );
  renderSurahList(filtered);
}

async function openSurah(n) {
  mushafStop();
  document.getElementById('quran-list-view').style.display = 'none';
  const reader = document.getElementById('quran-reader');
  reader.style.display = 'block';
  state.quran.currentSurah = n;
  state.quran.currentPage = 0;
  const s = SURAHS[n - 1];
  localStorage.setItem('huda_last_read', JSON.stringify({ surah: n, name: s[2], arabic: s[1] }));
  document.getElementById('reader-title').textContent = `${s[2]} — ${s[1]}`;
  document.getElementById('reader-meta').textContent = `${s[5]} · ${s[4]} verses · ${s[3]}`;
  // Sync toggle button states
  document.getElementById('btn-verse')?.classList.toggle('active', state.quran.viewMode === 'verse');
  document.getElementById('btn-page')?.classList.toggle('active', state.quran.viewMode === 'page');
  const content = document.getElementById('reader-content');
  content.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading Surah...</p></div>`;

  try {
    let arData, enData;
    if (state.quran.cache[n]) {
      ({ arData, enData } = state.quran.cache[n]);
    } else {
      const [arRes, enRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/surah/${n}/en.sahih`)
      ]);
      const [arJson, enJson] = await Promise.all([arRes.json(), enRes.json()]);
      arData = arJson.data;
      enData = enJson.data;
      state.quran.cache[n] = { arData, enData };
      try { localStorage.setItem('huda_quran', JSON.stringify(state.quran.cache)); } catch(e) {}
    }
    if (state.quran.viewMode === 'page') {
      document.getElementById('reader-content').style.display = 'none';
      document.getElementById('mushaf-page').style.display = 'block';
      renderMushafPage(n, arData, enData);
      document.getElementById('mushaf-page').scrollTop = 0;
    } else {
      document.getElementById('mushaf-page').style.display = 'none';
      document.getElementById('reader-content').style.display = 'block';
      renderSurahContent(n, arData, enData);
    }
    document.getElementById('quran-reader').scrollTop = 0;
    updateSurahNavBtns();
  } catch(e) {
    content.innerHTML = `
      <div class="error-state">
        <div style="font-size:48px">📡</div>
        <p style="margin:12px 0;color:var(--gray-500)">Could not load surah.<br>Check your connection.</p>
        <button class="retry-btn" onclick="openSurah(${n})">↻ Retry</button>
      </div>`;
  }
}

function setQuranView(mode) {
  state.quran.viewMode = mode;
  state.quran.currentPage = 0;
  mushafStop();
  document.getElementById('btn-verse')?.classList.toggle('active', mode === 'verse');
  document.getElementById('btn-page')?.classList.toggle('active', mode === 'page');
  const fontCtrl = document.getElementById('font-ctrl');
  if (fontCtrl) fontCtrl.style.display = mode === 'page' ? 'flex' : 'none';
  const n = state.quran.currentSurah;
  if (!n || !state.quran.cache[n]) return;
  const { arData, enData } = state.quran.cache[n];
  if (mode === 'page') {
    document.getElementById('reader-content').style.display = 'none';
    document.getElementById('mushaf-page').style.display = 'block';
    renderMushafPage(n, arData, enData);
    document.getElementById('mushaf-page').scrollTop = 0;
  } else {
    document.getElementById('mushaf-page').style.display = 'none';
    document.getElementById('reader-content').style.display = 'block';
    renderSurahContent(n, arData, enData);
    document.getElementById('reader-content').scrollTop = 0;
  }
  document.getElementById('quran-reader').scrollTop = 0;
}

// Build pages by splitting ayahs into chunks that fit a screen
function buildMushafPages(arData, enData, hasBismillah) {
  const ayahs = arData.ayahs;
  const enAyahs = enData.ayahs;
  // Group by the real Mushaf page number returned by the API
  const pageMap = new Map();
  ayahs.forEach((a, i) => {
    const pg = a.page || 1;
    if (!pageMap.has(pg)) pageMap.set(pg, { ar: [], en: [], first: i === 0, page: pg });
    pageMap.get(pg).ar.push(a);
    pageMap.get(pg).en.push(enAyahs[i]);
  });
  return Array.from(pageMap.values());
}

function renderMushafPage(n, arData, enData) {
  const hasBismillah = n !== 9 && n !== 1;
  const pages = buildMushafPages(arData, enData, hasBismillah);
  const s = SURAHS[n - 1];
  const el = document.getElementById('mushaf-page');
  const pagesHtml = pages.map((page, pg) => {
    const arabicText = page.ar.map(a => {
      const rawText = (hasBismillah && a.numberInSurah === 1) ? stripBismillah(a.text) : a.text;
      return `<span class="mushaf-ayah-wrap" data-global="${a.number}" data-surah="${n}" data-ayah="${a.numberInSurah}">${rawText} <span class="mushaf-anum" id="maud-${a.number}" title="Hold to play from ayah ${a.numberInSurah}">&#xFD3F;${toArabicNumerals(a.numberInSurah)}&#xFD3E;</span></span>`;
    }).join(' ');

    return `
      <div class="mushaf-page-block">
        ${page.first && hasBismillah ? `<div class="mushaf-bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ''}
        <div class="mushaf-arabic-page" style="font-size:${state.fontSize}px">${arabicText}</div>
        <div class="mushaf-page-divider">— Page ${page.page} —</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="mushaf-sticky-header">
      <span class="mushaf-meta">${s[2]}</span>
      <span class="mushaf-meta-center">${s[1]}</span>
      <div class="mushaf-audio-controls">
        <button class="mushaf-audio-btn" id="mushaf-play-btn" onclick="mushafPlayToggle(${n})" title="Play / Pause">▶</button>
      </div>
    </div>
    <div class="mushaf-hint">Hold an ayah number to play from there</div>
    <div class="mushaf-scroll-body">${pagesHtml}</div>
  `;
  setupAyahLongPress(el);
  updateMushafPlayerBar();
}

// ── Surah-level audio (gapless) ───────────────────────────────
const _surahTimingsCache = {};
let _surahAudio   = null; // the full-surah Audio element when active
let _surahBadge   = null; // currently highlighted ayah badge
let _surahTiming  = null; // { [verse_key]: { from, to } }

// Fetch ayah-level timestamps for badge tracking (reciters with qurancdnId only)
async function fetchSurahTimings(surahNum) {
  const r = RECITERS.find(r => r.id === state.reciter);
  const rid = r?.qurancdnId;
  if (!rid) return null;
  const ck = `${rid}_${surahNum}`;
  if (_surahTimingsCache[ck]) return _surahTimingsCache[ck];
  try {
    const res = await fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${rid}/audio_files?chapter_number=${surahNum}&segments=true`);
    const data = await res.json();
    const f = (data.audio_files || [])[0];
    if (!f) return null;
    const t = {};
    for (const vt of (f.verse_timings || [])) {
      t[vt.verse_key] = { from: vt.timestamp_from, to: vt.timestamp_to };
    }
    _surahTimingsCache[ck] = t;
    return t;
  } catch(_) { return null; }
}

// timeupdate handler: highlights the correct ayah badge
function _surahTimeUpdate() {
  if (!_surahAudio || !_surahTiming) return;
  const ms   = _surahAudio.currentTime * 1000;
  const sn   = state.audio.playingSurah;
  const cache = state.quran.cache[sn];
  if (!cache) return;
  for (const [key, t] of Object.entries(_surahTiming)) {
    if (ms >= t.from && ms < t.to) {
      const an = +key.split(':')[1];
      if (state.audio.playingAyah === an) return;
      if (_surahBadge) _surahBadge.classList.remove('maud-playing');
      const ayahObj = cache.arData.ayahs.find(a => a.numberInSurah === an);
      if (ayahObj) {
        _surahBadge = document.getElementById(`maud-${ayahObj.number}`);
        if (_surahBadge) _surahBadge.classList.add('maud-playing');
      }
      state.audio.playingAyah = an;
      updateMushafPlayerBar();
      return;
    }
  }
}

// ── Mushaf word-timing helpers (kept for potential future use) ─
async function fetchMushafTimings(surahNum) {
  if (state.quran.timings[surahNum]) return state.quran.timings[surahNum];
  try {
    const res = await fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/7/audio_files?chapter_number=${surahNum}&segments=true`);
    const data = await res.json();
    const map = {};
    for (const f of (data.audio_files || [])) {
      for (const vt of (f.verse_timings || [])) {
        const base = vt.timestamp_from;
        map[vt.verse_key] = (vt.segments || []).map(([wi, s, e]) =>
          [wi - 1, Math.max(0, s - base), Math.max(0, e - base)]
        );
      }
    }
    state.quran.timings[surahNum] = map;
    return map;
  } catch(e) { return null; }
}

function clearMushafHighlights() {
  document.querySelectorAll('.mword.active').forEach(el => el.classList.remove('active'));
}

function startWordHighlight(audio, surahNum, ayahNum, globalNum, timings) {
  const segments = timings[`${surahNum}:${ayahNum}`];
  if (!segments || !segments.length) return;
  let lastWord = -1;
  function frame() {
    if (!state.audio.player || state.audio.player !== audio) return;
    const ms = audio.currentTime * 1000;
    let cur = -1;
    for (const [wi, start, end] of segments) {
      if (ms >= start && ms < end) { cur = wi; break; }
    }
    if (cur !== lastWord) {
      if (lastWord >= 0) {
        const el = document.getElementById(`mw-${globalNum}-${lastWord}`);
        if (el) el.classList.remove('active');
      }
      if (cur >= 0) {
        const el = document.getElementById(`mw-${globalNum}-${cur}`);
        if (el) el.classList.add('active');
      }
      lastWord = cur;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ── Ayatul Kursi audio (Surah 2:255 = global ayah 262) ────────
function playAyatulKursi() {
  const GLOBAL = 262;
  const btn = document.getElementById('ak-play');
  const resetAK = () => {
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
    updateMushafPlayerBar();
    if (btn) btn.innerHTML = '▶ Play';
  };
  if (state.audio.player && state.audio.playingId === GLOBAL) {
    state.audio.player.pause();
    resetAK();
    return;
  }
  mushafStop();
  const audio = new Audio(getAyahUrl(GLOBAL, 2, 255));
  state.audio = { player: audio, playingId: GLOBAL, playingSurah: null, playingAyah: null, paused: false };
  if (btn) btn.innerHTML = '⏸ Stop';
  audio.play().catch(resetAK);
  audio.onended = resetAK;
  audio.onerror = resetAK;
}

// Attach an onended handler that plays the next ayah with zero overhead.
// play() is called as the very first instruction — before any DOM work —
// so the audio pipeline has the shortest possible cold-start gap.
function _mushafSetupOnEnded(audio, globalNum, surahNum, ayahNum) {
  audio.onended = () => {
    const nextEl = document.getElementById(`maud-${globalNum + 1}`);
    if (!nextEl) { advanceToNextSurah(); return; }

    // ── Switch pool slot ──────────────────────────────────────
    _poolIdx = 1 - _poolIdx;
    const nextAudio = _pool[_poolIdx];
    if (_poolFor[_poolIdx] !== globalNum + 1) {
      // Read surah/ayah from DOM so perAyahUrl reciters get correct URL
      const wrap2 = nextEl.closest('.mushaf-ayah-wrap');
      const ns2 = wrap2 ? +wrap2.dataset.surah : surahNum;
      const na2 = wrap2 ? +wrap2.dataset.ayah : ayahNum + 1;
      nextAudio.src = getAyahUrl(globalNum + 1, ns2, na2);
      _poolFor[_poolIdx] = globalNum + 1;
    }

    // ── PLAY FIRST — before any DOM/state work ────────────────
    nextAudio.play().catch(() => {
      // On error skip this ayah and try the next one
      const skipEl = document.getElementById(`maud-${globalNum + 2}`);
      if (skipEl) {
        const wrap3 = skipEl.closest('.mushaf-ayah-wrap');
        playMushafAyah(globalNum + 2, wrap3 ? +wrap3.dataset.surah : surahNum, wrap3 ? +wrap3.dataset.ayah : ayahNum + 2);
      } else { advanceToNextSurah(); }
    });

    // ── State + badge update ──────────────────────────────────
    const wrap = nextEl.closest('.mushaf-ayah-wrap');
    const ns = wrap ? +wrap.dataset.surah : surahNum;
    const na = wrap ? +wrap.dataset.ayah : ayahNum + 1;
    const prevBadge = document.getElementById(`maud-${globalNum}`);
    if (prevBadge) prevBadge.classList.remove('maud-playing');
    state.audio = { player: nextAudio, playingId: globalNum + 1, playingSurah: ns, playingAyah: na, paused: false };
    const nextBadge = document.getElementById(`maud-${globalNum + 1}`);
    if (nextBadge) nextBadge.classList.add('maud-playing');
    updateMushafPlayerBar();

    // ── Preload two ahead ─────────────────────────────────────
    const afterEl = document.getElementById(`maud-${globalNum + 2}`);
    if (afterEl) _poolPreload(globalNum + 2);

    // ── Chain next onended ────────────────────────────────────
    _mushafSetupOnEnded(nextAudio, globalNum + 1, ns, na);
  };
}

function playMushafAyah(globalNum, surahNum, ayahNum) {
  // If surah audio is active for this surah, seek to the tapped ayah
  if (_surahAudio && state.audio.playingSurah === surahNum && _surahTiming) {
    const t = _surahTiming[`${surahNum}:${ayahNum}`];
    if (t) {
      _surahAudio.currentTime = t.from / 1000;
      if (state.audio.paused) {
        _surahAudio.play().then(() => {
          state.audio.paused = false;
          updateMushafPlayBtn(true);
          updateMushafPlayerBar();
        }).catch(() => {});
      }
      return;
    }
  }

  // Toggle off if same ayah tapped
  if (state.audio.playingId === globalNum && state.audio.player) {
    mushafStop(); return;
  }
  // Stop previous
  if (state.audio.player) {
    state.audio.player.pause();
    const prev = document.getElementById(`maud-${state.audio.playingId}`);
    if (prev) prev.classList.remove('maud-playing');
  }

  // Use preloaded slot if ready, otherwise load now
  if (_poolFor[1 - _poolIdx] === globalNum) _poolIdx = 1 - _poolIdx;
  const audio = _pool[_poolIdx];
  if (_poolFor[_poolIdx] !== globalNum) {
    audio.src = getAyahUrl(globalNum, surahNum, ayahNum);
    audio.load();
    _poolFor[_poolIdx] = globalNum;
  }

  // Play first, state/DOM after
  audio.play().catch(() => { mushafStop(); });

  state.audio = { player: audio, playingId: globalNum, playingSurah: surahNum, playingAyah: ayahNum, paused: false };
  const badge = document.getElementById(`maud-${globalNum}`);
  if (badge) badge.classList.add('maud-playing');
  updateMushafPlayBtn(true);
  updateMushafPlayerBar();

  // Preload next
  const nextEl = document.getElementById(`maud-${globalNum + 1}`);
  if (nextEl) _poolPreload(globalNum + 1);

  // Set up fast-path onended chain
  _mushafSetupOnEnded(audio, globalNum, surahNum, ayahNum);
}

function mushafPlayAll(surahNum) {
  mushafStop();
  const url = getSurahAudioUrl(surahNum);
  // No gapless audio for this reciter — fall back to per-ayah chain
  if (!url) {
    const cache = state.quran.cache[surahNum];
    if (cache) playMushafAyah(cache.arData.ayahs[0].number, surahNum, 1);
    return;
  }
  _surahAudio = new Audio(url);
  _surahAudio.onerror = () => {
    // Fall back to per-ayah from the ayah we were on (not always restart from 1)
    const resumeAyah = state.audio.playingAyah || 1;
    _surahAudio = null; _surahTiming = null;
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
    const cache = state.quran.cache[surahNum];
    if (!cache) return;
    const ayahObj = cache.arData.ayahs.find(a => a.numberInSurah === resumeAyah) || cache.arData.ayahs[0];
    playMushafAyah(ayahObj.number, surahNum, ayahObj.numberInSurah);
  };

  // Highlight first ayah badge if cache is ready
  const cache = state.quran.cache[surahNum];
  if (cache && cache.arData) {
    const first = cache.arData.ayahs[0];
    _surahBadge = document.getElementById(`maud-${first.number}`);
    if (_surahBadge) _surahBadge.classList.add('maud-playing');
    state.audio = { player: _surahAudio, playingId: first.number, playingSurah: surahNum, playingAyah: 1, paused: false };
  } else {
    state.audio = { player: _surahAudio, playingId: -1, playingSurah: surahNum, playingAyah: 1, paused: false };
  }

  _surahAudio.play().catch(() => mushafStop());
  _surahAudio.onended = () => advanceToNextSurah();
  updateMushafPlayBtn(true);
  updateMushafPlayerBar();

  // Fetch per-ayah timestamps in background for badge tracking
  fetchSurahTimings(surahNum).then(t => {
    if (!t || _surahAudio !== state.audio.player) return;
    _surahTiming = t;
    _surahAudio.addEventListener('timeupdate', _surahTimeUpdate);
  });
}

function setReciter(id) {
  mushafStop();
  _poolFor[0] = _poolFor[1] = null; // invalidate preload cache
  state.reciter = id;
  localStorage.setItem('huda_reciter', id);
}

async function navigateSurah(dir) {
  const next = (state.quran.currentSurah || 1) + dir;
  if (next < 1 || next > 114) return;
  mushafStop();
  await openSurah(next);
  updateSurahNavBtns();
}

function updateSurahNavBtns() {
  const n = state.quran.currentSurah || 1;
  const prev = document.getElementById('surah-prev-btn');
  const next = document.getElementById('surah-next-btn');
  if (prev) prev.disabled = n <= 1;
  if (next) next.disabled = n >= 114;
}

async function advanceToNextSurah() {
  const next = (state.quran.currentSurah || 0) + 1;
  if (next > 114) { mushafStop(); return; }
  await openSurah(next);
  if (state.quran.viewMode === 'page') {
    mushafPlayAll(next);
  } else {
    const cache = state.quran.cache[next];
    if (cache) {
      const firstBtn = document.getElementById(`aud-${cache.arData.ayahs[0].number}`);
      if (firstBtn) firstBtn.click();
    }
  }
}

function mushafStop() {
  // Clean up surah-level audio
  if (_surahAudio) {
    _surahAudio.removeEventListener('timeupdate', _surahTimeUpdate);
    _surahAudio.pause();
  }
  if (_surahBadge) { _surahBadge.classList.remove('maud-playing'); }
  // Also stop per-ayah pool player if it's different from surahAudio
  if (state.audio.player && state.audio.player !== _surahAudio) {
    state.audio.player.pause();
    const prev = document.getElementById(`maud-${state.audio.playingId}`);
    if (prev) prev.classList.remove('maud-playing');
  }
  _surahAudio = null;
  _surahBadge = null;
  _surahTiming = null;
  state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
  updateMushafPlayBtn(false);
  updateMushafPlayerBar();
}

function updateMushafPlayBtn(playing) {
  const btn = document.getElementById('mushaf-play-btn');
  if (!btn) return;
  btn.textContent = !playing ? '▶' : state.audio.paused ? '▶' : '⏸';
}

// Called by the ▶/⏸ button inside the mushaf sticky header
function mushafPlayToggle(surahNum) {
  if (_surahAudio || state.audio.player) toggleMushafPlayback();
  else mushafPlayAll(surahNum);
}

function toggleMushafPlayback() {
  const player = _surahAudio || state.audio.player;
  if (!player) return;
  if (state.audio.paused) {
    player.play().then(() => {
      state.audio.paused = false;
      updateMushafPlayBtn(true);
      updateMushafPlayerBar();
    }).catch(() => {});
  } else {
    player.pause();
    state.audio.paused = true;
    updateMushafPlayBtn(true);
    updateMushafPlayerBar();
  }
}

function updateMushafPlayerBar() {
  const controls = document.getElementById('mushaf-header-controls');
  if (!controls) return;
  const playing = !!(state.audio.player && state.audio.playingSurah);
  controls.style.display = playing ? 'flex' : 'none';
  if (playing) {
    const s = SURAHS[state.audio.playingSurah - 1];
    const surahName = s ? s[1] : '';
    const surahEn = s ? s[2] : '';
    const ayah = state.audio.playingAyah;

    const info = document.getElementById('mpb-info');
    if (info) info.textContent = `${surahName} · ${ayah}`;

    const btn = document.getElementById('mpb-pause-btn');
    if (btn) btn.textContent = state.audio.paused ? '▶' : '⏸';

    // ── Media Session (lock screen / car display) ──────────────
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${surahName} — Ayah ${ayah}`,
        artist: surahEn,
        album: 'Quran — Huda',
        artwork: [{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
      });
      navigator.mediaSession.setActionHandler('play',          () => { toggleMushafPlayback(); });
      navigator.mediaSession.setActionHandler('pause',         () => { toggleMushafPlayback(); });
      navigator.mediaSession.setActionHandler('nexttrack',     () => { advanceToNextSurah(); });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const prev = (state.quran.currentSurah || 1) - 1;
        if (prev >= 1) { openSurah(prev).then(() => mushafPlayAll(prev)); }
      });
    }
  } else {
    // Clear media session when stopped
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      ['play','pause','nexttrack','previoustrack'].forEach(a => {
        try { navigator.mediaSession.setActionHandler(a, null); } catch(_) {}
      });
    }
  }
  // Keep standalone mushaf-play-btn in sync
  updateMushafPlayBtn(!!(state.audio.player || _surahAudio));
}


function toArabicNumerals(n) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// The alquran.cloud API prepends Bismillah text to the first ayah of every
// surah except 1 (Al-Fatiha) and 9 (At-Tawbah). Strip it so we don't
// show it twice alongside our manual Bismillah header.
function stripBismillah(text) {
  // Strip diacritics + special Alef Wasla for reliable consonant matching
  const bare = text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u0671\u06D6-\u06ED]/g, '');
  if (!bare.startsWith('بسم')) return text;
  // Bismillah is always exactly 4 words — drop them
  const words = text.trimStart().split(/\s+/);
  return words.slice(4).join(' ');
}

function renderSurahContent(n, arData, enData) {
  const content = document.getElementById('reader-content');
  const bismillah = n !== 9 && n !== 1
    ? `<div class="bismillah">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيم</div>`
    : '';
  const hasBism = n !== 9 && n !== 1;
  const ayahs = arData.ayahs.map((a, i) => {
    const displayText = (hasBism && a.numberInSurah === 1) ? stripBismillah(a.text) : a.text;
    return `
    <div class="ayah" data-global="${a.number}" data-surah="${n}" data-ayah="${a.numberInSurah}">
      <div class="ayah-arabic"><span class="ayah-num-badge">${a.numberInSurah}</span> ${displayText}</div>
      <div class="ayah-english">${enData.ayahs[i].text}</div>
      <div class="ayah-actions">
        <button class="ayah-btn" id="aud-${a.number}" onclick="playAyah(${a.number},${n},${a.numberInSurah})" title="Play">▶</button>
        <button class="ayah-btn ${isBookmarked(n, a.numberInSurah) ? 'bookmarked' : ''}" id="bm-${n}-${a.numberInSurah}"
          onclick="toggleBookmark(${n},${a.numberInSurah},'${a.text.replace(/'/g,"\\'").slice(0,60)}')" title="Bookmark">
          ${isBookmarked(n, a.numberInSurah) ? '🔖' : '🏷️'}
        </button>
      </div>
    </div>`;
  }).join('');
  content.innerHTML = bismillah + ayahs;
}

// ── Long-press mushaf ayah to play from that point ───────────
let _lpTimer = null;
let _lpStartX = 0, _lpStartY = 0;
let _pendingPlay = null;

// ── Preloaded audio pool for minimal-gap playback ────────────
// Two Audio elements alternate: while one plays, the other preloads the next.
const _pool = [new Audio(), new Audio()];
let _poolIdx = 0;
let _poolFor  = [null, null]; // which globalNum each slot is loaded for

function _poolPreload(globalNum) {
  const slot = 1 - _poolIdx;
  if (_poolFor[slot] === globalNum) return; // already loaded
  // Read surah/ayah from DOM so perAyahUrl reciters get the correct URL
  const domEl = document.getElementById(`maud-${globalNum}`);
  if (!domEl) return;
  const wrap = domEl.closest('.mushaf-ayah-wrap');
  const s = wrap ? +wrap.dataset.surah : state.audio.playingSurah;
  const a = wrap ? +wrap.dataset.ayah : 0;
  _pool[slot].src = getAyahUrl(globalNum, s, a);
  _pool[slot].preload = 'auto';
  _pool[slot].load();
  _poolFor[slot] = globalNum;
}
function setupAyahLongPress(container) {
  // Touch: hold the ayah number badge to show the play popup
  container.addEventListener('touchstart', e => {
    const anum = e.target.closest('.mushaf-anum');
    if (!anum) return;
    _lpStartX = e.touches[0].clientX;
    _lpStartY = e.touches[0].clientY;
    _lpTimer = setTimeout(() => {
      _lpTimer = null;
      haptic(60);
      const wrap = anum.closest('.mushaf-ayah-wrap');
      flashAyah(wrap);
      const g = +anum.id.replace('maud-', '');
      showAyahPopup(g, +wrap.dataset.surah, +wrap.dataset.ayah, anum);
    }, 500);
  }, { passive: true });
  container.addEventListener('touchend', () => clearTimeout(_lpTimer));
  container.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - _lpStartX;
    const dy = e.touches[0].clientY - _lpStartY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(_lpTimer);
  }, { passive: true });
  // Desktop: right-click on badge
  container.addEventListener('contextmenu', e => {
    const anum = e.target.closest('.mushaf-anum');
    if (!anum) return;
    e.preventDefault();
    const wrap = anum.closest('.mushaf-ayah-wrap');
    const g = +anum.id.replace('maud-', '');
    flashAyah(wrap);
    showAyahPopup(g, +wrap.dataset.surah, +wrap.dataset.ayah, anum);
  });
}

function showAyahPopup(globalNum, surahNum, ayahNum, anchorEl) {
  _pendingPlay = { globalNum, surahNum, ayahNum };
  let popup = document.getElementById('ayah-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'ayah-popup';
    document.body.appendChild(popup);
  }
  popup.innerHTML = `
    <div class="ayah-popup-label">Ayah ${ayahNum}</div>
    <button class="ayah-popup-play" onclick="confirmPlayMushafAyah()">▶&nbsp; Play from here</button>
  `;
  popup.style.display = 'block';
  const rect = anchorEl.getBoundingClientRect();
  const pw = 170, ph = 80;
  let top = rect.top - ph - 10;
  let left = rect.left + rect.width / 2 - pw / 2;
  if (top < 8) top = rect.bottom + 10;
  left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
  popup.style.top = top + 'px';
  popup.style.left = left + 'px';
  setTimeout(() => {
    document.addEventListener('touchstart', _dismissPopupOutside, { passive: true, once: true });
    document.addEventListener('mousedown', _dismissPopupOutside, { once: true });
  }, 0);
}

function _dismissPopupOutside(e) {
  const popup = document.getElementById('ayah-popup');
  if (popup && !popup.contains(e.target)) hideAyahPopup();
}

function hideAyahPopup() {
  const popup = document.getElementById('ayah-popup');
  if (popup) popup.style.display = 'none';
  _pendingPlay = null;
  document.removeEventListener('touchstart', _dismissPopupOutside);
  document.removeEventListener('mousedown', _dismissPopupOutside);
}

function confirmPlayMushafAyah() {
  if (!_pendingPlay) return;
  const { globalNum, surahNum, ayahNum } = _pendingPlay;
  hideAyahPopup();
  playMushafAyah(globalNum, surahNum, ayahNum);
}

function flashAyah(el) {
  el.classList.add('ayah-flash');
  setTimeout(() => el.classList.remove('ayah-flash'), 600);
}

function closeQuranReader() {
  mushafStop();
  document.getElementById('quran-reader').style.display = 'none';
  document.getElementById('quran-list-view').style.display = 'block';
  state.quran.currentSurah = null;
}

// ── PRAYER TIMES TAB ──────────────────────────────────────────
const PRAYER_NAMES = [
  { key:'fajr',    en:'Fajr',    ar:'الفَجْر',   icon:'🌙' },
  { key:'sunrise', en:'Sunrise', ar:'الشُّرُوق',  icon:'🌅' },
  { key:'dhuhr',   en:'Dhuhr',   ar:'الظُّهْر',  icon:'☀️' },
  { key:'asr',     en:'Asr',     ar:'العَصْر',   icon:'🌤️' },
  { key:'maghrib', en:'Maghrib', ar:'المَغْرِب', icon:'🌇' },
  { key:'isha',    en:'Isha',    ar:'العِشَاء',  icon:'🌌' },
];

function renderPrayer() {
  const tab = document.getElementById('tab-prayer');
  if (!state.prayer.times) {
    tab.innerHTML = `
      <div class="prayer-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
        <div style="font-size:40px;margin-bottom:12px">🕌</div>
        <h2 style="font-size:20px;font-weight:700;margin-bottom:6px">Prayer Times</h2>
        <p style="font-size:13px;opacity:0.8;margin-bottom:16px">Enable location for accurate prayer times</p>
        <button onclick="requestLocation()" style="background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.5);color:white;padding:12px 24px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">
          📍 Enable Location
        </button>
      </div>
    `;
    const cached = localStorage.getItem('huda_prayer');
    if (cached) {
      const p = JSON.parse(cached);
      state.prayer.times = p.times;
      state.prayer.city = p.city;
      state.prayer.qibla = p.qibla;
      renderPrayerTimes();
    }
    return;
  }
  renderPrayerTimes();
}

async function requestLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }
  document.getElementById('tab-prayer').innerHTML = `
    <div class="prayer-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
      <div class="spinner" style="margin:0 auto 12px;border-color:rgba(255,255,255,0.3);border-top-color:white"></div>
      <p style="color:white;opacity:0.9">Getting your location...</p>
    </div>`;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      state.prayer.location = { lat, lng };
      state.prayer.qibla = calcQibla(lat, lng);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        state.prayer.city = data.address?.city || data.address?.town || data.address?.state || 'Your Location';
      } catch(e) { state.prayer.city = 'Your Location'; }
      calcPrayerTimes(lat, lng);
    },
    (err) => {
      document.getElementById('tab-prayer').innerHTML = `
        <div class="prayer-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
          <div style="font-size:40px;margin-bottom:12px">⚠️</div>
          <p style="color:white;margin-bottom:16px">Location access denied.<br>Please allow location access.</p>
          <button onclick="requestLocation()" style="background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.5);color:white;padding:12px 24px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">Try Again</button>
        </div>`;
    }
  );
}

function calcPrayerTimes(lat, lng) {
  if (typeof adhan === 'undefined') { renderPrayerFallback(); return; }
  const coords = new adhan.Coordinates(lat, lng);
  const params = adhan.CalculationMethod.MuslimWorldLeague();
  params.madhab = adhan.Madhab.Shafi;
  const date = new Date();
  const pt = new adhan.PrayerTimes(coords, date, params);
  state.prayer.times = {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
  localStorage.setItem('huda_prayer', JSON.stringify({
    times: state.prayer.times,
    city: state.prayer.city,
    qibla: state.prayer.qibla
  }));
  renderPrayerTimes();
  // Update home live cards now that times are fresh
  if (state.activeTab === 'home') renderHome();
}

function renderPrayerFallback() {
  document.getElementById('tab-prayer').innerHTML = `
    <div class="prayer-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
      <div style="font-size:40px;margin-bottom:12px">⚠️</div>
      <p style="color:white">Prayer time library not loaded.<br>Check your connection and refresh.</p>
    </div>`;
}

function renderPrayerTimes() {
  if (!state.prayer.times) return;
  const now = new Date();
  const times = state.prayer.times;
  const fmt = t => new Date(t).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: true });

  // If all times are in the past, cached times are stale — recalculate
  const allPast = PRAYER_NAMES.every(p => new Date(times[p.key]) < now);
  if (allPast && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      calcPrayerTimes(pos.coords.latitude, pos.coords.longitude);
    }, () => {});
    return;
  }

  let nextPrayer = null, nextTime = null;
  for (const p of PRAYER_NAMES) {
    if (p.key === 'sunrise') continue;
    const t = new Date(times[p.key]);
    if (t > now) { nextPrayer = p; nextTime = t; break; }
  }
  if (!nextPrayer) { nextPrayer = PRAYER_NAMES[0]; nextTime = new Date(times.fajr); }

  const tab = document.getElementById('tab-prayer');
  tab.innerHTML = `
    <div class="prayer-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
      <div class="next-prayer-label">Next Prayer</div>
      <div class="next-prayer-name">${nextPrayer.en}</div>
      <div class="next-prayer-arabic">${nextPrayer.ar}</div>
      <div class="next-prayer-time">${fmt(nextTime)}</div>
      <div class="countdown-label">Time Remaining</div>
      <div class="countdown" id="prayer-countdown">00:00:00</div>
      <div class="location-label">📍 ${state.prayer.city}</div>
    </div>
    <div class="prayer-list">
      ${PRAYER_NAMES.map(p => {
        const t = new Date(times[p.key]);
        const isPast = t < now;
        const isNext = p.key === nextPrayer.key;
        return `
          <div class="prayer-item ${isNext ? 'next-prayer' : ''} ${isPast && !isNext ? 'past-prayer' : ''}">
            <div class="prayer-icon">${p.icon}</div>
            <div>
              <div class="prayer-name">${p.en}</div>
              <div class="prayer-arabic-name">${p.ar}</div>
            </div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
              <div class="prayer-time-text">${fmt(t)}</div>
              ${isPast && !isNext ? '<div class="past-check">✓</div>' : ''}
            </div>
          </div>`;
      }).join('')}
    </div>
    ${state.prayer.qibla !== null ? `
    <div class="qibla-card" id="qibla-section">
      <div class="qibla-top">
        <div class="qibla-icon-wrap">🕋</div>
        <div class="qibla-info">
          <h4>Qibla Direction</h4>
          <p>${Math.round(state.prayer.qibla)}° from North</p>
        </div>
        <button class="qibla-btn" id="qibla-open-btn" onclick="openQiblaCompass()">Find Qibla</button>
      </div>
      <div class="qibla-compass-wrap" id="qibla-compass-wrap" style="display:none">
        <div class="compass-outer">
          <svg id="qibla-svg" viewBox="0 0 200 200" width="200" height="200">
            <circle cx="100" cy="100" r="94" fill="rgba(5,150,105,0.06)" stroke="rgba(5,150,105,0.25)" stroke-width="1.5"/>
            <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(5,150,105,0.1)" stroke-width="1"/>
            <text x="100" y="13" text-anchor="middle" font-size="13" font-weight="800" fill="#059669">N</text>
            <text x="190" y="105" text-anchor="middle" font-size="11" fill="rgba(0,0,0,0.35)">E</text>
            <text x="100" y="197" text-anchor="middle" font-size="11" fill="rgba(0,0,0,0.35)">S</text>
            <text x="10" y="105" text-anchor="middle" font-size="11" fill="rgba(0,0,0,0.35)">W</text>
            <g id="qibla-needle" style="transform-origin:100px 100px">
              <polygon points="100,16 108,96 100,112 92,96" fill="#059669" opacity="0.92"/>
              <polygon points="100,112 108,106 100,178 92,106" fill="rgba(0,0,0,0.18)"/>
              <circle cx="100" cy="100" r="8" fill="white" stroke="#059669" stroke-width="2.5"/>
              <text x="100" y="11" text-anchor="middle" font-size="10">🕋</text>
            </g>
          </svg>
        </div>
        <div class="qibla-status" id="qibla-status">Calibrating…</div>
        <button class="qibla-stop-btn" onclick="stopQiblaCompass()">Close Compass</button>
      </div>
    </div>` : ''}
  `;

  if (state.prayer.countdownInterval) clearInterval(state.prayer.countdownInterval);
  state.prayer.countdownInterval = setInterval(() => updateCountdown(nextTime), 1000);
  updateCountdown(nextTime);
}

function updateCountdown(target) {
  const el = document.getElementById('prayer-countdown');
  if (!el) { clearInterval(state.prayer.countdownInterval); return; }
  const diff = new Date(target) - new Date();
  if (diff <= 0) {
    el.textContent = '00:00:00';
    clearInterval(state.prayer.countdownInterval);
    // Re-render after a short delay to avoid recursion (picks up new prayer)
    setTimeout(renderPrayerTimes, 1000);
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function calcQibla(lat, lng) {
  const kLat = 21.4225 * Math.PI / 180;
  const kLng = 39.8262 * Math.PI / 180;
  const myLat = lat * Math.PI / 180;
  const myLng = lng * Math.PI / 180;
  const dLng = kLng - myLng;
  const y = Math.sin(dLng) * Math.cos(kLat);
  const x = Math.cos(myLat) * Math.sin(kLat) - Math.sin(myLat) * Math.cos(kLat) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

// ── Qibla Compass ─────────────────────────────────────────────
let _qiblaListener = null;
let _qiblaGotAbsolute = false; // true once we receive an absolute-referenced event

function openQiblaCompass() {
  const wrap = document.getElementById('qibla-compass-wrap');
  const btn = document.getElementById('qibla-open-btn');
  if (!wrap) return;

  const start = () => {
    wrap.style.display = 'block';
    if (btn) btn.style.display = 'none';
    _startQiblaListener();
  };

  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(r => {
      if (r === 'granted') start();
      else {
        const st = document.getElementById('qibla-status');
        if (st) { st.textContent = 'Permission denied — check iOS Settings → Safari → Motion & Orientation'; st.className = 'qibla-status qibla-off'; }
        wrap.style.display = 'block';
        if (btn) btn.style.display = 'none';
      }
    }).catch(() => start());
  } else {
    start();
  }
}

function _startQiblaListener() {
  stopQiblaCompass(); // clean up any existing listener
  _qiblaGotAbsolute = false;
  const qibla = state.prayer.qibla;

  _qiblaListener = (e) => {
    let heading;
    if (e.webkitCompassHeading != null) {
      // iOS Safari — always compass-referenced
      heading = e.webkitCompassHeading;
    } else if (e.alpha != null) {
      // Android: prefer absolute-referenced events; ignore non-absolute once we have absolute
      if (e.absolute) _qiblaGotAbsolute = true;
      if (!e.absolute && _qiblaGotAbsolute) return;
      heading = (360 - e.alpha) % 360;
    } else return;

    const needle = document.getElementById('qibla-needle');
    const status = document.getElementById('qibla-status');
    if (!needle) { stopQiblaCompass(); return; }

    const angle = (qibla - heading + 360) % 360;
    needle.style.transform = `rotate(${angle}deg)`;

    const diff = Math.abs(((angle + 180) % 360) - 180);
    if (status) {
      if (diff <= 5) {
        status.textContent = '✅ You are facing the Qibla!';
        status.className = 'qibla-status qibla-on';
        needle.querySelector('polygon')?.setAttribute('fill', '#10b981');
      } else {
        status.textContent = `${Math.round(diff)}° off — turn ${angle < 180 ? 'right' : 'left'}`;
        status.className = 'qibla-status qibla-off';
        needle.querySelector('polygon')?.setAttribute('fill', '#059669');
      }
    }
  };

  // Listen to both — deviceorientationabsolute (Chrome/Firefox Android) gives e.absolute=true,
  // deviceorientation covers iOS (webkitCompassHeading) and fallback browsers (DuckDuckGo etc.)
  window.addEventListener('deviceorientationabsolute', _qiblaListener, true);
  window.addEventListener('deviceorientation', _qiblaListener, true);
}

function stopQiblaCompass() {
  if (_qiblaListener) {
    window.removeEventListener('deviceorientationabsolute', _qiblaListener, true);
    window.removeEventListener('deviceorientation', _qiblaListener, true);
    _qiblaListener = null;
  }
  const wrap = document.getElementById('qibla-compass-wrap');
  const btn = document.getElementById('qibla-open-btn');
  if (wrap) wrap.style.display = 'none';
  if (btn) btn.style.display = '';
}

// ── DHIKR TAB ─────────────────────────────────────────────────
function renderDhikr() {
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
    <div class="dhikr-list">
      ${DHIKRS.map((d, i) => renderDhikrCard(d, i)).join('')}
    </div>
  `;
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

function updateDhikrCard(i) {
  const d = DHIKRS[i];
  const count = state.dhikrCounts[i] || 0;
  const pct = Math.min((count / d.target) * 100, 100);
  const done = count >= d.target;
  const card = document.getElementById(`dhikr-${i}`);
  if (!card) return;
  card.className = `dhikr-card${done ? ' complete' : ''}`;
  card.querySelector('.progress-bar-fill').style.width = `${pct}%`;
  card.querySelector('.dhikr-count').textContent = `${count} / ${d.target}${done ? ' ✓' : ''}`;
  card.querySelector('.tap-btn').textContent = done ? '✓ Done' : 'Tap';
  // Update total
  const total = Object.values(state.dhikrCounts).reduce((a, b) => a + b, 0);
  const totalEl = document.querySelector('.dhikr-total');
  if (totalEl) totalEl.textContent = `Total today: ${total}`;
}

function resetAllDhikr() {
  if (!confirm('Reset all dhikr counts?')) return;
  state.dhikrCounts = {};
  saveDhikr();
  renderDhikr();
}

function saveDhikr() {
  localStorage.setItem('huda_dhikr', JSON.stringify(state.dhikrCounts));
}

// ── DUAS TAB ──────────────────────────────────────────────────
const DUA_ICONS = {
  'Morning Adhkar':'🌅','Evening Adhkar':'🌆','Before Sleeping':'🌙',
  'Upon Waking':'☀️','Before Eating':'🍽️','After Eating':'🤲',
  'For Anxiety & Distress':'💚','After Prayer':'📿','Entering & Leaving Home':'🏠',
  'Entering & Leaving Masjid':'🕌','Entering & Leaving Toilet':'🚻','Travelling':'✈️','For Parents':'❤️',
  'Seeking Forgiveness':'🌿','For Guidance & Knowledge':'📚',
  'Prophetic Duas ﷺ':'🌙'
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
  // Preserve insertion order
  const seen = [];
  const counts = {};
  all.forEach(d => {
    if (!counts[d.prophet]) { counts[d.prophet] = 0; seen.push(d.prophet); }
    counts[d.prophet]++;
  });
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

function renderProphetDuaReader() {
  const prophet = state.learn.currentProphet;
  const duas = DUAS['Prophetic Duas ﷺ'].filter(d => d.prophet === prophet);
  const i = state.learn.currentDuaIndex;
  const dua = duas[i];
  const tab = document.getElementById('tab-duas');
  tab.innerHTML = `
    <div class="page-header">
      <button class="back-btn" onclick="renderProphetList()">←</button>
      <div>
        <h2>${prophet}</h2>
        <div style="font-size:11px;opacity:0.8">${PROPHET_ICONS[prophet] || '🤲'} Prophetic Duas</div>
      </div>
    </div>
    <div class="dua-card fade-in">
      <div class="dua-counter">${i + 1} of ${duas.length}</div>
      <div class="dua-arabic">${dua.arabic}</div>
      <div class="dua-transliteration">${dua.transliteration}</div>
      <div class="dua-meaning">${dua.meaning}</div>
      <span class="dua-source-badge">📚 ${dua.source} · ${dua.grade}</span>
      <button class="share-dua-btn" onclick="shareProphetDua(${i})">Share ↗</button>
    </div>
    ${duas.length > 1 ? `
    <div class="dua-nav">
      <button class="dua-nav-btn" onclick="changeProphetDua(-1)" ${i === 0 ? 'disabled' : ''}>← Previous</button>
      <span style="font-size:12px;color:var(--gray-400)">${i + 1} / ${duas.length}</span>
      <button class="dua-nav-btn" onclick="changeProphetDua(1)" ${i === duas.length - 1 ? 'disabled' : ''}>Next →</button>
    </div>` : ''}
  `;
}

function changeProphetDua(dir) {
  const duas = DUAS['Prophetic Duas ﷺ'].filter(d => d.prophet === state.learn.currentProphet);
  state.learn.currentDuaIndex = Math.max(0, Math.min(duas.length - 1, state.learn.currentDuaIndex + dir));
  renderProphetDuaReader();
}

function shareProphetDua(index) {
  const dua = DUAS['Prophetic Duas ﷺ'].filter(d => d.prophet === state.learn.currentProphet)[index];
  const text = `${dua.arabic}\n\n${dua.transliteration}\n\n"${dua.meaning}"\n\n— ${dua.source} | ${dua.grade}\n\nShared from Huda Islamic Companion`;
  if (navigator.share) {
    navigator.share({ title: `Dua of ${dua.prophet}`, text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => alert('Dua copied!')).catch(() => {});
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
  `;
}

function changeDua(dir) {
  const cat = state.learn.currentDuaCategory;
  const max = DUAS[cat].length - 1;
  state.learn.currentDuaIndex = Math.max(0, Math.min(max, state.learn.currentDuaIndex + dir));
  renderDuaReader();
}

// ── LEARN TAB ─────────────────────────────────────────────────
function renderLearnHub() {
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
        { icon:'🕌', bg:'#d1fae5', title:'New Muslim Guide', desc:'7 essential lessons for new Muslims', fn:'openNewMuslimGuide' },
        { icon:'🔤', bg:'#dbeafe', title:"Children's Quran", desc:'Arabic alphabet & short surahs', fn:'openChildrensQuran' },
        { icon:'✨', bg:'#fef3c7', title:'99 Names of Allah', desc:'Asmaul Husna — all 99 names', fn:'openNamesOfAllah' },
        { icon:'🕋', bg:'#ede9fe', title:'Hajj & Umrah Guide', desc:'Complete step-by-step guide', fn:'openHajjGuide' },
        { icon:'💰', bg:'#fce7f3', title:'Zakat Calculator', desc:'Calculate your obligatory charity', fn:'openZakatCalc' },
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
    zakatPrices.gold = 95;
    zakatPrices.silver = 0.85;
    zakatPrices.rates = { USD:1, GBP:0.79, EUR:0.92, AED:3.67 };
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

// ── Reminders / Notifications ─────────────────────────────────
const REMINDER_MSGS = [
  { title: 'Istighfar', body: 'أَسْتَغْفِرُ اللّٰه\nPause and seek Allah\'s forgiveness' },
  { title: 'Subhan Allah', body: 'سُبْحَانَ اللّٰه\nGlory be to Allah — say it 33 times' },
  { title: 'Alhamdulillah', body: 'الحَمْدُ لِلّٰه\nCount your blessings and praise Allah' },
  { title: 'Allahu Akbar', body: 'اللّٰهُ أَكْبَر\nAllah is Greater than everything you worry about' },
  { title: 'La ilaha illallah', body: 'لَا إِلٰهَ إِلَّا اللّٰه\nRenew your faith with the Shahada' },
  { title: 'Salawat', body: 'اللّٰهُمَّ صَلِّ عَلَى مُحَمَّد\nSend blessings upon the Prophet ﷺ' },
  { title: 'Dhikr', body: 'In the remembrance of Allah do hearts find rest — Quran 13:28' },
  { title: 'Subhanallahi wa bihamdih', body: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ\nBeloved to Allah — light on the tongue, heavy on the scale' },
];

function renderReminderCard() {
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const enabled = localStorage.getItem('huda_notifs') === '1' && perm === 'granted';
  const interval = parseInt(localStorage.getItem('huda_notifs_interval') || '2');
  if (perm === 'unsupported') return '';
  const last = parseInt(localStorage.getItem('huda_last_reminder') || '0');
  const nextMs = last ? Math.max(0, (last + interval * 3600000) - Date.now()) : 0;
  const nextStr = enabled && last ? (nextMs < 60000 ? 'any moment' : `in ${Math.ceil(nextMs/60000)}m`) : '';
  const permDenied = perm === 'denied';
  const ua = navigator.userAgent || '';
  const isMac = /Mac/.test(navigator.platform || ua) && !/iPhone|iPad/.test(ua);
  const isAndroid = /Android/.test(ua);
  const blockedHint = isMac
    ? ' — System Settings → Notifications → Chrome'
    : isAndroid
    ? ' — Chrome menu → Settings → Site Settings → Notifications'
    : ' — enable in your browser settings';
  return `
    <div class="reminder-card">
      <div class="reminder-card-top">
        <div>
          <div class="reminder-card-title">🔔 Daily Reminders</div>
          <div class="reminder-card-sub">${
            permDenied ? `⚠️ Notifications blocked${blockedHint}` :
            enabled ? `Every ${interval}h` :
            'Gentle reminders throughout your day'
          }</div>
          ${enabled && isMac ? `<div style="font-size:11px;color:var(--gray-400);margin-top:3px">Mac: check System Settings → Notifications → Chrome if not arriving</div>` : ''}
        </div>
        ${enabled
          ? `<div style="display:flex;gap:6px">
               <button class="reminder-off-btn" onclick="testNotification()" title="Send a test notification now" style="background:#0891b2">Test</button>
               <button class="reminder-off-btn" onclick="disableReminders()">Off</button>
             </div>`
          : permDenied ? '' : `<button class="reminder-on-btn" onclick="enableReminders()">Enable</button>`
        }
      </div>
      ${enabled ? `
        <div class="reminder-next-cd">Next reminder in <span id="home-notif-cd" style="font-variant-numeric:tabular-nums;font-weight:700">--:--:--</span></div>
        <div class="reminder-intervals">
          ${[1,2,3,4].map(h => `
            <button class="ri-btn ${interval === h ? 'active' : ''}" onclick="setReminderInterval(${h})">${h}h</button>
          `).join('')}
        </div>` : ''}
    </div>`;
}

function showToast(msg) {
  let t = document.getElementById('huda-toast');
  if (!t) { t = document.createElement('div'); t.id = 'huda-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function testNotification() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    const ua = navigator.userAgent || '';
    const isMac = /Mac/.test(navigator.platform || ua) && !/iPhone|iPad/.test(ua);
    const isAndroid = /Android/.test(ua);
    alert(isMac
      ? 'Notifications blocked.\n\n1. Open System Settings → Notifications → Chrome\n2. Turn on "Allow Notifications"\n3. Make sure Focus/Do Not Disturb is off\n4. Also check Chrome → Settings → Privacy → Notifications — make sure huda-six.vercel.app is allowed'
      : isAndroid
      ? 'Notifications blocked.\n\nTo enable:\n1. Tap Chrome\'s 3-dot menu → Settings\n2. Site Settings → Notifications\n3. Find this site → tap Allow'
      : 'Notifications are not granted. Please enable them in your browser settings.');
    return;
  }
  const msg = REMINDER_MSGS[Math.floor(Math.random() * REMINDER_MSGS.length)];
  // Fire via SW (works everywhere, required on Android)
  navigator.serviceWorker?.ready.then(reg => {
    reg.showNotification('Huda — ' + msg.title, {
      body: msg.body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
      tag: 'huda-test-' + Date.now(), renotify: true,
    });
  }).catch(() => {});
  // Direct Notification — desktop only (Android Chrome blocks this from page context)
  if (!/Android/.test(navigator.userAgent || '')) {
    try { new Notification('Huda — ' + msg.title, { body: msg.body, icon: '/icons/icon-192.png' }); } catch(e) {}
  }
  showToast('Notification sent — check your notification area');
}

let _reminderInterval = null;
let _checkPending = false; // debounce guard

function setupReminders() {
  if (localStorage.getItem('huda_notifs') !== '1') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  _syncSwTimestamp().then(() => {
    checkMissedReminder();
    _swScheduleReminder();
  });
  _startForegroundPoller();
}

// Poll every 60s while app is open
function _startForegroundPoller() {
  if (_reminderInterval) clearInterval(_reminderInterval);
  _reminderInterval = setInterval(checkMissedReminder, 60000);
}

// Read the timestamp the SW wrote to cache when it fired
async function _syncSwTimestamp() {
  try {
    const resp = await caches.match('/__huda_last_reminder__');
    if (!resp) return;
    const ts = parseInt(await resp.text());
    if (!ts) return;
    const stored = parseInt(localStorage.getItem('huda_last_reminder') || '0');
    if (ts > stored) localStorage.setItem('huda_last_reminder', String(ts));
  } catch(e) {}
}

// Check if a reminder is overdue and fire it
function checkMissedReminder() {
  if (localStorage.getItem('huda_notifs') !== '1') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const last = parseInt(localStorage.getItem('huda_last_reminder') || '0');
  if (!last) {
    localStorage.setItem('huda_last_reminder', Date.now().toString());
    return;
  }
  const hours = parseInt(localStorage.getItem('huda_notifs_interval') || '2');
  if (Date.now() - last >= hours * 3600000) {
    fireReminder();
  }
}

// Debounced version for event listeners — prevents stacking on app open
function _debouncedCheck() {
  if (_checkPending) return;
  _checkPending = true;
  setTimeout(async () => {
    _checkPending = false;
    await _syncSwTimestamp();
    checkMissedReminder();
  }, 800);
}

function fireReminder() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  // Update timestamp synchronously first — prevents any parallel call from double-firing
  localStorage.setItem('huda_last_reminder', Date.now().toString());
  const msg = REMINDER_MSGS[Math.floor(Math.random() * REMINDER_MSGS.length)];
  navigator.serviceWorker?.ready.then(reg => {
    reg.showNotification('Huda — ' + msg.title, {
      body: msg.body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
      tag: 'huda-reminder', renotify: true,
    });
  }).catch(() => {});
  // Direct Notification — desktop only (Android Chrome blocks this from page context)
  if (!/Android/.test(navigator.userAgent || '')) {
    try { new Notification('Huda — ' + msg.title, { body: msg.body, icon: '/icons/icon-192.png' }); } catch(e) {}
  }
  // Reschedule SW from now so it doesn't also fire immediately
  _swScheduleReminder();
}

// Tell the SW to run its own timer for background notifications
function _swScheduleReminder() {
  const hours = parseInt(localStorage.getItem('huda_notifs_interval') || '2');
  const last = parseInt(localStorage.getItem('huda_last_reminder') || '0');
  const intervalMs = hours * 3600000;
  const elapsed = last ? Date.now() - last : 0;
  const remaining = intervalMs - elapsed;
  // If overdue, page already handled it — give SW a full interval from now
  // This prevents the SW from firing again immediately after the page just fired
  const firstMs = remaining > 30000 ? remaining : intervalMs;
  navigator.serviceWorker?.ready.then(reg => {
    reg.active?.postMessage({ type: 'SCHEDULE_REMINDER', firstMs, intervalMs });
  });
}

// Listen for SW firing — update our timestamp
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'REMINDER_FIRED') {
      localStorage.setItem('huda_last_reminder', Date.now().toString());
    }
  });
}

// Single entry point for all app-open events — debounced to prevent stacking
document.addEventListener('visibilitychange', () => { if (!document.hidden) _debouncedCheck(); });
window.addEventListener('pageshow', e => { if (e.persisted) _debouncedCheck(); });

async function enableReminders() {
  if (!('Notification' in window)) return;
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    localStorage.setItem('huda_notifs', '1');
    localStorage.setItem('huda_last_reminder', Date.now().toString());
    setupReminders();
  } else {
    localStorage.setItem('huda_notifs', '0');
  }
  renderHome();
}

function disableReminders() {
  localStorage.setItem('huda_notifs', '0');
  if (_reminderInterval) { clearInterval(_reminderInterval); _reminderInterval = null; }
  navigator.serviceWorker?.ready.then(reg => {
    reg.active?.postMessage({ type: 'CANCEL_REMINDER' });
  });
  renderHome();
}

function setReminderInterval(h) {
  localStorage.setItem('huda_notifs_interval', h);
  localStorage.setItem('huda_last_reminder', Date.now().toString()); // reset clock
  _startForegroundPoller();
  _swScheduleReminder();
  renderHome();
}

// ── PWA ───────────────────────────────────────────────────────
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/service-worker.js').then(reg => {
    // Check for updates when user returns to the app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update();
    });
  }).catch(() => {});
  // New SW activated → reload so users get the latest version
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
}

let deferredPrompt = null;
function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('show');
  });
}

function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('show');
  });
}

function dismissInstall() {
  const banner = document.getElementById('install-banner');
  if (banner) banner.classList.remove('show');
}

// ── Font Size ─────────────────────────────────────────────────
function changeFontSize(delta) {
  state.fontSize = Math.max(16, Math.min(36, state.fontSize + delta));
  localStorage.setItem('huda_fontsize', state.fontSize);
  // Re-render mushaf if open
  const n = state.quran.currentSurah;
  if (n && state.quran.viewMode === 'page' && state.quran.cache[n]) {
    const { arData, enData } = state.quran.cache[n];
    renderMushafPage(n, arData, enData);
  }
}

// ── Share Dua ─────────────────────────────────────────────────
function shareDua(index) {
  const cat = state.learn.currentDuaCategory;
  const dua = DUAS[cat][index];
  const text = `${dua.arabic}\n\n${dua.transliteration}\n\n"${dua.meaning}"\n\n— ${dua.source} | ${dua.grade}\n\nShared from Huda Islamic Companion`;
  if (navigator.share) {
    navigator.share({ title: `Dua: ${cat}`, text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => alert('Dua copied!')).catch(() => {});
  }
}
