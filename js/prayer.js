/* ============================================================
   HUDA PWA — Prayer Times + Qibla Compass
   ============================================================ */

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
      try {
        const p = JSON.parse(cached);
        state.prayer.times = p.times;
        state.prayer.city = p.city;
        state.prayer.qibla = p.qibla;
        renderPrayerTimes();
      } catch(e) {}
    }
    return;
  }
  renderPrayerTimes();
  // Silently refresh GPS in background — recalculate if user has moved >0.1° (~11 km)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const prev = state.prayer.location;
        if (!prev || Math.abs(lat - prev.lat) > 0.1 || Math.abs(lng - prev.lng) > 0.1) {
          state.prayer.qibla = calcQibla(lat, lng);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await res.json();
            state.prayer.city = data.address?.city || data.address?.town || data.address?.state || 'Your Location';
          } catch(e) {}
          calcPrayerTimes(lat, lng);
        }
      },
      () => {} // silent fail — cached data stays shown
    );
  }
}

async function requestLocation() {
  if (!navigator.geolocation) {
    document.getElementById('tab-prayer').innerHTML = `
      <div class="prayer-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
        <div style="font-size:40px;margin-bottom:12px">📍</div>
        <p style="color:white;margin-bottom:8px;font-weight:700">Location not available</p>
        <p style="color:white;opacity:0.85;font-size:13px">Your browser doesn't support location services. Try opening Huda in Safari (iOS) or Chrome (Android).</p>
      </div>`;
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
      const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
      const hint = isIOS
        ? 'To enable: Settings → Safari → Location → Allow'
        : 'To enable: tap the lock icon in your browser address bar → Allow Location';
      document.getElementById('tab-prayer').innerHTML = `
        <div class="prayer-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
          <div style="font-size:40px;margin-bottom:12px">📍</div>
          <p style="color:white;margin-bottom:8px;font-weight:700">Location access denied</p>
          <p style="color:white;opacity:0.85;font-size:13px;margin-bottom:20px;padding:0 8px">${hint}</p>
          <button onclick="requestLocation()" style="background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.5);color:white;padding:12px 24px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">Try Again</button>
        </div>`;
    }
  );
}

