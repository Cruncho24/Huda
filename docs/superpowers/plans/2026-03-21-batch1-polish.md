# Batch 1 Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add password reset flow, haptic feedback on key interactions, and a Friday Jumu'ah banner to the Huda PWA.

**Architecture:** Three independent feature additions to the existing vanilla JS PWA. Password reset adds a new `/auth/reset.html` page (mirroring `/auth/confirm.html` pattern) and a new modal mode in `renderAuthModalBody`. The reset page disables the form until the PKCE code exchange completes to avoid a race condition. Haptic feedback adds `haptic()` calls to existing functions in `js/app.js`. Friday banner adds a dismissible card in `renderHome()` using `localStorage` to track dismissal per-week with local (not UTC) date.

**Tech Stack:** Vanilla JS, Supabase JS SDK v2 (CDN), existing CSS patterns, `navigator.vibrate` for haptics.

---

## Files

| File | Action | Responsibility |
|---|---|---|
| `js/app.js` | Modify | Forgot password modal mode, haptic calls, Friday banner |
| `js/auth.js` | Modify | `authResetPassword(email)` function |
| `auth/reset.html` | Create | Password reset page (enter + confirm new password) |
| `vercel.json` | Modify | Add `/auth/reset` route |
| `css/styles.css` | Modify | Friday banner styles |
| `service-worker.js` | Modify | Bump to v93, add auth/reset.html to STATIC_ASSETS |
| `index.html` | Modify | Bump version strings to v93 |

---

## Pre-requisites (Manual — before Task 1)

In Supabase → Authentication → URL Configuration → **Redirect URLs**, add:
```
https://huda-six.vercel.app/auth/reset
```

---

## Task 1: Password Reset — auth.js + auth/reset.html

**Files:**
- Modify: `js/auth.js`
- Create: `auth/reset.html`

- [ ] **Step 1: Add `authResetPassword` to js/auth.js**

Open `js/auth.js`. After the `authSignOut` function, add only this one function (no `authUpdatePassword` — the reset page handles the update directly with its own Supabase client):

```js
async function authResetPassword(email) {
  const { error } = await _getClient().auth.resetPasswordForEmail(email, {
    redirectTo: 'https://huda-six.vercel.app/auth/reset',
  });
  if (error) throw error;
}
```

- [ ] **Step 2: Create auth/reset.html**

