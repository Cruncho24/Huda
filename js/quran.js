/* ============================================================
   HUDA PWA — Quran Tab
   ============================================================ */

// Tracks which ayahs have tafsir expanded; cleared on each renderSurahContent
const _openTafsir = new Set(); // "surah:ayah" strings
let _ayahObserver = null; // IntersectionObserver for reading position tracking
let _searchDebounce = null;
let _offlineDownloading = false;
let _offlineCancelled   = false;
let _pendingShareText   = '';

// ── QURAN TAB ─────────────────────────────────────────────────
function renderQuranList() {
  if (document.getElementById('quran-list-view')) return;
  const tab = document.getElementById('tab-quran');
  tab.innerHTML = `
    <div id="quran-list-view">
      <div style="background:linear-gradient(160deg,#047857,#065f46);padding:20px 16px calc(16px + env(safe-area-inset-top,0px));color:white;padding-top:calc(20px + env(safe-area-inset-top,0px))">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="font-size:11px;opacity:0.6;text-transform:uppercase;letter-spacing:0.05em">Holy Quran</div>
          <span id="offline-pill"></span>
        </div>
        <div style="font-size:22px;font-weight:700;letter-spacing:0.5px;margin-bottom:12px">القُرْآن الكَرِيم</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 12px;display:flex;align-items:center;gap:8px;flex:1">
            <span style="opacity:0.6;font-size:14px">🔍</span>
            <input id="surah-search" placeholder="Search surah..." oninput="filterSurahs(this.value)"
              style="background:none;border:none;outline:none;color:white;font-size:13px;flex:1;caret-color:white;"
              autocomplete="off">
          </div>
          <button onclick="openQuranSearch()" title="Search by verse"
            style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:8px 12px;color:white;font-size:14px;cursor:pointer;white-space:nowrap;flex-shrink:0">
            Search verse
          </button>
        </div>
      </div>
      <div id="offline-banner"></div>
      <div id="quran-themes-section"></div>
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
          <button class="mhdr-btn" id="reader-bm-btn" onclick="toggleReaderBookmark()" title="Bookmark this surah">🏷️</button>
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
  _renderOfflineBanner();
  _renderQuranThemes();
}

function _renderOfflineBanner() {
  const el = document.getElementById('offline-banner');
  if (!el) return;

  if (localStorage.getItem('huda_quran_offline') === '1') {
    el.innerHTML = '';
    const pill = document.getElementById('offline-pill');
    if (pill) pill.innerHTML = `<span style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:2px 8px;font-size:10px;color:rgba(255,255,255,0.85);font-weight:600">✓ Offline</span>`;
    return;
  }

  if (_offlineDownloading) {
    el.innerHTML = `
      <div class="offline-banner">
        <div class="offline-banner-progress-wrap">
          <div class="offline-banner-title">Downloading… <span id="offline-count">0</span> / 114</div>
          <div class="offline-progress-bar"><div class="offline-progress-fill" id="offline-fill" style="width:0%"></div></div>
        </div>
        <button class="offline-banner-btn offline-cancel-btn" onclick="cancelQuranDownload()">Cancel</button>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="offline-banner">
      <div class="offline-banner-text">
        <span class="offline-banner-icon">📥</span>
        <div>
          <div class="offline-banner-title">Download for offline reading</div>
          <div class="offline-banner-sub">Save all 114 surahs to your device</div>
        </div>
      </div>
      <button class="offline-banner-btn" onclick="downloadQuranOffline()">Download</button>
    </div>`;
}

