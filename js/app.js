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
  dhikrCounts: (() => { try { return JSON.parse(localStorage.getItem('huda_dhikr') || '{}'); } catch(e) { return {}; } })(),
  hadithIndex: 0,
  darkMode: localStorage.getItem('huda_dark') === '1',
  fontSize: parseInt(localStorage.getItem('huda_fontsize') || '24') || 24,
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
    showTranslation: false,
    timings: {},
    searchOpen: false,
    searchQuery: '',
  },
  learn: {
    currentSection: null, currentLesson: null,
    currentDuaCategory: null, currentDuaIndex: 0,
    currentNameIndex: null, hajjTab: 'umrah',
    zakat: { currency: 'USD', nisab: 'gold' },
  },
  tasbeeh: parseInt(localStorage.getItem('huda_tasbeeh') || '0') || 0,
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
      <div class="auth-user-email">${user.email}</div>
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
  btn.textContent = user ? '👤' : '🔑';
  btn.classList.toggle('signed-in', !!user);
  btn.title = user ? `Signed in as ${user.email}` : 'Sign in / Create account';
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
  setInterval(rotateHadith, 12000);

  // Handle notification tap — open to specific tab
  const _notifTab = new URLSearchParams(location.search).get('tab');
  if (_notifTab) switchTab(_notifTab);

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
  renderHome();
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
  haptic();
  debouncedPush();
  // refresh bookmark btn
  const btn = document.getElementById(`bm-${surahNum}-${ayahNum}`);
  if (btn) btn.textContent = isBookmarked(surahNum, ayahNum) ? '🔖' : '🏷️';
}
function isBookmarked(s, a) { return state.bookmarks.some(b => b.s === s && b.a === a); }
function removeBookmark(s, a) {
  state.bookmarks = state.bookmarks.filter(b => !(b.s === s && b.a === a));
  localStorage.setItem('huda_bookmarks', JSON.stringify(state.bookmarks));
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
    showToast('Audio unavailable — check connection');
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
    if (e.data?.type === 'OPEN_TAB') switchTab(e.data.tab);
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
  state.fontSize = Math.max(16, Math.min(36, state.fontSize + delta));
  localStorage.setItem('huda_fontsize', state.fontSize);
  debouncedPush();
  // Re-render mushaf if open
  const n = state.quran.currentSurah;
  if (n && state.quran.viewMode === 'page' && state.quran.cache[n]) {
    const { arData, enData } = state.quran.cache[n];
    renderMushafPage(n, arData, enData);
  }
}

