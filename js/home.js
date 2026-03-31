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

function clearLastRead() {
  localStorage.setItem('huda_last_read', 'null'); // 'null' (not removed) so pushSync pushes it to Supabase
  localStorage.setItem('_sync_ts_huda_last_read', String(Date.now())); // prevent pull from restoring it
  debouncedPush();
  renderHome();
}

// ── HOME TAB ──────────────────────────────────────────────────
function renderHome() {
  if (!localStorage.getItem('huda_onboarded')) {
    showOnboarding();
    return;
  }

  const now = new Date();
  const hijri = getHijriSync(now);
  const hijriStr = `${hijri.day} ${hijri.monthName} ${hijri.year} AH`;
  const isRamadan = hijri.month === 9;
  const h = HADITHS[state.hadithIndex % HADITHS.length];
  const lastRead = (() => { try { return JSON.parse(localStorage.getItem('huda_last_read') || 'null'); } catch(e) { return null; } })();

  // Compute next prayer for hero pill
  let _pillHtml;
  if (!state.prayer.times) {
    _pillHtml = `<div class="hero-prayer-pill-empty">Prayer times loading...</div>`;
  } else {
    const PILL_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const _now = Date.now();
    let _nextKey = null, _nextTime = null;
    for (const k of PILL_KEYS) {
      const t = new Date(state.prayer.times[k]);
      if (t > _now) { _nextKey = k; _nextTime = t; break; }
    }
    if (!_nextKey) { _nextKey = 'fajr'; _nextTime = new Date(state.prayer.times.fajr); }
    const _name = _nextKey.charAt(0).toUpperCase() + _nextKey.slice(1);
    const _fmt = _nextTime.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: true });
    const _diff = _nextTime - _now;
    const _hh = Math.floor(_diff / 3600000), _mm = Math.floor((_diff % 3600000) / 60000);
    const _cd = _diff <= 0 ? 'Soon' : (_hh > 0 ? `in ${_hh}h ${_mm}m` : `in ${_mm}m`);
    _pillHtml = `
    <div class="hero-prayer-pill">
      <div>
        <div class="hero-pill-label">Next Prayer</div>
        <div class="hero-pill-name">${_name}</div>
      </div>
      <div class="hero-pill-right">
        <div class="hero-pill-time">${_fmt}</div>
        <div class="hero-pill-countdown">${_cd}</div>
      </div>
    </div>`;
  }

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
      <button class="account-btn" id="account-btn" onclick="openSettings()" title="Settings">⚙️</button>
      <div class="hero-date-combined">${now.toLocaleDateString('en-US', { weekday:'long' })} · ${hijriStr}${isRamadan ? ' 🌙' : ''}</div>
      <div class="hero-arabic">السَّلَامُ عَلَيْكُمْ</div>
      <div class="hero-sub">Peace be upon you</div>
      ${_pillHtml}
    </div>

    ${ramadanCard}

    ${jumuahCard}

    <div style="padding:12px 12px 0" id="plan-card-wrap">
      ${renderPlanCard()}
    </div>

    ${lastRead?.view === 'page' ? `
    <div style="position:relative;margin:0 12px 10px">
      <div class="continue-card" onclick="switchTab('quran');setTimeout(()=>openSurah(${lastRead.surah}${lastRead.ayah ? `,${lastRead.ayah}` : ''}),100)" style="margin:0">
        <div>
          <div class="card-section-label">Continue Reading</div>
          <div style="font-size:15px;font-weight:700;color:#065f46">${esc(lastRead.name)}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:1px">${esc(lastRead.arabic)}${lastRead.ayah ? ` · Ayah ${lastRead.ayah}` : ''}</div>
        </div>
        <div class="continue-icon-well">📖</div>
      </div>
      <button onclick="clearLastRead()" style="position:absolute;top:8px;right:8px;background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;padding:4px;line-height:1;z-index:1" title="Dismiss">×</button>
    </div>` : ''}

    ${state.bookmarks.length ? `
    <div style="padding:16px 16px 0">
      <div class="section-title">🔖 Bookmarked Ayahs</div>
    </div>
    <div class="bookmarks-list">
      ${state.bookmarks.slice(0, 5).map(b => {
        const s = SURAHS[b.s - 1];
        return `
        <div class="bookmark-row" onclick="switchTab('quran');setTimeout(()=>{openSurah(${b.s},${b.a});flashAyah(${b.a});},200)">
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

    <div class="hadith-card" id="hadith-card">
      <div class="card-section-label">Hadith of the Day</div>
      <p class="hadith-text">"${esc(h.text)}"</p>
      <div class="hadith-source">
        <span class="badge badge-emerald">${esc(h.source)}</span>
        <span class="badge badge-gold">${esc(h.grade)}</span>
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
      <div class="card-section-label">Hadith of the Day</div>
      <p class="hadith-text">"${esc(h.text)}"</p>
      <div class="hadith-source">
        <span class="badge badge-emerald">${esc(h.source)}</span>
        <span class="badge badge-gold">${esc(h.grade)}</span>
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

function openSettings() {
  // Stop audio if playing to avoid button/state desync
  if (state.audio.player) {
    state.audio.player.pause();
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
  }

  const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  const notifRow = perm === 'granted'
    ? `<div class="settings-row">
        <span class="settings-label">Prayer Notifications</span>
        <span class="settings-value-on">On ✓</span>
       </div>
       <div class="settings-subtitle">Fajr, Dhuhr, Asr, Maghrib and Isha</div>`
    : perm === 'default'
    ? `<div class="settings-row">
        <span class="settings-label">Prayer Notifications</span>
        <button class="settings-enable-btn" onclick="requestNotifPermission().then(()=>openSettings())">Enable</button>
       </div>
       <div class="settings-subtitle">Get notified at each prayer time</div>`
    : `<div class="settings-row">
        <span class="settings-label">Prayer Notifications</span>
        <span class="settings-value-off">Blocked</span>
       </div>
       <div class="settings-subtitle">To enable: device Settings → Browser → Notifications → Allow</div>`;

  const reciterOptions = RECITERS.map(r =>
    `<option value="${r.id}" ${state.reciter === r.id ? 'selected' : ''}>${r.name}</option>`
  ).join('');

  document.getElementById('tab-home').innerHTML = `
    <div class="settings-screen">
      <div class="help-header">
        <button class="help-back-btn" onclick="closeSettings()">← Back</button>
        <div class="help-title">Settings</div>
      </div>
      <div style="overflow-y:auto;flex:1">

        <div class="settings-section-label">Account</div>
        <div class="settings-group">
          <div class="settings-row" onclick="openAuthModal()" style="cursor:pointer">
            <span class="settings-label">Sign In / Sign Up</span>
            <span class="settings-arrow">›</span>
          </div>
          <div class="settings-subtitle">Sync bookmarks and reading progress across devices</div>
        </div>

        <div class="settings-section-label">Quran</div>
        <div class="settings-group">
          <div class="settings-row">
            <span class="settings-label">Reciter</span>
            <select class="settings-select" onchange="setReciter(this.value)">${reciterOptions}</select>
          </div>
          <div class="settings-row">
            <span class="settings-label">Arabic Font Size</span>
            <div class="settings-font-row">
              <button class="settings-font-btn" onclick="changeFontSize(-2);this.closest('.settings-screen').querySelector('.settings-font-val').textContent=state.fontSize+'px'">A−</button>
              <span class="settings-font-val">${state.fontSize}px</span>
              <button class="settings-font-btn" onclick="changeFontSize(2);this.closest('.settings-screen').querySelector('.settings-font-val').textContent=state.fontSize+'px'">A+</button>
            </div>
          </div>
        </div>

        <div class="settings-section-label">Appearance</div>
        <div class="settings-group">
          <div class="settings-row">
            <span class="settings-label">Dark Mode</span>
            <button class="settings-toggle ${state.darkMode ? 'on' : 'off'}"
              onclick="toggleDarkMode();this.classList.toggle('on');this.classList.toggle('off')"
              aria-label="Toggle dark mode"></button>
          </div>
        </div>

        <div class="settings-section-label">Notifications</div>
        <div class="settings-group">
          ${notifRow}
        </div>

        <div class="settings-section-label">About</div>
        <div class="settings-group">
          <div class="settings-row" onclick="closeSettings();setTimeout(openHelpScreen,50)" style="cursor:pointer">
            <span class="settings-label">About Huda</span>
            <span class="settings-arrow">›</span>
          </div>
          <div class="settings-row">
            <span class="settings-label" style="color:#6b7280">Version</span>
            <span class="settings-value" style="color:#9ca3af">v142</span>
          </div>
        </div>

        <div style="height:48px"></div>
      </div>
    </div>
  `;
}

function closeSettings() {
  renderHome();
}

function showOnboarding() {
  document.getElementById('tab-home').innerHTML = `
    <div class="onboarding">
      <div class="onboarding-icon">🕌</div>
      <div class="onboarding-title">Huda</div>
      <div class="onboarding-subtitle">Your Islamic companion</div>
      <button class="onboarding-location-btn" onclick="onboardingEnableLocation(this)">
        📍 Enable Location<br>
        <span style="font-size:12px;opacity:0.8;font-weight:400">For accurate prayer times</span>
      </button>
      <button class="onboarding-start-btn" onclick="dismissOnboarding()">Get Started</button>
      <button class="onboarding-skip" onclick="dismissOnboarding()">Skip for now</button>
    </div>
  `;
}

function onboardingEnableLocation(btn) {
  btn.disabled = true;
  btn.textContent = 'Getting location...';
  if (!navigator.geolocation) { dismissOnboarding(); return; }
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
      dismissOnboarding();
      calcPrayerTimes(lat, lng);
    },
    () => dismissOnboarding(),
    { timeout: 10000 }
  );
}

function dismissOnboarding() {
  localStorage.setItem('huda_onboarded', '1');
  renderHome();
}