async function downloadQuranOffline() {
  if (_offlineDownloading) return;
  _offlineDownloading = true;
  _offlineCancelled = false;
  _renderOfflineBanner();

  const BATCH = 5;
  let done = 0;

  for (let i = 1; i <= 114; i += BATCH) {
    if (_offlineCancelled) break;
    const batch = [];
    for (let j = i; j < i + BATCH && j <= 114; j++) {
      batch.push(
        Promise.all([
          fetch(`https://api.alquran.cloud/v1/surah/${j}/quran-uthmani`),
          fetch(`https://api.alquran.cloud/v1/surah/${j}/en.sahih`)
        ]).then(([arRes, enRes]) => Promise.all([arRes.json(), enRes.json()]))
          .then(([arJson, enJson]) => {
            state.quran.cache[j] = { arData: arJson.data, enData: enJson.data };
            done++;
            const countEl = document.getElementById('offline-count');
            const fillEl  = document.getElementById('offline-fill');
            if (countEl) countEl.textContent = done;
            if (fillEl)  fillEl.style.width = `${Math.round(done / 114 * 100)}%`;
          })
          .catch(() => { done++; }) // silent per-surah fail — SW will cache on next open
      );
    }
    await Promise.all(batch);
  }

  _offlineDownloading = false;
  if (!_offlineCancelled) {
    localStorage.setItem('huda_quran_offline', '1');
  }
  _renderOfflineBanner();
}

function cancelQuranDownload() {
  _offlineCancelled = true;
  _offlineDownloading = false;
  // In-flight batch promises continue but DOM updates are null-guarded
  // and huda_quran_offline is NOT set since _offlineCancelled=true.
  _renderOfflineBanner();
}