Key design decisions baked in:
- Form is **disabled on load** until the PKCE code exchange completes (prevents race condition where `updateUser` is called before session exists)
- Shows friendly error if no `code` param or exchange fails (expired/reused link)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Huda — Reset Password</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 36px 28px;
      max-width: 320px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon { font-size: 40px; margin-bottom: 12px; text-align: center; }
    h1 { font-size: 20px; margin: 0 0 6px; color: #059669; font-weight: 700; }
    p  { font-size: 14px; color: #64748b; margin: 0 0 16px; line-height: 1.5; }
    input {
      width: 100%;
      padding: 10px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      margin-bottom: 10px;
      box-sizing: border-box;
      background: #f8fafc;
    }
    input:disabled { opacity: 0.5; }
    .pass-wrap { position: relative; margin-bottom: 10px; }
    .pass-wrap input { margin-bottom: 0; padding-right: 44px; }
    .eye-btn {
      position: absolute; right: 10px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 16px;
    }
    button.primary {
      width: 100%; padding: 12px;
      background: #059669; color: #fff;
      border: none; border-radius: 10px;
      font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 4px;
    }
    button.primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #dc2626; font-size: 13px; margin-bottom: 8px; }
    .success { text-align: center; }
    a.home { display:inline-block; margin-top:16px; color:#059669; font-weight:600; text-decoration:none; }
  </style>
</head>
<body>
  <div class="card">
    <div id="view-loading">
      <div class="icon">⏳</div>
      <h1>Verifying link…</h1>
      <p>Please wait a moment.</p>
    </div>
    <div id="view-form" style="display:none">
      <div class="icon">🔐</div>
      <h1>Set new password</h1>
      <p>Choose a strong password for your Huda account.</p>
      <div class="pass-wrap">
        <input id="pass1" type="password" placeholder="New password (min 6 chars)">
        <button type="button" class="eye-btn" onclick="toggleEye('pass1',this)">👁</button>
      </div>
      <div class="pass-wrap">
        <input id="pass2" type="password" placeholder="Confirm new password">
        <button type="button" class="eye-btn" onclick="toggleEye('pass2',this)">👁</button>
      </div>
      <div id="err" class="error" style="display:none"></div>
      <button class="primary" id="btn" onclick="handleReset()">Update Password</button>
    </div>
    <div id="view-error" style="display:none">
      <div class="icon">❌</div>
      <h1>Link expired</h1>
      <p>This reset link is invalid or has already been used. Request a new one from the Huda app.</p>
      <a class="home" href="/">Open Huda</a>
    </div>
    <div id="view-success" class="success" style="display:none">
      <div class="icon">✅</div>
      <h1>Password updated!</h1>
      <p>You can now sign in with your new password.</p>
      <a class="home" href="/">Open Huda</a>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script>
    const SUPABASE_URL  = 'https://yfzjvxzeomrmsasqqwqd.supabase.co';
    const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmemp2eHplb21ybXNhc3Fxd3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTQ1OTMsImV4cCI6MjA4OTY5MDU5M30.0wvjwGpuuyy0gQHAhuOXXEREVqQVHesqW-JsJXU5LcA';
    const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

    function show(id) {
      ['view-loading','view-form','view-error','view-success'].forEach(v =>
        document.getElementById(v).style.display = v === id ? 'block' : 'none'
      );
    }

    function toggleEye(id, btn) {
      const inp = document.getElementById(id);
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    }

    // Exchange PKCE code for session first — form stays hidden until this resolves
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      show('view-error');
    } else {
      client.auth.exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error || !data.session) {
            show('view-error');
          } else {
            show('view-form');
          }
        })
        .catch(() => show('view-error'));
    }

    async function handleReset() {
      const p1 = document.getElementById('pass1').value;
      const p2 = document.getElementById('pass2').value;
      const btn = document.getElementById('btn');
      const err = document.getElementById('err');
      err.style.display = 'none';
      if (p1.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.style.display = 'block'; return; }
      if (p1 !== p2)     { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; return; }
      btn.disabled = true; btn.textContent = 'Updating…';
      const { error } = await client.auth.updateUser({ password: p1 });
      if (error) {
        err.textContent = error.message || 'Update failed.';
        err.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Update Password';
      } else {
        show('view-success');
      }
    }
  </script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add js/auth.js auth/reset.html
git commit -m "feat: add password reset auth module and reset page"
```

---

## Task 2: Password Reset — modal UI in app.js

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add "Forgot password?" link + reset mode to renderAuthModalBody**

In `renderAuthModalBody`, find the sign-in `else` block (around line 131). The current code is:

```js
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
    `;
  }
```

Replace the entire block with (adds `reset` mode before the sign-in fallback, and adds "Forgot password?" to sign-in):

```js
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
```

- [ ] **Step 2: Add handleResetRequest() function**

After the `handleSignOut()` function, add:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add forgot password flow to auth modal"
```

---

## Task 3: Haptic feedback on key interactions

**Files:**
- Modify: `js/app.js`

All these functions already exist. `haptic(ms = 30)` is defined at line 265. Add calls as shown.

- [ ] **Step 1: Add haptic to switchTab()**

Find `switchTab` (line 375). After `state.activeTab = tab;` add:
```js
  haptic();
```

- [ ] **Step 2: Add haptic to toggleDarkMode()**

Find `toggleDarkMode` (line 256). After `applyDarkMode();` and before `renderHome();` add:
```js
  haptic();
```

- [ ] **Step 3: Add haptic to toggleBookmark()**

Find `toggleBookmark`. After `localStorage.setItem('huda_bookmarks', JSON.stringify(state.bookmarks));` (first occurrence, in toggleBookmark) add:
```js
  haptic();
```

- [ ] **Step 4: Add haptic to removeBookmark()**

Find `removeBookmark`. After `localStorage.setItem('huda_bookmarks', JSON.stringify(state.bookmarks));` add:
```js
  haptic();
```

- [ ] **Step 5: Add haptic to toggleSurahBookmark()**

Find `toggleSurahBookmark`. After `localStorage.setItem('huda_surah_bm', JSON.stringify(state.surahBookmarks));` (first occurrence) add:
```js
  haptic();
```

- [ ] **Step 6: Add haptic to removeSurahBookmark()**

Find `removeSurahBookmark`. After `localStorage.setItem('huda_surah_bm', JSON.stringify(state.surahBookmarks));` add:
```js
  haptic();
```

- [ ] **Step 7: Add haptic to handleSignIn()**

Find `handleSignIn`. After `await authSignIn(email, pass);` add:
```js
    haptic(50);
