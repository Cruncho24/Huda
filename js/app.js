/* ============================================================
   HUDA PWA — App Logic
   ============================================================ */

// ── Security: HTML escape ────────────────────────────────────
// Escapes untrusted strings before inserting into innerHTML.
// Use on any value sourced from external APIs or localStorage.
function showToast(msg) {
  let t = document.getElementById('huda-toast');
  if (!t) { t = document.createElement('div'); t.id = 'huda-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── Reciters ──────────────────────────────────────────────────
const RECITERS = [
  { id: 'ar.alafasy',        name: 'Mishary Alafasy',      qurancdnId: 7 },
  {
    id: 'ar.mahermuaiqly', name: 'Maher Al-Muqaili', qurancdnId: 159,
    surahUrl: n => `https://download.quranicaudio.com/quran/maher_almu3aiqly/year1440//${String(n).padStart(3,'0')}.mp3`,
    perAyahUrl: (s, a) => `https://everyayah.com/data/MaherAlMuaiqly128kbps/${String(s).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,
  },
  {
    id: 'ar.abdullahbasfar', name: 'Abdullah Basfar', qurancdnId: 163,
    surahUrl: n => `https://download.quranicaudio.com/quran/abdullaah_basfar//${String(n).padStart(3,'0')}.mp3`,
    perAyahUrl: (s, a) => `https://everyayah.com/data/Abdullah_Basfar_192kbps/${String(s).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,
  },
  {
    id: 'ar.yasserdossari', name: 'Yasser Al-Dosari', qurancdnId: 97,
    surahUrl: n => `https://download.quranicaudio.com/quran/yasser_ad-dussary//${String(n).padStart(3,'0')}.mp3`,
    // cdn.islamic.network returns 403 for this reciter's per-ayah files
    perAyahUrl: (s, a) => `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${String(s).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,
  },
  {
    id: 'ar.abdurrahmanalsudais', name: 'Abdurrahman Al-Sudais', qurancdnId: 3,
    surahUrl: n => `https://server11.mp3quran.net/sds/${String(n).padStart(3,'0')}.mp3`,
    perAyahUrl: (s, a) => `https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${String(s).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,
  },
  {
    id: 'ar.shuraim', name: 'Saud Al-Shuraim', qurancdnId: 10,
    surahUrl: n => `https://server7.mp3quran.net/shur/${String(n).padStart(3,'0')}.mp3`,
    perAyahUrl: (s, a) => `https://everyayah.com/data/Saood_ash-Shuraym_128kbps/${String(s).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,
  },
  {
    id: 'ar.juhany', name: 'Abdullah Al-Juhani', qurancdnId: 162,
    surahUrl: n => `https://download.quranicaudio.com/quran/abdullaah_3awwaad_al-juhaynee//${String(n).padStart(3,'0')}.mp3`,
    perAyahUrl: (s, a) => `https://everyayah.com/data/Abdullaah_3awwaad_Al-Juhaynee_128kbps/${String(s).padStart(3,'0')}${String(a).padStart(3,'0')}.mp3`,
  },
];

// Compute global ayah number (1-6236) from surah + ayah-in-surah
function globalAyahNum(surahNum, ayahNum) {
  let n = 0;
  for (let i = 0; i < surahNum - 1; i++) n += SURAHS[i][4];
  return n + ayahNum;
}

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
  dhikrCounts: (() => { try { return JSON.parse(localStorage.getItem('huda_dhikr') || '{}'); } catch(e) { return {}; } })(),
  hadithIndex: (() => { const d = new Date(); return (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % (typeof HADITHS !== 'undefined' ? HADITHS.length : 40); })(),
  darkMode: localStorage.getItem('huda_dark') === '1',
  fontSize: parseInt(localStorage.getItem('huda_fontsize') || '28') || 28,
  bookmarks: (() => { try { return JSON.parse(localStorage.getItem('huda_bookmarks') || '[]'); } catch(e) { return []; } })(),
  surahBookmarks: (() => { try { return JSON.parse(localStorage.getItem('huda_surah_bm') || '[]'); } catch(e) { return []; } })(),
  reciter: localStorage.getItem('huda_reciter') || 'ar.alafasy',
  audio: { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false },
  prayer: {
    times: null, location: null, qibla: null, city: '',
    countdownInterval: null, ramadanInterval: null, homeInterval: null,
    compassOpen: false,
  },
  quran: {
    currentSurah: null,
    cache: (() => { try { return JSON.parse(localStorage.getItem('huda_quran') || '{}'); } catch(e) { return {}; } })(),
    filteredSurahs: [...SURAHS],
    viewMode: 'verse',
    currentPage: 0,
    timings: {},
    searchOpen: false,
    searchQuery: '',
  },
  learn: {
    currentSection: null, currentLesson: null,
    currentDuaCategory: null, currentDuaIndex: 0,
    currentNameIndex: null, currentLetterIndex: null, hajjTab: 'umrah',
    zakat: { currency: 'USD', nisab: 'gold' },
  },
  tasbeeh: parseInt(localStorage.getItem('huda_tasbeeh') || '0') || 0,
  plan: (() => { try { return JSON.parse(localStorage.getItem('huda_plan') || 'null'); } catch(e) { return null; } })(),
  calendar: { displayYear: null, displayMonth: null },
};

// ── Auth Modal ────────────────────────────────────────────────
function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  const user = authGetCachedUser();
  renderAuthModalBody(user ? 'account' : 'signin', user);
}

function closeAuthModal(e) {
  if (e && e.target !== document.getElementById('auth-modal')) return;
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
}

function renderAuthModalBody(mode = 'signin', user = null) {
  const el = document.getElementById('auth-modal-body');
  if (!el) return;
  if (mode === 'account' && user) {
    el.innerHTML = `
      <div class="auth-modal-title">👤 Account</div>
      <div class="auth-user-email">${esc(user.email)}</div>
      <div class="sync-status">✓ Synced across devices</div>
      <br>
      <button class="auth-btn-secondary" onclick="handleSignOut()">Sign out</button>
    `;
  } else if (mode === 'signup') {
    el.innerHTML = `
      <div class="auth-modal-title">Create Account</div>
      <input id="auth-email" class="auth-input" type="email" placeholder="Email" autocomplete="email">
      <div class="auth-pass-wrap">
        <input id="auth-pass" class="auth-input" type="password" placeholder="Password (min 6 chars)" autocomplete="new-password">
        <button type="button" class="auth-pass-eye" onclick="togglePassVisibility()" title="Show/hide password">👁</button>
      </div>
      <div id="auth-err" class="auth-error" style="display:none"></div>
      <button class="auth-btn-primary" onclick="handleSignUp()">Create Account</button>
      <div class="auth-switch-link">Already have an account? <a onclick="renderAuthModalBody('signin')">Sign in</a></div>
    `;
  } else if (mode === 'reset') {
    el.innerHTML = `
      <div class="auth-modal-title">Reset Password</div>
      <input id="auth-email" class="auth-input" type="email" placeholder="Email" autocomplete="email">
      <div id="auth-err" class="auth-error" style="display:none"></div>
      <button class="auth-btn-primary" onclick="handleResetRequest()">Send Reset Link</button>
      <div class="auth-switch-link"><a onclick="renderAuthModalBody('signin')">← Back to sign in</a></div>
    `;
  } else {
    el.innerHTML = `
      <div class="auth-modal-title">Sign In</div>
      <input id="auth-email" class="auth-input" type="email" placeholder="Email" autocomplete="email">
      <div class="auth-pass-wrap">
        <input id="auth-pass" class="auth-input" type="password" placeholder="Password" autocomplete="current-password">
        <button type="button" class="auth-pass-eye" onclick="togglePassVisibility()" title="Show/hide password">👁</button>
      </div>
      <div id="auth-err" class="auth-error" style="display:none"></div>
      <button class="auth-btn-primary" onclick="handleSignIn()">Sign In</button>
      <div class="auth-switch-link">No account? <a onclick="renderAuthModalBody('signup')">Create one</a></div>
      <div class="auth-switch-link" style="margin-top:6px"><a onclick="renderAuthModalBody('reset')">Forgot password?</a></div>
    `;
  }
}

async function handleSignIn() {
  const email = document.getElementById('auth-email')?.value?.trim();
  const pass  = document.getElementById('auth-pass')?.value;
  const btn   = document.querySelector('.auth-btn-primary');
  if (!email || !pass) { showAuthError('Please fill in all fields.'); return; }
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    await authSignIn(email, pass);
    haptic(50);
    document.getElementById('auth-modal').style.display = 'none';
  } catch(e) {
    showAuthError(e.message || 'Sign in failed.');
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

async function handleSignUp() {
  const email = document.getElementById('auth-email')?.value?.trim();
  const pass  = document.getElementById('auth-pass')?.value;
  const btn   = document.querySelector('.auth-btn-primary');
  if (!email || !pass) { showAuthError('Please fill in all fields.'); return; }
  if (pass.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
  btn.disabled = true; btn.textContent = 'Creating…';
  try {
    const { session } = await authSignUp(email, pass);
    if (!session) {
      // Email confirmation required — show instructions instead of closing
      document.getElementById('auth-modal-body').innerHTML = `
        <div class="auth-modal-title">Check your email</div>
        <div class="auth-user-email">We sent a confirmation link to <strong>${esc(email)}</strong>.<br><br>Click the link in the email to activate your account, then sign in.</div>
      `;
    } else {
      document.getElementById('auth-modal').style.display = 'none';
    }
  } catch(e) {
    showAuthError(e.message || 'Sign up failed.');
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

async function handleSignOut() {
  await authSignOut();
  haptic(50);
  document.getElementById('auth-modal').style.display = 'none';
  updateAccountBtn(null);
}

async function handleResetRequest() {
  const email = document.getElementById('auth-email')?.value?.trim();
  const btn   = document.querySelector('.auth-btn-primary');
  if (!email) { showAuthError('Please enter your email.'); return; }
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    await authResetPassword(email);
    document.getElementById('auth-modal-body').innerHTML = `
      <div class="auth-modal-title">Check your email</div>
      <div class="auth-user-email">We sent a password reset link to <strong>${esc(email)}</strong>. Click the link to set a new password.</div>
      <div class="auth-switch-link" style="margin-top:16px"><a onclick="renderAuthModalBody('signin')">← Back to sign in</a></div>
    `;
  } catch(e) {
    showAuthError(e.message || 'Failed to send reset email.');
    btn.disabled = false; btn.textContent = 'Send Reset Link';
  }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-err');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function togglePassVisibility() {
  const inp = document.getElementById('auth-pass');
  const btn = document.querySelector('.auth-pass-eye');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (btn) btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

function updateAccountBtn(user) {
  const btn = document.getElementById('account-btn');
  if (!btn) return;
  btn.title = user ? `Signed in as ${user.email}` : 'Settings';
}


// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyDarkMode();
  checkDhikrReset();
  // Pre-load cached prayer times so home live cards appear immediately
  const _cp = localStorage.getItem('huda_prayer');
  if (_cp) { try { const p = JSON.parse(_cp); state.prayer.times = p.times; state.prayer.city = p.city || ''; state.prayer.qibla = p.qibla; if (p.lat && p.lng) state.prayer.location = { lat: p.lat, lng: p.lng }; } catch(e) {} }
  setupNav();
  renderHome();
  fetchAndCacheHijri(new Date());
  registerSW();
  setupInstallPrompt();

  // Handle notification tap — open to specific tab (whitelist to prevent invalid state)
  const _notifTab = new URLSearchParams(location.search).get('tab');
  if (_notifTab && ['home','quran','prayer','dhikr','duas','learn'].includes(_notifTab)) switchTab(_notifTab);

  // When user opens the app from the background while audio is actively playing,
  // jump to the Quran tab and scroll to the current ayah.
  // When returning to the app while Quran is playing (or paused mid-surah),
  // navigate to the exact ayah so user can see + control what's playing.
  // Guard: only navigate after 5s hidden to avoid interrupting quick app switches.
  let _hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { _hiddenAt = Date.now(); return; }
    if (Date.now() - _hiddenAt < 5000) return; // brief switch — don't navigate

    if (!state.audio.playingSurah) return; // nothing ever played — nothing to surface
    // If audio was interrupted/paused by another app, show the home screen
    // with the "Continue Listening" card instead of forcing user to Quran tab.
    if (state.audio.paused) { switchTab('home'); return; }

    // Audio is actively playing — navigate to the current ayah so user can see/control it
    const sn = state.audio.playingSurah;
    const an = state.audio.playingAyah || 1;

    // Switch to Quran tab if needed
    if (state.activeTab !== 'quran') switchTab('quran');

    // If we're on a different surah (or list view), navigate there.
    // openSurah calls mushafStop(), so capture playback state first and resume after.
    if (state.quran.currentSurah !== sn) {
      const wasPlayingAyah = state.audio.playingAyah;
      const wasPlayingSurah = sn;
      const wasPageMode = state.quran.viewMode === 'page';
      openSurah(sn, an).then(() => {
        const cache = state.quran.cache[wasPlayingSurah];
        if (!cache) return;
        if (wasPageMode) {
          mushafPlayAll(wasPlayingSurah);
        } else {
          const ayahObj = cache.arData.ayahs.find(a => a.numberInSurah === wasPlayingAyah) || cache.arData.ayahs[0];
          playAyah(ayahObj.number, wasPlayingSurah, ayahObj.numberInSurah);
        }
      });
      return;
    }

    // Already on the right surah — just scroll to the current ayah
    setTimeout(() => {
      if (state.quran.viewMode === 'page') {
        const badge = document.getElementById(`maud-${state.audio.playingId}`);
        if (badge) badge.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const card = document.getElementById(`ayah-${an}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  });

  // Auth — fires on sign-in, sign-out, and page reload with existing session
  authOnChange(async user => {
    updateAccountBtn(user);
    // If the modal is open (e.g. showing "Check your email"), update it
    const modal = document.getElementById('auth-modal');
    if (modal && modal.style.display !== 'none') {
      renderAuthModalBody(user ? 'account' : 'signin', user);
    }
    if (user) {
      const changed = await pullSync();
      if (changed) {
        applySyncedState();
        renderHome();
        if (state.activeTab && state.activeTab !== 'home') {
          switchTab(state.activeTab);
        }
      }
      await pushSync();
    }
  });
});

// ── Dark Mode ─────────────────────────────────────────────────
function applyDarkMode() {
  document.documentElement.classList.toggle('dark', state.darkMode);
}
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  localStorage.setItem('huda_dark', state.darkMode ? '1' : '0');
  applyDarkMode();
  haptic();
  debouncedPush();
}

// ── Haptic ────────────────────────────────────────────────────
function haptic(ms = 30) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

// ── Daily Dhikr Reset ─────────────────────────────────────────
function checkDhikrReset() {
  const today = new Date().toDateString();
  if (localStorage.getItem('huda_dhikr_date') !== today) {
    // Save yesterday's counts to history before clearing
    const savedDate = localStorage.getItem('huda_dhikr_date');
    if (savedDate && Object.keys(state.dhikrCounts).some(k => state.dhikrCounts[k] > 0)) {
      const d = new Date(savedDate);
      d.setHours(12, 0, 0, 0); // force local noon to avoid DST/UTC-offset edge cases
      if (!isNaN(d.getTime())) {
        const histKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        try {
          const history = JSON.parse(localStorage.getItem('huda_dhikr_history') || '{}');
          history[histKey] = { ...state.dhikrCounts };
          localStorage.setItem('huda_dhikr_history', JSON.stringify(history));
          localStorage.setItem('_sync_ts_huda_dhikr_history', String(Date.now()));
          _invalidateHistoryCache();
        } catch(e) {}
      }
    }
    state.dhikrCounts = {};
    localStorage.setItem('huda_dhikr', '{}');
    localStorage.setItem('huda_dhikr_date', today);
  }
}

// ── Bookmarks ─────────────────────────────────────────────────
function toggleBookmark(surahNum, ayahNum) {
  const idx = state.bookmarks.findIndex(b => b.s === surahNum && b.a === ayahNum);
  if (idx >= 0) {
    state.bookmarks.splice(idx, 1);
  } else {
    // Look up Arabic text from in-memory cache (always populated when reader is open)
    const cached = state.quran.cache[surahNum];
    const ayahData = cached?.quran?.ayahs?.find(a => a.numberInSurah === ayahNum);
    const arText = ayahData?.text?.slice(0, 80) || '';
    state.bookmarks.unshift({ s: surahNum, a: ayahNum, ar: arText });
  }
  localStorage.setItem('huda_bookmarks', JSON.stringify(state.bookmarks));
  localStorage.setItem('_sync_ts_huda_bookmarks', String(Date.now())); // prevent pull overwrite during debounce
  haptic();
  debouncedPush();
  // refresh bookmark btn
  const btn = document.getElementById(`bm-${surahNum}-${ayahNum}`);
  if (btn) {
    btn.textContent = isBookmarked(surahNum, ayahNum) ? '🔖' : '🏷️';
    btn.classList.toggle('bookmarked', isBookmarked(surahNum, ayahNum));
  }
}
function isBookmarked(s, a) { return state.bookmarks.some(b => b.s === s && b.a === a); }
function removeBookmark(s, a) {
  state.bookmarks = state.bookmarks.filter(b => !(b.s === s && b.a === a));
  localStorage.setItem('huda_bookmarks', JSON.stringify(state.bookmarks));
  localStorage.setItem('_sync_ts_huda_bookmarks', String(Date.now())); // prevent pull overwrite during debounce
  haptic();
  debouncedPush();
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
  haptic();
  debouncedPush();
  const isNowBm = isSurahBookmarked(num);
  // refresh button in surah list if visible
  const btn = document.getElementById(`sbm-${num}`);
  if (btn) btn.textContent = isNowBm ? '🔖' : '🏷️';
  // refresh button in reader header if open on this surah
  const rbm = document.getElementById('reader-bm-btn');
  if (rbm && state.quran.currentSurah === num) rbm.textContent = isNowBm ? '🔖' : '🏷️';
  if (state.activeTab === 'home') renderHome();
}
function toggleReaderBookmark() {
  if (state.quran.currentSurah) toggleSurahBookmark(state.quran.currentSurah);
}
function removeSurahBookmark(num) {
  state.surahBookmarks = state.surahBookmarks.filter(n => n !== num);
  localStorage.setItem('huda_surah_bm', JSON.stringify(state.surahBookmarks));
  haptic();
  debouncedPush();
  const btn = document.getElementById(`sbm-${num}`);
  if (btn) btn.textContent = '🏷️';
  renderHome();
}

// ── Audio position persistence ────────────────────────────────
// Saves current playback position so the app can resume after reload/reopen.
function saveAudioPos() {
  const { playingSurah, playingAyah, playingId } = state.audio;
  if (!playingSurah) return;
  try {
    localStorage.setItem('huda_audio_pos', JSON.stringify({
      surah: playingSurah,
      ayah: playingAyah || 1,
      globalNum: playingId,
      mode: state.quran.viewMode,
      reciter: state.reciter,
      ts: Date.now(),
    }));
  } catch(e) {}
}

function clearAudioPos() {
  localStorage.removeItem('huda_audio_pos');
}

// Called from "Continue Listening" card on home screen
function resumeAudioPos() {
  let pos;
  try { pos = JSON.parse(localStorage.getItem('huda_audio_pos') || 'null'); } catch(e) {}
  if (!pos?.surah) return;
  if (pos.reciter) { state.reciter = pos.reciter; localStorage.setItem('huda_reciter', pos.reciter); }
  if (pos.mode) state.quran.viewMode = pos.mode;
  switchTab('quran');
  setTimeout(() => {
    openSurah(pos.surah, pos.ayah).then(() => {
      const cache = state.quran.cache[pos.surah];
      if (!cache) return;
      if (pos.mode === 'page') {
        const ayahObj = cache.arData.ayahs.find(a => a.numberInSurah === pos.ayah) || cache.arData.ayahs[0];
        // Always use playMushafAyah so we resume at the saved ayah, not from ayah 1
        if (ayahObj) playMushafAyah(ayahObj.number, pos.surah, ayahObj.numberInSurah);
        else mushafPlayAll(pos.surah); // no cache entry at all — last resort
      } else {
        const ayahObj = cache.arData.ayahs.find(a => a.numberInSurah === pos.ayah) || cache.arData.ayahs[0];
        if (ayahObj) playAyah(ayahObj.number, pos.surah, ayahObj.numberInSurah);
      }
    });
  }, 100);
}

// ── Audio ─────────────────────────────────────────────────────
function playAyah(globalNum, surahNum, ayahNum) {
  const btnId = `aud-${globalNum}`;
  if (state.audio.player) {
    state.audio.player.pause();
    const prev = document.getElementById(`aud-${state.audio.playingId}`);
    if (prev) { prev.textContent = '▶'; prev.classList.remove('playing'); }
    const prevCard = document.getElementById(`ayah-${state.audio.playingAyah}`);
    if (prevCard) prevCard.classList.remove('maud-playing-card');
    if (state.audio.playingId === globalNum) {
      state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
      clearAudioPos();
      return;
    }
  }
  const audio = new Audio(getAyahUrl(globalNum, surahNum, ayahNum));
  state.audio = { player: audio, playingId: globalNum, playingSurah: surahNum, playingAyah: ayahNum, paused: false };
  saveAudioPos();
  const btn = document.getElementById(btnId);
  if (btn) { btn.textContent = '⏸'; btn.classList.add('playing'); }
  const card = document.getElementById(`ayah-${ayahNum}`);
  if (card) card.classList.add('maud-playing-card');

  // Sync state with system-level interruptions (calls, Bluetooth, Siri, other devices)
  audio.onpause = () => {
    if (state.audio.player !== audio) return;
    state.audio.paused = true;
    const b = document.getElementById(`aud-${globalNum}`);
    if (b) b.textContent = '▶'; // show resume button so user knows it's paused
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  };
  audio.onplay = () => {
    if (state.audio.player !== audio) return;
    state.audio.paused = false;
    const b = document.getElementById(`aud-${globalNum}`);
    if (b) b.textContent = '⏸';
    _registerMediaSession(); // reclaim lock screen after another app interrupts
  };

  // Lock screen / AirPods controls
  _registerMediaSession();

  audio.play().catch(() => {
    if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
    if (card) card.classList.remove('maud-playing-card');
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
    showToast('Audio unavailable — check connection');
  });

  const _advanceStudy = () => {
    const b = document.getElementById(`aud-${globalNum}`);
    if (b) { b.textContent = '▶'; b.classList.remove('playing'); }
    if (card) card.classList.remove('maud-playing-card');
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
    // Chain to next ayah — look up surah/ayah from DOM rather than fragile .click()
    const nextBtn = document.getElementById(`aud-${globalNum + 1}`);
    if (nextBtn) {
      const parentCard = nextBtn.closest('.ayah');
      const ns = parentCard ? +parentCard.dataset.surah : surahNum;
      const na = parentCard ? +parentCard.dataset.ayah : ayahNum + 1;
      playAyah(globalNum + 1, ns, na);
    } else {
      advanceToNextSurah();
    }
  };
  audio.onended = _advanceStudy;
  audio.onerror = _advanceStudy;
}

// Play a single ayah from the category view — no chaining when done
function playCatAyah(globalNum, surahNum, ayahNum) {
  const btnId = `cv-aud-${globalNum}`;
  if (state.audio.player) {
    state.audio.player.pause();
    // Reset whichever button is active (study or category view)
    const prevStudy = document.getElementById(`aud-${state.audio.playingId}`);
    if (prevStudy) { prevStudy.textContent = '▶'; prevStudy.classList.remove('playing'); }
    const prevCat = document.getElementById(`cv-aud-${state.audio.playingId}`);
    if (prevCat) { prevCat.textContent = '▶'; prevCat.classList.remove('cv-playing'); }
    if (state.audio.playingId === globalNum) {
      state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
      clearAudioPos();
      return;
    }
  }
  const audio = new Audio(getAyahUrl(globalNum, surahNum, ayahNum));
  state.audio = { player: audio, playingId: globalNum, playingSurah: surahNum, playingAyah: ayahNum, paused: false };
  const btn = document.getElementById(btnId);
  if (btn) { btn.textContent = '⏸'; btn.classList.add('cv-playing'); }
  audio.play().catch(() => {
    if (btn) { btn.textContent = '▶'; btn.classList.remove('cv-playing'); }
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
    showToast('Audio unavailable — check connection');
  });
  const reset = () => {
    if (btn) { btn.textContent = '▶'; btn.classList.remove('cv-playing'); }
    state.audio = { player: null, playingId: null, playingSurah: null, playingAyah: null, paused: false };
    clearAudioPos();
  };
  audio.onended = reset;
  audio.onerror = reset;
}

// ── Navigation ────────────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // Full keyboard support
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return; // let browser shortcuts through
    const inInput = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);

    // 1–6: switch tabs
    const TAB_KEYS = { '1':'home','2':'quran','3':'prayer','4':'dhikr','5':'duas','6':'learn' };
    if (!inInput && TAB_KEYS[e.key]) { e.preventDefault(); switchTab(TAB_KEYS[e.key]); return; }

    if (inInput) return; // everything below requires no active input

    // Escape: go back from any open view
    if (e.key === 'Escape') {
      e.preventDefault();
      if (state.quran?.searchOpen)                                                    { closeQuranSearch(); return; }
      if (document.getElementById('quran-category-view')?.style.display === 'flex')  { closeCategoryView(); return; }
      if (document.getElementById('quran-reader')?.style.display !== 'none')         { closeQuranReader(); return; }
      return;
    }

    // ── Quran reader ──
    if (state.activeTab === 'quran' && document.getElementById('quran-reader')?.style.display !== 'none') {
      if (e.key === 'ArrowRight') { e.preventDefault(); navigateSurah(1); return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); navigateSurah(-1); return; }
      if (e.key === ' ') {
        e.preventDefault();
        if (state.audio.player) {
          if (state.audio.player.paused) { state.audio.player.play(); }
          else { state.audio.player.pause(); }
        }
        return;
      }
    }

    // ── Dhikr tab ──
    if (state.activeTab === 'dhikr') {
      if (e.key === 'ArrowRight') { e.preventDefault(); switchDhikrTab(_dhikrTab + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); switchDhikrTab(_dhikrTab - 1); }
      if (e.key === ' ')          { e.preventDefault(); tapActiveDhikr(); }
    }

    // ── Duas tab ──
    if (state.activeTab === 'duas' && state.learn.currentDuaCategory) {
      if (e.key === 'ArrowRight') { e.preventDefault(); changeDua(1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); changeDua(-1); }
    }

    // ── Learn tab — detail views ──
    if (state.activeTab === 'learn') {
      if (state.learn.currentSection === 'name') {
        const max = (typeof NAMES_OF_ALLAH !== 'undefined' ? NAMES_OF_ALLAH.length : 99) - 1;
        if (e.key === 'ArrowRight') { e.preventDefault(); openNameDetail(Math.min(max, state.learn.currentNameIndex + 1)); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); openNameDetail(Math.max(0, state.learn.currentNameIndex - 1)); }
      }
      if (state.learn.currentSection === 'lesson') {
        const max = (typeof NEW_MUSLIM_LESSONS !== 'undefined' ? NEW_MUSLIM_LESSONS.length : 7) - 1;
        if (e.key === 'ArrowRight') { e.preventDefault(); openLesson(Math.min(max, state.learn.currentLesson + 1)); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); openLesson(Math.max(0, state.learn.currentLesson - 1)); }
      }
      if (state.learn.currentSection === 'letter') {
        const max = (typeof ARABIC_LETTERS !== 'undefined' ? ARABIC_LETTERS.length : 28) - 1;
        if (e.key === 'ArrowRight') { e.preventDefault(); showLetterDetail(Math.min(max, state.learn.currentLetterIndex + 1)); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); showLetterDetail(Math.max(0, state.learn.currentLetterIndex - 1)); }
      }
    }
  });
}

function switchTab(tab) {
  state.activeTab = tab;
  haptic();
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
  // Handle notification tap when app is already open
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'OPEN_TAB' && ['home','quran','prayer','dhikr','duas','learn'].includes(e.data.tab)) switchTab(e.data.tab);
  });
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
  state.fontSize = Math.max(18, Math.min(42, state.fontSize + delta));
  localStorage.setItem('huda_fontsize', state.fontSize);
  debouncedPush();
  // Re-render mushaf if open
  const n = state.quran.currentSurah;
  if (n && state.quran.viewMode === 'page' && state.quran.cache[n]) {
    const { arData, enData } = state.quran.cache[n];
    renderMushafPage(n, arData, enData);
  }
}