function renderSurahList(list) {
  const readingSurah = state.quran.currentSurah;
  document.getElementById('surah-list').innerHTML = list.map(s => `
    <div class="surah-item ${s[0] === readingSurah ? 'surah-item-reading' : ''}" onclick="openSurah(${s[0]})">
      <div class="surah-num ${s[0] === readingSurah ? 'surah-num-reading' : ''}">${s[0]}</div>
      <div class="surah-info">
        <div class="surah-english">${s[2]}</div>
        <div class="surah-meta">${s[3]} · ${s[4]} verses</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="surah-arabic-name">${s[1]}</div>
        ${s[0] === readingSurah ? '<div class="surah-reading-pill">READING</div>' : ''}
      </div>
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

async function openSurah(n, targetAyah = null) {
  mushafStop();
  document.getElementById('quran-list-view').style.display = 'none';
  const reader = document.getElementById('quran-reader');
  reader.style.display = 'block';
  state.quran.currentSurah = n;
  state.quran.currentPage = 0;
  const s = SURAHS[n - 1];
  const _prevLr = (() => { try { return JSON.parse(localStorage.getItem('huda_last_read') || 'null'); } catch(e) { return null; } })();
  const _lrAyah = (_prevLr?.surah === n && _prevLr?.ayah) ? _prevLr.ayah : undefined;
  localStorage.setItem('huda_last_read', JSON.stringify({ surah: n, name: s[2], arabic: s[1], ...(_lrAyah ? { ayah: _lrAyah } : {}) }));
  debouncedPush();
  document.getElementById('reader-title').textContent = `${s[2]} — ${s[1]}`;
  document.getElementById('reader-meta').textContent = `${s[5]} · ${s[4]} verses · ${s[3]}`;
  const rbm = document.getElementById('reader-bm-btn');
  if (rbm) rbm.textContent = isSurahBookmarked(n) ? '🔖' : '🏷️';
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
    if (targetAyah) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (state.quran.viewMode === 'page') {
            const wrap = document.querySelector(`#mushaf-page .mushaf-ayah-wrap[data-ayah="${targetAyah}"]`);
            wrap?.closest('.mushaf-page-block')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            const el = document.getElementById(`ayah-${targetAyah}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => flashAyahEl(el), 400);
            }
          }
        }, 0);
      });
    }
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
  // Track which view was last used so Continue Reading only shows for mushaf
  try {
    const lr = JSON.parse(localStorage.getItem('huda_last_read') || 'null');
    if (lr) { lr.view = mode; localStorage.setItem('huda_last_read', JSON.stringify(lr)); }
  } catch(e) {}
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
    if (_mushafFromAyah) {
      const _target = _mushafFromAyah;
      _mushafFromAyah = null; // clear after restoring
      setTimeout(() => {
        const mp = document.getElementById('mushaf-page');
        const wrap = mp?.querySelector(`.mushaf-ayah-wrap[data-ayah="${_target}"]`);
        if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      document.getElementById('mushaf-page').scrollTop = 0;
    }
  } else {
    document.getElementById('mushaf-page').style.display = 'none';
    document.getElementById('reader-content').style.display = 'block';
    renderSurahContent(n, arData, enData);
    if (_mushafFromAyah) {
      const _target = _mushafFromAyah;
      _mushafFromAyah = null;
      setTimeout(() => {
        const el = document.getElementById(`ayah-${_target}`);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          el.classList.add('flashing');
          el.addEventListener('animationend', () => el.classList.remove('flashing'), { once: true });
        }, 400);
      }, 100);
    } else {
      document.getElementById('reader-content').scrollTop = 0;
    }
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
      return `<span class="mushaf-ayah-wrap" data-global="${a.number}" data-surah="${n}" data-ayah="${a.numberInSurah}">${rawText} <span class="mushaf-anum" id="maud-${a.number}" title="Tap for translation · Hold to play">&#xFD3F;${toArabicNumerals(a.numberInSurah)}&#xFD3E;</span></span>`;
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
    <div class="mushaf-hint">Tap a number to view translation · Hold to play</div>
    <div class="mushaf-scroll-body">${pagesHtml}</div>
  `;
  setupAyahLongPress(el);
  updateMushafPlayerBar();

  // Track reading position by page block — same delayed approach as verse mode
  if (_ayahObserver) _ayahObserver.disconnect();
  _ayahObserver = null;
  setTimeout(() => {
    if (!el.isConnected) return;
    _ayahObserver = new IntersectionObserver(entries => {
      const visibleBlocks = entries.filter(e => e.isIntersecting).map(e => e.target);
      if (!visibleBlocks.length) return;
      const topBlock = visibleBlocks.reduce((top, cur) =>
        cur.getBoundingClientRect().top < top.getBoundingClientRect().top ? cur : top
      );
      const firstWrap = topBlock.querySelector('.mushaf-ayah-wrap[data-ayah]');
      if (!firstWrap) return;
      const ayah = parseInt(firstWrap.dataset.ayah, 10);
      if (isNaN(ayah)) return;
      try {
        const lr = JSON.parse(localStorage.getItem('huda_last_read') || 'null');
        if (lr) { lr.ayah = ayah; localStorage.setItem('huda_last_read', JSON.stringify(lr)); }
      } catch(e) { console.warn('[huda] failed to save reading position', e); }
    }, { threshold: 0.3 });
    el.querySelectorAll('.mushaf-page-block').forEach(block => _ayahObserver.observe(block));
  }, 650);
}

// ── Surah-level audio (gapless) ───────────────────────────────
const _surahTimingsCache = {};
let _surahAudio   = null; // the full-surah Audio element when active
let _surahBadge   = null; // currently highlighted ayah badge
let _surahTiming  = null; // { [verse_key]: { from, to } }

// Register (or re-register) MediaSession metadata + action handlers.
// Called on every play event so lock screen reclaims focus after interruptions.
function _registerMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const sn = state.audio.playingSurah;
  if (!sn) return;
  const s = SURAHS[sn - 1];
  const ayahLabel = state.audio.playingAyah ? ` · Ayah ${state.audio.playingAyah}` : '';
  navigator.mediaSession.metadata = new MediaMetadata({
    title: s ? s[1] : '',
    artist: s ? `${s[2]}${ayahLabel}` : '',
    album: 'Quran — Huda',
    artwork: [{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
  });
  navigator.mediaSession.playbackState = state.audio.paused ? 'paused' : 'playing';
  navigator.mediaSession.setActionHandler('play', () => {
    const p = _surahAudio || state.audio.player;
    if (p) p.play().catch(() => {});
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    const p = _surahAudio || state.audio.player;
    if (p) p.pause();
  });
  navigator.mediaSession.setActionHandler('stop', () => mushafStop());
  navigator.mediaSession.setActionHandler('nexttrack', () => advanceToNextSurah());
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    const prev = (state.quran.currentSurah || 1) - 1;
    if (prev >= 1) openSurah(prev).then(() => mushafPlayAll(prev));
  });
}

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
    state.audio.player.onended = null;
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
    // Guard: bail if we've been stopped or a new audio has taken over
    if (state.audio.player !== audio) return;
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

    // Wire interruption-sync handlers for the new pool slot
    nextAudio.onpause = () => {
      if (state.audio.player !== nextAudio) return;
      state.audio.paused = true;
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
      updateMushafPlayBtn(false);
    };
    nextAudio.onplay = () => {
      if (state.audio.player !== nextAudio) return;
      state.audio.paused = false;
      updateMushafPlayBtn(true);
      _registerMediaSession(); // reclaim lock screen after interruption
    };

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
  // Stop previous — use mushafStop() to also clear _surahAudio, otherwise
  // toggleMushafPlayback picks _surahAudio over the new per-ayah player
  if (state.audio.player || _surahAudio) mushafStop();

  // Use preloaded slot if ready, otherwise load now
  if (_poolFor[1 - _poolIdx] === globalNum) _poolIdx = 1 - _poolIdx;
  const audio = _pool[_poolIdx];
  if (_poolFor[_poolIdx] !== globalNum) {
    audio.src = getAyahUrl(globalNum, surahNum, ayahNum);
    audio.load();
    _poolFor[_poolIdx] = globalNum;
  }

  // Keep UI in sync with system-level interruptions (calls, Bluetooth, Siri)
  audio.onpause = () => {
    if (state.audio.player !== audio) return;
    state.audio.paused = true;
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    updateMushafPlayBtn(false);
  };
  audio.onplay = () => {
    if (state.audio.player !== audio) return;
    state.audio.paused = false;
    updateMushafPlayBtn(true);
    _registerMediaSession(); // reclaim lock screen after interruption
  };

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
  // Keep UI state in sync when system interrupts playback (calls, Bluetooth, Siri)
  _surahAudio.onpause = () => {
    if (!_surahAudio) return;
    state.audio.paused = true;
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    updateMushafPlayBtn(false);
  };
  _surahAudio.onplay = () => {
    if (!_surahAudio) return;
    state.audio.paused = false;
    updateMushafPlayBtn(true);
    _registerMediaSession(); // reclaim lock screen after interruption
  };
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
  debouncedPush();
}

function setCatReciter(id) {
  // Stop any playing category ayah audio
  if (state.audio.player) {
    state.audio.player.pause();
    const prevBtn = document.getElementById(`cv-aud-${state.audio.playingId}`);
    if (prevBtn) { prevBtn.textContent = '▶'; prevBtn.classList.remove('cv-playing'); }
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
  }
  setReciter(id);
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
  const cache = state.quran.cache[next];
  if (!cache) return;
  if (state.quran.viewMode === 'page') {
    mushafPlayAll(next);
  } else {
    // Directly invoke playAyah — avoids fragile click() and wires MediaSession
    const first = cache.arData.ayahs[0];
    playAyah(first.number, next, first.numberInSurah);
  }
}

function mushafStop() {
  // Clean up surah-level audio
  if (_surahAudio) {
    _surahAudio.onpause = null; // prevent sync handler from firing during intentional stop
    _surahAudio.onplay  = null;
    _surahAudio.onended = null; // prevent queued ended event from firing after stop
    _surahAudio.removeEventListener('timeupdate', _surahTimeUpdate);
    _surahAudio.pause();
  }
  if (_surahBadge) { _surahBadge.classList.remove('maud-playing'); }
  // Also stop per-ayah pool player if it's different from surahAudio
  if (state.audio.player && state.audio.player !== _surahAudio) {
    state.audio.player.onpause = null;
    state.audio.player.onplay  = null;
    state.audio.player.onended = null; // prevent stale chain from firing
    state.audio.player.pause();
    const prev = document.getElementById(`maud-${state.audio.playingId}`);
    if (prev) prev.classList.remove('maud-playing');
  }
  _surahAudio = null;
  _surahBadge = null;
  _surahTiming = null;
  state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
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
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      updateMushafPlayBtn(true);
      updateMushafPlayerBar();
    }).catch(() => {});
  } else {
    player.pause();
    state.audio.paused = true;
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    updateMushafPlayBtn(false);
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
    if (info) info.textContent = surahName;

    const btn = document.getElementById('mpb-pause-btn');
    if (btn) btn.textContent = state.audio.paused ? '▶' : '⏸';

    _registerMediaSession();
  } else {
    // Clear media session when stopped
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      ['play','pause','stop','nexttrack','previoustrack'].forEach(a => {
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
  _openTafsir.clear();
  const content = document.getElementById('reader-content');
  const bismillah = n !== 9 && n !== 1
    ? `<div class="bismillah">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيم</div>`
    : '';
  const hasBism = n !== 9 && n !== 1;
  const ayahs = arData.ayahs.map((a, i) => {
    const displayText = (hasBism && a.numberInSurah === 1) ? stripBismillah(a.text) : a.text;
    return `
  <div class="ayah ayah-card" id="ayah-${a.numberInSurah}" data-global="${a.number}" data-surah="${n}" data-ayah="${a.numberInSurah}">
    <div class="ayah-card-header">
      <div class="ayah-num-badge-card">${a.numberInSurah}</div>
      <div class="ayah-card-actions">
        <button class="ayah-card-btn" id="aud-${a.number}" onclick="playAyah(${a.number},${n},${a.numberInSurah})" title="Play" data-play>▶</button>
        <button class="ayah-card-btn ${isBookmarked(n, a.numberInSurah) ? 'bookmarked' : ''}" id="bm-${n}-${a.numberInSurah}"
          onclick="toggleBookmark(${n},${a.numberInSurah})" title="Bookmark">
          ${isBookmarked(n, a.numberInSurah) ? '🔖' : '🏷️'}
        </button>
        <button class="ayah-card-btn tafsir-btn" id="tafsir-btn-${n}-${a.numberInSurah}"
          onclick="toggleTafsir(${n},${a.numberInSurah})">Tafsir</button>
        <button class="ayah-card-btn" onclick="shareAyah(${n},${a.numberInSurah})" aria-label="Share">📤</button>
      </div>
    </div>
    <div class="ayah-arabic-card">${esc(displayText)}</div>
    <div class="ayah-english-card">${esc(enData.ayahs[i]?.text ?? '')}</div>
    <div class="tafsir-box" id="tafsir-box-${n}-${a.numberInSurah}" style="display:none"></div>
  </div>`;
  }).join('');
  content.innerHTML = bismillah + ayahs;

  // Track reading position — delayed to skip the initial-render intersection fire
  // so the scroll-restore has time to settle before we start recording position
  if (_ayahObserver) _ayahObserver.disconnect();
  _ayahObserver = null;
  setTimeout(() => {
    if (!content.isConnected) return; // reader was closed before timer fired
    _ayahObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .map(e => parseInt(e.target.dataset.ayah, 10))
        .filter(a => !isNaN(a));
      if (!visible.length) return;
      const firstVisible = visible.reduce((a, b) => a < b ? a : b);
      try {
        const lr = JSON.parse(localStorage.getItem('huda_last_read') || 'null');
        if (lr) { lr.ayah = firstVisible; localStorage.setItem('huda_last_read', JSON.stringify(lr)); }
      } catch(e) { console.warn('[huda] failed to save reading position', e); }
    }, { threshold: 0.5 });
    content.querySelectorAll('.ayah').forEach(el => _ayahObserver.observe(el));
  }, 650);
}

function shareAyah(surahNum, ayahNum) {
  const cached = state.quran.cache[surahNum];
  if (!cached) return;
  const ar = cached.arData.ayahs[ayahNum - 1].text;
  const en = cached.enData.ayahs[ayahNum - 1].text;
  const surahName = SURAHS[surahNum - 1][2]; // index 2 = English name e.g. "Al-Fatiha"
  const ref = `Surah ${surahName} (${surahNum}:${ayahNum})`;
  _pendingShareText = `${ar}\n\n${en}\n\n— ${ref}`;
  openShareSheet(ref);
}

function openShareSheet(title) {
  let overlay = document.getElementById('share-sheet-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'share-sheet-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="share-sheet-backdrop" onclick="closeShareSheet()"></div>
    <div class="share-sheet">
      <div class="share-sheet-handle"></div>
      <div class="share-sheet-text">${esc(_pendingShareText)}</div>
      <div class="share-sheet-actions">
        <button class="share-action-btn" onclick="copyShareText()">📋 Copy</button>
        ${navigator.share ? `<button class="share-action-btn share-action-primary" onclick="nativeShare()">📤 Share</button>` : ''}
      </div>
      <button class="share-close-btn" onclick="closeShareSheet()">Close</button>
    </div>
  `;
  overlay.style.display = 'flex';
  requestAnimationFrame(() => {
    const sheet = overlay.querySelector('.share-sheet');
    if (sheet) sheet.classList.add('open');
  });
}

function closeShareSheet() {
  const overlay = document.getElementById('share-sheet-overlay');
  if (!overlay) return;
  const sheet = overlay.querySelector('.share-sheet');
  if (sheet) sheet.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
}

async function copyShareText() {
  try {
    await navigator.clipboard.writeText(_pendingShareText);
  } catch(e) {
    const ta = document.createElement('textarea');
    ta.value = _pendingShareText;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  showCopyToast();
}

async function nativeShare() {
  try {
    await navigator.share({ text: _pendingShareText });
  } catch(e) {
    // User cancelled or share not supported — silent
  }
}

function showCopyToast() {
  let toast = document.getElementById('copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'copy-toast';
    toast.className = 'copy-toast';
    toast.textContent = 'Copied!';
    document.body.appendChild(toast);
  }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── Long-press mushaf ayah to play from that point ───────────
let _lpTimer = null;
let _lpStartX = 0, _lpStartY = 0;
let _lpFired = false;      // true if the touch became a long-press (suppress click)
let _pendingPlay = null;
let _mushafFromAyah = null; // ayah numberInSurah to restore when returning to mushaf

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
    _lpFired = false;
    const anum = e.target.closest('.mushaf-anum');
    if (!anum) return;
    _lpStartX = e.touches[0].clientX;
    _lpStartY = e.touches[0].clientY;
    _lpTimer = setTimeout(() => {
      _lpFired = true;
      _lpTimer = null;
      haptic(60);
      const wrap = anum.closest('.mushaf-ayah-wrap');
      flashAyahEl(wrap);
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
    flashAyahEl(wrap);
    showAyahPopup(g, +wrap.dataset.surah, +wrap.dataset.ayah, anum);
  });

  // Short tap on ayah number → switch to study view at that ayah
  container.addEventListener('click', e => {
    if (_lpFired) { _lpFired = false; return; } // was a long-press, skip
    const anum = e.target.closest('.mushaf-anum');
    if (!anum) return;
    const wrap = anum.closest('.mushaf-ayah-wrap');
    if (!wrap) return;
    switchToStudyAtAyah(+wrap.dataset.surah, +wrap.dataset.ayah);
  });
}

function switchToStudyAtAyah(surahNum, ayahNum) {
  _mushafFromAyah = ayahNum; // remember position for round-trip
  setQuranView('verse');
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
    <button class="ayah-popup-study" onclick="confirmViewMushafAyah()">☰&nbsp; View translation</button>
  `;
  popup.style.display = 'block';
  const rect = anchorEl.getBoundingClientRect();
  const pw = 180, ph = 110;
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

function confirmViewMushafAyah() {
  if (!_pendingPlay) return;
  const { surahNum, ayahNum } = _pendingPlay;
  hideAyahPopup();
  switchToStudyAtAyah(surahNum, ayahNum);
}

function flashAyahEl(el) {
  el.classList.add('ayah-flash');
  setTimeout(() => el.classList.remove('ayah-flash'), 600);
}

function flashAyah(ayahNum) {
  // Small delay to ensure DOM is rendered and scroll has settled
  setTimeout(() => {
    const el = document.getElementById(`ayah-${ayahNum}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Add flash class after scroll starts
    setTimeout(() => {
      el.classList.add('flashing');
      el.addEventListener('animationend', () => el.classList.remove('flashing'), { once: true });
    }, 400);
  }, 300);
}

function closeQuranReader() {
  mushafStop();
  if (_ayahObserver) { _ayahObserver.disconnect(); _ayahObserver = null; }
  document.getElementById('quran-reader').style.display = 'none';
  document.getElementById('quran-list-view').style.display = 'block';
  state.quran.currentSurah = null;
}


// ── Quran Thematic Categories ─────────────────────────────────
function _renderQuranThemes() {
  const el = document.getElementById('quran-themes-section');
  if (!el) return;
  el.innerHTML = `
    <div style="padding:14px 16px 6px">
      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">Browse by Theme</div>
      <div class="qcat-grid">
        ${QURAN_CATEGORIES.map(c => `
          <button class="qcat-tile" onclick="openCategoryView('${c.id}')" style="--cat-color:${c.color}">
            <span class="qcat-icon">${c.icon}</span>
            <span class="qcat-label">${c.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function openCategoryView(id) {
  const cat = QURAN_CATEGORIES.find(c => c.id === id);
  if (!cat) return;
  const listView = document.getElementById('quran-list-view');
  let cv = document.getElementById('quran-category-view');
  if (!cv) {
    cv = document.createElement('div');
    cv.id = 'quran-category-view';
    listView.parentNode.insertBefore(cv, listView);
  }
  listView.style.display = 'none';
  cv.style.display = 'flex';
  cv.style.flexDirection = 'column';
  cv.style.height = '100%';
  cv.innerHTML = `
    <div class="page-header" style="flex-shrink:0">
      <button class="back-btn" onclick="closeCategoryView()">←</button>
      <div style="flex:1;min-width:0;overflow:hidden">
        <h2 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cat.icon} ${cat.label}</h2>
      </div>
      <select class="hdr-reciter-select" onchange="setCatReciter(this.value)">
        ${RECITERS.map(r => `<option value="${r.id}" ${state.reciter === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
      </select>
    </div>
    <div id="cv-verse-list" style="overflow-y:auto;flex:1;padding:12px 16px 80px">
      ${cat.verses.map(() => `<div class="cv-skeleton"></div>`).join('')}
    </div>
  `;
  _loadCategoryVerses(cat);
}

function closeCategoryView() {
  const cv = document.getElementById('quran-category-view');
  if (cv) cv.style.display = 'none';
  const listView = document.getElementById('quran-list-view');
  if (listView) listView.style.display = 'block';
}

async function _loadCategoryVerses(cat) {
  const container = document.getElementById('cv-verse-list');
  if (!container) return;

  const results = await Promise.all(cat.verses.map(async ({s, a}) => {
    const cacheKey = `huda_cv_${s}_${a}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/quran-uthmani,en.sahih`);
      const json = await res.json();
      if (json.code !== 200) return null;
      const [ar, en] = json.data;
      const entry = { s, a, arabic: ar.text, english: en.text, surahName: ar.surah.englishName };
      try { localStorage.setItem(cacheKey, JSON.stringify(entry)); } catch(e) {}
      return entry;
    } catch(e) { return null; }
  }));

  if (!document.getElementById('cv-verse-list')) return; // user navigated away

  container.innerHTML = results.map(v => {
    if (!v) return '';
    const gn = globalAyahNum(v.s, v.a);
    return `
      <div class="cv-verse-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="cv-ref">${esc(v.surahName)} ${v.s}:${v.a}</div>
          <button class="cv-play-btn" id="cv-aud-${gn}"
            onclick="event.stopPropagation();playCatAyah(${gn},${v.s},${v.a})">▶</button>
        </div>
        <div class="cv-arabic">${esc(v.arabic)}</div>
        <div class="cv-english">${esc(v.english)}</div>
      </div>
    `;
  }).join('');
}

function openSurahFromCategory(s, a) {
  closeCategoryView();
  openSurah(s, a);
}

// ── Quran Search ──────────────────────────────────────────────
function openQuranSearch() {
  state.quran.searchOpen = true;
  state.quran.searchQuery = '';
  const listView = document.getElementById('quran-list-view');
  if (!listView) return;
  let sv = document.getElementById('quran-search-view');
  if (!sv) {
    sv = document.createElement('div');
    sv.id = 'quran-search-view';
    listView.parentNode.insertBefore(sv, listView);
  }
  listView.style.display = 'none';
  sv.style.display = 'block';
  sv.innerHTML = `
    <div class="qs-header" style="padding-top:calc(16px + env(safe-area-inset-top,0px))">
      <button class="back-btn" onclick="closeQuranSearch()">←</button>
      <h2>Search Quran</h2>
    </div>
    <div class="qs-input-wrap">
      <input class="qs-input" id="qs-input" placeholder="Search in English translation..."
        oninput="scheduleQuranSearch(this.value)" autocomplete="off">
    </div>
    <div id="qs-results" class="qs-results">
      <p class="qs-hint">Type at least 2 characters to search</p>
    </div>
  `;
  document.getElementById('qs-input')?.focus();
}

function closeQuranSearch() {
  state.quran.searchOpen = false;
  const sv = document.getElementById('quran-search-view');
  if (sv) sv.style.display = 'none';
  const listView = document.getElementById('quran-list-view');
  if (listView) listView.style.display = 'block';
}

function scheduleQuranSearch(query) {
  state.quran.searchQuery = query;
  clearTimeout(_searchDebounce);
  if (query.length < 2) {
    document.getElementById('qs-results').innerHTML = `<p class="qs-hint">Type at least 2 characters to search</p>`;
    return;
  }
  _searchDebounce = setTimeout(() => runQuranSearch(query), 400);
}

async function runQuranSearch(query) {
  const results = document.getElementById('qs-results');
  if (!results) return;
  results.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en.sahih`);
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    if (!state.quran.searchOpen || query !== state.quran.searchQuery) return; // stale/closed
    const matches = json.data?.matches ?? [];
    if (matches.length === 0) {
      results.innerHTML = `<p class="qs-hint">No results for '<strong>${esc(query)}</strong>'</p>`;
      return;
    }
    const truncated = matches.length === 60;
    results.innerHTML = matches.map(m => {
      const surahNum = m.surah.number;
      const ayahNum = m.numberInSurah;
      const surahName = m.surah.englishName;
      const snippet = esc(m.text);
      return `
        <div class="qs-result" onclick="selectSearchResult(${surahNum},${ayahNum})">
          <div class="qs-result-meta">
            <span class="qs-surah-name">${esc(surahName)}</span>
            <span class="qs-ayah-badge">${ayahNum}</span>
          </div>
          <div class="qs-snippet">${snippet}</div>
        </div>`;
    }).join('') + (truncated ? `<p class="qs-truncated">Showing top 60 results — try a more specific search.</p>` : '');
  } catch(e) {
    results.innerHTML = `<p class="qs-hint">Search unavailable — check your connection</p>`;
  }
}

function selectSearchResult(surahNum, ayahNum) {
  state.quran.viewMode = 'verse'; // ensure ayah-N id elements are rendered for scroll
  closeQuranSearch();
  openSurah(surahNum, ayahNum);
}

// ── Tafsir ────────────────────────────────────────────────────
async function toggleTafsir(surah, ayah) {
  const key = `${surah}:${ayah}`;
  const boxId = `tafsir-box-${surah}-${ayah}`;
  const btnId = `tafsir-btn-${surah}-${ayah}`;
  const box = document.getElementById(boxId);
  const btn = document.getElementById(btnId);
  if (!box || !btn) return;

  if (_openTafsir.has(key)) {
    _openTafsir.delete(key);
    box.style.display = 'none';
    btn.textContent = 'Tafsir ›';
    return;
  }

  _openTafsir.add(key);
  btn.textContent = 'Hide Tafsir';
  box.style.display = 'block';
  box.innerHTML = '<div class="spinner" style="margin:8px auto"></div>';

  // Check cache first
  let text;
  try {
    const cache = JSON.parse(localStorage.getItem(`huda_tafsir_k_${surah}`) || '{}');
    if (cache[ayah]) {
      text = cache[ayah];
    } else {
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.maududi`);
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      text = json.data?.text;
      if (text) {
        cache[ayah] = text;
        try { localStorage.setItem(`huda_tafsir_k_${surah}`, JSON.stringify(cache)); } catch(e) {}
      }
    }
  } catch(e) {
    text = null;
  }

  // Stale check — user may have closed the box while loading
  if (!_openTafsir.has(key)) return;

  box.innerHTML = text
    ? `<p class="tafsir-text">${esc(text)}</p>`
    : `<p class="tafsir-error">Tafsir temporarily unavailable.</p>`;
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