```

- [ ] **Step 8: Add haptic to handleSignOut()**

Find `handleSignOut`. After `await authSignOut();` add:
```js
  haptic(50);
```

- [ ] **Step 9: Commit**

```bash
git add js/app.js
git commit -m "feat: add haptic feedback to nav, bookmarks, dark mode, sign in/out"
```

---

## Task 4: Friday Jumu'ah banner

**Files:**
- Modify: `js/app.js`
- Modify: `css/styles.css`

- [ ] **Step 1: Add jumuah banner logic to renderHome()**

In `renderHome()`, after the `let ramadanCard = '';` block (around line 437), add:

```js
  // Friday Jumu'ah banner — uses local date parts to match getDay() which is also local
  const isFriday = now.getDay() === 5;
  const localDateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
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
```

Note: `dismissJumuah()` uses no argument — the key is captured via closure in the function defined below.

- [ ] **Step 2: Insert jumuahCard into the renderHome template**

In the template literal inside `renderHome()`, after `${ramadanCard}` add:

```js
    ${jumuahCard}
```

- [ ] **Step 3: Add dismissJumuah() function**

After `renderHome()`, add:

```js
function dismissJumuah() {
  const now = new Date();
  const key = `huda_jumuah_dismissed_${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  localStorage.setItem(key, '1');
  const el = document.getElementById('jumuah-card');
  if (el) el.remove();
}
```

- [ ] **Step 4: Add CSS for Jumu'ah banner to css/styles.css**

Append to end of `css/styles.css`:

```css
/* ── Jumu'ah Banner ───────────────────────────────────────── */
.jumuah-card {
  margin: 0 16px 16px;
  background: linear-gradient(135deg, #065f46, #059669);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #fff;
}
.jumuah-content { flex: 1; }
.jumuah-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
}
.jumuah-sub {
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.5;
  margin-bottom: 12px;
}
.jumuah-btn {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.4);
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.jumuah-dismiss {
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}
```

- [ ] **Step 5: Commit**

```bash
git add js/app.js css/styles.css
git commit -m "feat: Friday Jumuah banner with Surah Al-Kahf link"
```

---

## Task 5: vercel.json + service worker + version bump + deploy

**Files:**
- Modify: `vercel.json`
- Modify: `service-worker.js`
- Modify: `index.html`

- [ ] **Step 1: Add /auth/reset route to vercel.json**

In `vercel.json`, after the `/auth/confirm` route block, add:

```json
{
  "src": "/auth/reset",
  "headers": { "Cache-Control": "no-cache" },
  "dest": "/auth/reset.html"
},
```

- [ ] **Step 2: Bump cache version + add auth/reset.html to STATIC_ASSETS in service-worker.js**

Change:
```js
const CACHE_NAME = 'huda-v92';
```
To:
```js
const CACHE_NAME = 'huda-v93';
```

In STATIC_ASSETS array, after `'/auth/confirm.html'` (or after `'/js/sync.js'`), add:
```js
'/auth/reset.html',
```

- [ ] **Step 3: Bump version strings in index.html**

Change all `?v=92` to `?v=93`:
- `css/styles.css?v=93`
- `js/adhan.min.js?v=93`
- `js/auth.js?v=93`
- `js/sync.js?v=93`
- `js/data.js?v=93`
- `js/app.js?v=93`

- [ ] **Step 4: Commit and deploy**

```bash
git add vercel.json service-worker.js index.html
git commit -m "chore: bump to v93 — password reset, haptics, Jumuah banner"
npx vercel --prod
```

- [ ] **Step 5: Smoke test**
  - Hard refresh (Cmd+Shift+R) to pick up v93 service worker
  - Tap 🔑 → Sign In modal → "Forgot password?" appears at bottom
  - Tap "Forgot password?" → Reset Password form appears
  - Enter email → "Check your email" confirmation shown
  - Open the reset link from email → loading spinner → form appears → enter new password → ✅ success
  - Opening reset link a second time → shows ❌ "Link expired" (not the form)
  - Switch nav tabs → feel haptic on each
  - Add/remove bookmark → feel haptic
  - Toggle dark mode → feel haptic
  - Sign in / sign out → feel haptic
  - **Friday only:** green Jumu'ah banner appears above the hadith; tapping "Read Surah Al-Kahf →" opens surah 18 and dismisses banner; ✕ dismisses without navigating; banner does not reappear after dismiss until next Friday