function calcPrayerTimes(lat, lng) {
  if (typeof adhan === 'undefined') { renderPrayerFallback(); return; }
  state.prayer.location = { lat, lng };
  const coords = new adhan.Coordinates(lat, lng);
  const params = adhan.CalculationMethod.MuslimWorldLeague();
  params.madhab = adhan.Madhab.Shafi;
  const now = new Date();
  let pt = new adhan.PrayerTimes(coords, now, params);
  // If all of today's prayer times have passed (e.g. after Isha), use tomorrow's
  const allTodayPast = [pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha].every(t => t < now);
  if (allTodayPast) {
    const tomorrow = new Date(now.getTime() + 86400000);
    pt = new adhan.PrayerTimes(coords, tomorrow, params);
  }
  state.prayer.times = {
    fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr,
    asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha,
  };
  localStorage.setItem('huda_prayer', JSON.stringify({
    times: state.prayer.times,
    city: state.prayer.city,
    qibla: state.prayer.qibla,
    lat, lng,
  }));
  renderPrayerTimes();
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

  // When all cached times are in the past the data is stale. Show a "Updating"
  // state, kick off a background recalculation, and return early.
  // Never start the countdown with a past time — that creates an infinite
  // re-render loop (diff<=0 → setTimeout(renderPrayerTimes) → repeat) which
  // also destroys the Qibla compass DOM every second.
  const allPast = PRAYER_NAMES.every(p => new Date(times[p.key]) < now);
  if (allPast) {
    // If we have cached coords, recalculate immediately (adhan is local — no network needed).
    // calcPrayerTimes will use tomorrow's date if all today's times are past, then
    // call renderPrayerTimes again with fresh data, so we return right after.
    if (state.prayer.location) {
      calcPrayerTimes(state.prayer.location.lat, state.prayer.location.lng);
      return;
    }
    // No cached coords — need a fresh geolocation fix
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => calcPrayerTimes(pos.coords.latitude, pos.coords.longitude),
        () => {}
      );
    }
    const tab = document.getElementById('tab-prayer');
    tab.innerHTML = `
      <div class="prayer-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
        <div class="next-prayer-label">Updating prayer times…</div>
        <div class="next-prayer-name" style="font-size:18px;opacity:0.85">Please wait</div>
        <div class="countdown" style="font-size:24px">—</div>
        <div class="location-label">📍 ${esc(state.prayer.city || 'Your Location')}</div>
      </div>
      <div class="prayer-list">
        ${PRAYER_NAMES.map(p => {
          const t = new Date(times[p.key]);
          return `
            <div class="prayer-item past-prayer">
              <div class="prayer-icon">${p.icon}</div>
              <div>
                <div class="prayer-name">${p.en}</div>
                <div class="prayer-arabic-name">${p.ar}</div>
              </div>
              <div style="margin-left:auto">
                <div class="prayer-time-text">${fmt(t)}</div>
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
            <svg viewBox="0 0 240 240" width="240" height="240">
              <circle cx="120" cy="120" r="116" fill="none" stroke="rgba(5,150,105,0.15)" stroke-width="1.5"/>
              <polygon points="120,2 127,17 113,17" fill="#059669"/>
              <g id="compass-disc" style="transform-origin:120px 120px">
                <circle cx="120" cy="120" r="110" fill="rgba(5,150,105,0.04)" stroke="rgba(5,150,105,0.2)" stroke-width="1.5"/>
                ${[0,45,90,135,180,225,270,315].map(a=>{const r1=98,r2=108,rad=(a-90)*Math.PI/180;return `<line x1="${120+r1*Math.cos(rad)}" y1="${120+r1*Math.sin(rad)}" x2="${120+r2*Math.cos(rad)}" y2="${120+r2*Math.sin(rad)}" stroke="rgba(5,150,105,0.4)" stroke-width="1.5"/>`;}).join('')}
                ${[15,30,60,75,105,120,150,165,195,210,240,255,285,300,330,345].map(a=>{const r1=103,r2=108,rad=(a-90)*Math.PI/180;return `<line x1="${120+r1*Math.cos(rad)}" y1="${120+r1*Math.sin(rad)}" x2="${120+r2*Math.cos(rad)}" y2="${120+r2*Math.sin(rad)}" stroke="rgba(5,150,105,0.2)" stroke-width="1"/>`;}).join('')}
                <text x="120" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="#059669">N</text>
                <text x="218" y="125" text-anchor="middle" font-size="13" font-weight="600" fill="rgba(5,150,105,0.6)">E</text>
                <text x="120" y="226" text-anchor="middle" font-size="13" font-weight="600" fill="rgba(5,150,105,0.6)">S</text>
                <text x="22" y="125" text-anchor="middle" font-size="13" font-weight="600" fill="rgba(5,150,105,0.6)">W</text>
                <g transform="rotate(${Math.round(state.prayer.qibla)}, 120, 120)">
                  <line x1="120" y1="28" x2="120" y2="55" stroke="#059669" stroke-width="3" stroke-linecap="round"/>
                  <text x="120" y="27" text-anchor="middle" font-size="18" dominant-baseline="auto">🕋</text>
                </g>
              </g>
              <circle cx="120" cy="120" r="7" fill="#059669"/>
              <circle cx="120" cy="120" r="3.5" fill="white"/>
            </svg>
          </div>
          <div class="qibla-status" id="qibla-status">Calibrating…</div>
          <button class="qibla-stop-btn" onclick="stopQiblaCompass()">Close Compass</button>
        </div>
      </div>` : ''}
    `;
    return; // no countdown — fresh render comes when geolocation resolves
  }

  let nextPrayer = null, nextTime = null;
  for (const p of PRAYER_NAMES) {
    if (p.key === 'sunrise') continue;
    const t = new Date(times[p.key]);
    if (t > now) { nextPrayer = p; nextTime = t; break; }
  }
  if (!nextPrayer) { nextPrayer = PRAYER_NAMES[0]; nextTime = new Date(times.fajr); }

  const notifBanner = ('Notification' in window && Notification.permission === 'default') ? `
    <div class="notif-banner" id="notif-banner">
      <span class="notif-banner-text">🔔 Get notified at each prayer time</span>
      <button class="notif-banner-btn" onclick="requestNotifPermission()">Enable</button>
      <button class="notif-banner-dismiss" onclick="dismissNotifBanner()" aria-label="Dismiss">✕</button>
    </div>` : '';

  const tab = document.getElementById('tab-prayer');
  tab.innerHTML = `
    <div class="prayer-hero" style="padding-top:calc(24px + env(safe-area-inset-top,0px))">
      <div class="next-prayer-label">Next Prayer</div>
      <div class="next-prayer-name">${nextPrayer.en}</div>
      <div class="next-prayer-arabic">${nextPrayer.ar}</div>
      <div class="next-prayer-time">${fmt(nextTime)}</div>
      <div class="countdown-label">Time Remaining</div>
      <div class="countdown" id="prayer-countdown">00:00:00</div>
      <div class="location-label">📍 ${esc(state.prayer.city)}</div>
    </div>
    ${notifBanner}
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
          <svg viewBox="0 0 240 240" width="240" height="240">
            <!-- Fixed outer ring -->
            <circle cx="120" cy="120" r="116" fill="none" stroke="rgba(5,150,105,0.15)" stroke-width="1.5"/>
            <!-- Fixed forward indicator (green triangle at top = direction you're facing) -->
            <polygon points="120,2 127,17 113,17" fill="#059669"/>
            <!-- Rotating compass disc -->
            <g id="compass-disc" style="transform-origin:120px 120px">
              <!-- Disc face -->
              <circle cx="120" cy="120" r="110" fill="rgba(5,150,105,0.04)" stroke="rgba(5,150,105,0.2)" stroke-width="1.5"/>
              <!-- Major tick marks every 45° -->
              ${[0,45,90,135,180,225,270,315].map(a => {
                const r1=98, r2=108, rad=(a-90)*Math.PI/180;
                return `<line x1="${120+r1*Math.cos(rad)}" y1="${120+r1*Math.sin(rad)}" x2="${120+r2*Math.cos(rad)}" y2="${120+r2*Math.sin(rad)}" stroke="rgba(5,150,105,0.4)" stroke-width="1.5"/>`;
              }).join('')}
              <!-- Minor tick marks every 15° -->
              ${[15,30,60,75,105,120,150,165,195,210,240,255,285,300,330,345].map(a => {
                const r1=103, r2=108, rad=(a-90)*Math.PI/180;
                return `<line x1="${120+r1*Math.cos(rad)}" y1="${120+r1*Math.sin(rad)}" x2="${120+r2*Math.cos(rad)}" y2="${120+r2*Math.sin(rad)}" stroke="rgba(5,150,105,0.2)" stroke-width="1"/>`;
              }).join('')}
              <!-- Cardinal labels -->
              <text x="120" y="22" text-anchor="middle" font-size="15" font-weight="800" fill="#059669">N</text>
              <text x="218" y="125" text-anchor="middle" font-size="13" font-weight="600" fill="rgba(5,150,105,0.6)">E</text>
              <text x="120" y="226" text-anchor="middle" font-size="13" font-weight="600" fill="rgba(5,150,105,0.6)">S</text>
              <text x="22" y="125" text-anchor="middle" font-size="13" font-weight="600" fill="rgba(5,150,105,0.6)">W</text>
              <!-- Qibla marker on the disc at the Qibla bearing -->
              <g transform="rotate(${Math.round(state.prayer.qibla)}, 120, 120)">
                <line x1="120" y1="28" x2="120" y2="55" stroke="#059669" stroke-width="3" stroke-linecap="round"/>
                <text x="120" y="27" text-anchor="middle" font-size="18" dominant-baseline="auto">🕋</text>
              </g>
            </g>
            <!-- Centre dot -->
            <circle cx="120" cy="120" r="7" fill="#059669"/>
            <circle cx="120" cy="120" r="3.5" fill="white"/>
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

  // Schedule background notifications if permission already granted
  if ('Notification' in window && Notification.permission === 'granted') {
    schedulePrayerNotifications(state.prayer.times);
  }

  // If the compass was open before this re-render, restore it without re-requesting permission
  if (state.prayer.compassOpen) {
    const wrap = document.getElementById('qibla-compass-wrap');
    const btn = document.getElementById('qibla-open-btn');
    if (wrap) { wrap.style.display = 'block'; if (btn) btn.style.display = 'none'; _startQiblaListener(); }
  }
}

function updateCountdown(target) {
  const el = document.getElementById('prayer-countdown');
  if (!el) { clearInterval(state.prayer.countdownInterval); return; }
  const diff = new Date(target) - new Date();
  if (diff <= 0) {
    el.textContent = '00:00:00';
    clearInterval(state.prayer.countdownInterval);

    // Foreground notification fallback (fires when app is open — covers iOS 16.4+ and non-Triggers browsers)
    if ('Notification' in window && Notification.permission === 'granted' && state.prayer.times) {
      const _now = new Date();
      const _hit = ['fajr','dhuhr','asr','maghrib','isha'].find(key => {
        const t = new Date(state.prayer.times[key]);
        return Math.abs(t - _now) < 90000; // within 90 seconds of prayer time
      });
      if (_hit) {
        const _names = { fajr:'Fajr', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha' };
        const _arabic = { fajr:'الفَجْر', dhuhr:'الظُّهْر', asr:'العَصْر', maghrib:'المَغْرِب', isha:'العِشَاء' };
        new Notification(_names[_hit], {
          body: `${_arabic[_hit]} — Time to pray`,
          icon: '/icons/icon-192.png',
          tag: `prayer-${_hit}`,
        });
      }
    }

    // Re-render immediately to pick up the next prayer (avoids 1s 00:00:00 flash)
    setTimeout(renderPrayerTimes, 0);
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
let _qiblaRafId = null;
let _qiblaActive = false;
let _noSensorTimeout = null;

function openQiblaCompass() {
  const wrap = document.getElementById('qibla-compass-wrap');
  const btn = document.getElementById('qibla-open-btn');
  if (!wrap) return;

  const start = () => {
    state.prayer.compassOpen = true;
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

// Tilt-compensated compass heading from DeviceOrientationEvent angles.
// Works correctly whether the phone is lying flat or held vertically.
// Based on W3C DeviceOrientation working group notes.
function _tiltCompensatedHeading(alpha, beta, gamma) {
  const r = Math.PI / 180;
  const cX = Math.cos(beta * r), sX = Math.sin(beta * r);
  const cY = Math.cos(gamma * r), sY = Math.sin(gamma * r);
  const cZ = Math.cos(alpha * r), sZ = Math.sin(alpha * r);
  const Vx = -cZ * sY - sZ * sX * cY;
  const Vy = -sZ * sY + cZ * sX * cY;
  const h = Math.atan2(Vx, Vy) * (180 / Math.PI);
  return (h + 360) % 360;
}

function _startQiblaListener() {
  // Clean up any previous listener and RAF loop
  if (_qiblaListener) {
    window.removeEventListener('deviceorientationabsolute', _qiblaListener, true);
    window.removeEventListener('deviceorientation', _qiblaListener, true);
    _qiblaListener = null;
  }
  if (_qiblaRafId) { cancelAnimationFrame(_qiblaRafId); _qiblaRafId = null; }

  _qiblaGotAbsolute = false;
  _qiblaActive = true;
  const qibla = state.prayer.qibla;

  let smoothedHeading = null;
  let currentDiscDeg = null;

  const disc = document.getElementById('compass-disc');
  const status = document.getElementById('qibla-status');
  if (!disc) return;

  // Timeout: if no sensor events after 3s, show "not available" (desktop/Mac)
  if (_noSensorTimeout) { clearTimeout(_noSensorTimeout); _noSensorTimeout = null; }
  _noSensorTimeout = setTimeout(() => {
    if (smoothedHeading === null && status && status.isConnected) {
      status.textContent = 'No compass sensor detected on this device';
      status.className = 'qibla-status qibla-off';
    }
  }, 3000);

  // RAF render loop — decouples sensor reads from DOM writes
  function render() {
    if (!_qiblaActive || !disc.isConnected) return;
    if (smoothedHeading !== null) {
      disc.style.transform = `rotate(${currentDiscDeg}deg)`;
      const diff = Math.abs(((((qibla - smoothedHeading) % 360) + 540) % 360) - 180);
      if (status) {
        if (diff <= 5) {
          status.textContent = '✅ Facing the Qibla';
          status.className = 'qibla-status qibla-on';
        } else {
          const turn = ((qibla - smoothedHeading) % 360 + 360) % 360;
          status.textContent = `${Math.round(diff)}° off — turn ${turn < 180 ? 'right' : 'left'}`;
          status.className = 'qibla-status qibla-off';
        }
      }
    }
    _qiblaRafId = requestAnimationFrame(render);
  }
  _qiblaRafId = requestAnimationFrame(render);

  // Sensor handler — only updates state, never touches the DOM
  _qiblaListener = (e) => {
    let rawHeading;

    if (e.webkitCompassHeading != null) {
      // iOS: already tilt-compensated magnetic north bearing (clockwise from N)
      rawHeading = e.webkitCompassHeading;

    } else if (e.alpha != null && e.beta != null && e.gamma != null) {
      // Android / others: require absolute reference (relative headings are useless)
      // Trust deviceorientationabsolute event type even if e.absolute is false
      // (some Chromium versions fire it as false during calibration)
      const isAbsolute = e.absolute || e.type === 'deviceorientationabsolute';
      if (isAbsolute) {
        _qiblaGotAbsolute = true;
      } else if (_qiblaGotAbsolute) {
        return; // already have absolute source — ignore non-absolute events
      } else {
        return; // no absolute data yet — don't use relative orientation
      }
      // Apply tilt compensation so the compass works when phone is held vertically
      rawHeading = _tiltCompensatedHeading(e.alpha, e.beta, e.gamma);

    } else return;

    if (_noSensorTimeout) { clearTimeout(_noSensorTimeout); _noSensorTimeout = null; }

    // EMA smoothing (α=0.7) with shortest-path delta
    if (smoothedHeading === null) {
      smoothedHeading = rawHeading;
      currentDiscDeg = -rawHeading;
    } else {
      let delta = rawHeading - smoothedHeading;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      smoothedHeading = (smoothedHeading + 0.7 * delta + 360) % 360;

      const targetDiscDeg = -smoothedHeading;
      let discDelta = targetDiscDeg - (currentDiscDeg % 360);
      if (discDelta > 180) discDelta -= 360;
      if (discDelta < -180) discDelta += 360;
      currentDiscDeg += discDelta;
    }
  };

  // deviceorientationabsolute — Chrome/Firefox Android (always absolute=true)
  // deviceorientation — iOS (webkitCompassHeading) + fallback
  window.addEventListener('deviceorientationabsolute', _qiblaListener, true);
  window.addEventListener('deviceorientation', _qiblaListener, true);
}

function stopQiblaCompass() {
  state.prayer.compassOpen = false;
  _qiblaActive = false;
  if (_noSensorTimeout) { clearTimeout(_noSensorTimeout); _noSensorTimeout = null; }
  if (_qiblaRafId) { cancelAnimationFrame(_qiblaRafId); _qiblaRafId = null; }
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

// ── Prayer Notifications ───────────────────────────────────────
async function requestNotifPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    schedulePrayerNotifications(state.prayer.times);
  }
  renderPrayerTimes(); // re-render to hide banner
}

function dismissNotifBanner() {
  const el = document.getElementById('notif-banner');
  if (el) el.remove();
}

async function schedulePrayerNotifications(times) {
  if (!times || Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;

  const reg = await navigator.serviceWorker.ready;

  // Notification Triggers API — not supported everywhere; foreground fallback covers the rest
  if (!('showTrigger' in Notification.prototype)) return;

  const now = Date.now();
  const prayers = [
    { key: 'fajr',    en: 'Fajr',    ar: 'الفَجْر'   },
    { key: 'dhuhr',   en: 'Dhuhr',   ar: 'الظُّهْر'  },
    { key: 'asr',     en: 'Asr',     ar: 'العَصْر'   },
    { key: 'maghrib', en: 'Maghrib', ar: 'المَغْرِب' },
    { key: 'isha',    en: 'Isha',    ar: 'العِشَاء'  },
  ];

  for (const p of prayers) {
    const ms = new Date(times[p.key]).getTime();
    if (ms <= now) continue; // already past, skip
    reg.showNotification(p.en, {
      body: `${p.ar} — Time to pray`,
      tag: `prayer-${p.key}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      showTrigger: new TimestampTrigger(ms),
    });
  }
}

