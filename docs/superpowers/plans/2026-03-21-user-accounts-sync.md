# User Accounts & Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase-backed email/password auth so users can sign in and have their bookmarks, dhikr counts, tasbeeh, preferences, and last-read position automatically synced across devices.

**Architecture:** A new `js/auth.js` module handles Supabase auth; a new `js/sync.js` module handles read/write of syncable keys against a single `user_data` key-value table. Both are loaded via `<script>` tags before `app.js`. Mutations in `app.js` call `debouncedPush()` after saving to localStorage. On login the sync module pulls remote data and merges it into localStorage and the in-memory `state` object (latest `updated_at` wins per key). No build step — Supabase SDK loaded from CDN.

**Tech Stack:** Supabase (auth + postgres), Supabase JS SDK v2 (CDN UMD build), vanilla JS, existing CSS pattern (modal overlay)

---

## Supabase Keys to Sync

| localStorage key | What it holds |
|---|---|
| `huda_bookmarks` | Ayah bookmarks (JSON array) |
| `huda_surah_bm` | Surah bookmarks (JSON array) |
| `huda_last_read` | Last-read surah (JSON object) |
| `huda_dhikr` | Dhikr tap counts (JSON object) |
| `huda_dhikr_date` | Date of dhikr counts (string) — synced so cross-device reset stays consistent |
| `huda_tasbeeh` | Tasbeeh counter (number string) |
| `huda_dark` | Dark mode flag ("0"/"1") |
| `huda_fontsize` | Quran font size (number string) |
| `huda_reciter` | Reciter ID (string) |

**Not synced** (API/content caches, location-specific, or too large):
`huda_quran`, `huda_tafsir_*`, `huda_prayer`, `huda_hijri_*`, `huda_cal_*`

---

## Files

| File | Action | Responsibility |
|---|---|---|
| `js/auth.js` | **Create** | Supabase client init, sign up, sign in, sign out, session listener, cached current user |
| `js/sync.js` | **Create** | Push/pull syncable keys, debounce, merge logic, timestamp tracking |
| `js/app.js` | **Modify** | Call `debouncedPush()` after mutations; call `applySyncedState()` after pull |
| `index.html` | **Modify** | Add Supabase CDN script + auth.js + sync.js; add account modal HTML |
| `css/styles.css` | **Modify** | Account button styles + auth modal styles |
| `vercel.json` | **Modify** | Add `*.supabase.co` and `cdn.jsdelivr.net` to CSP |
| `service-worker.js` | **Modify** | Add `js/auth.js` and `js/sync.js` to STATIC_ASSETS |

---

## Pre-requisites (Manual — do before Task 1)

1. Create a free Supabase project at supabase.com
2. Note the **Project URL** and **anon public key** (Settings → API)
3. Run this SQL in Supabase SQL editor:

```sql
-- user_data: one row per key per user
create table public.user_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  unique(user_id, key)
);

-- RLS: users can only read/write their own rows
alter table public.user_data enable row level security;

create policy "Users manage own data"
  on public.user_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

4. In Supabase → Authentication → Settings:
   - Ensure "Email" provider is enabled
   - **Disable "Confirm email"** (toggle off) — otherwise `authSignUp` creates the user but does not start a session immediately, causing `pushSync()` after signup to silently no-op. You can re-enable email confirmation later once a server-side confirm flow is in place.

---

## Task 1: Auth module (js/auth.js)

**Files:**
- Create: `js/auth.js`

- [ ] **Step 1: Create js/auth.js**

```js
// ── Supabase Auth ─────────────────────────────────────────────
// Supabase anon key is intentionally public — RLS policies enforce per-user isolation.
// Replace SUPABASE_URL and SUPABASE_ANON with your project values.

const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_KEY';

let _sb = null;
let _cachedUser = null; // avoids async gap in renderAuthModalBody

function _getClient() {
  if (!_sb) _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

async function authSignUp(email, password) {
  const { data, error } = await _getClient().auth.signUp({ email, password });
  if (error) throw error;
  _cachedUser = data.user;
  return data.user;
}

async function authSignIn(email, password) {
  const { data, error } = await _getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  _cachedUser = data.user;
  return data.user;
}

async function authSignOut() {
  const { error } = await _getClient().auth.signOut();
  if (error) throw error;
  _cachedUser = null;
}

// Returns cached user synchronously (null until first authOnChange fires)
function authGetCachedUser() {
  return _cachedUser;
}

// Async version — validates session token with Supabase
function authGetUser() {
  return _getClient().auth.getUser().then(({ data }) => data?.user ?? null);
}

// callback(user | null) called on sign-in, sign-out, and page reload with existing session
function authOnChange(callback) {
  _getClient().auth.onAuthStateChange((_event, session) => {
    _cachedUser = session?.user ?? null;
    callback(_cachedUser);
  });
}

function authGetSupabaseClient() {
  return _getClient();
}
```

- [ ] **Step 2: Replace placeholder URL and key with real values**

Open `js/auth.js` and replace:
- `https://YOUR_PROJECT_ID.supabase.co` → your Supabase project URL
- `YOUR_ANON_KEY` → your Supabase anon key

- [ ] **Step 3: Commit**

```bash
git add js/auth.js
git commit -m "feat: add Supabase auth module"
```

---

## Task 2: Sync module (js/sync.js)

**Files:**
- Create: `js/sync.js`

- [ ] **Step 1: Create js/sync.js**

```js
// ── Data Sync ─────────────────────────────────────────────────
// Pushes/pulls a fixed set of localStorage keys to Supabase user_data table.
// Merge rule: remote value wins when its updated_at is newer than _sync_ts_{key}.
// After pushSync, local _sync_ts_{key} is updated so future pulls don't overwrite
// changes made locally after the push.

const SYNC_KEYS = [
  'huda_bookmarks',
  'huda_surah_bm',
  'huda_last_read',
  'huda_dhikr',
  'huda_dhikr_date',
  'huda_tasbeeh',
  'huda_dark',
  'huda_fontsize',
  'huda_reciter',
];

let _pushTimer = null;

// Write SYNC_KEYS that have a value to Supabase (upsert).
// Skips keys where localStorage returns null (never been set) to avoid
// overwriting defaults on other devices with empty strings.
async function pushSync() {
  const user = authGetCachedUser();
  if (!user) return;
  const client = authGetSupabaseClient();
  const now = new Date().toISOString();
  const rows = SYNC_KEYS
    .filter(key => localStorage.getItem(key) !== null)
    .map(key => ({
      user_id: user.id,
      key,
      value: localStorage.getItem(key),
      updated_at: now,
    }));
  if (!rows.length) return;
  const { error } = await client
    .from('user_data')
    .upsert(rows, { onConflict: 'user_id,key' });
  if (error) { console.error('[sync] push error', error.message); return; }
  // Record push timestamp locally so pullSync won't overwrite local changes
  const tsMs = new Date(now).getTime();
  rows.forEach(({ key }) => localStorage.setItem(`_sync_ts_${key}`, String(tsMs)));
}

// Debounce pushes — batches rapid changes into one write after 2s
function debouncedPush() {
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(pushSync, 2000);
}

// Pull from Supabase, merge into localStorage (remote wins when updated_at is newer).
// Returns true if any value changed so the caller can re-render.
async function pullSync() {
  const user = authGetCachedUser();
  if (!user) return false;
  const client = authGetSupabaseClient();
  const { data, error } = await client
    .from('user_data')
    .select('key, value, updated_at')
    .eq('user_id', user.id);
  if (error) { console.error('[sync] pull error', error.message); return false; }
  if (!data?.length) return false;

  let changed = false;
  for (const row of data) {
    if (!SYNC_KEYS.includes(row.key)) continue;
    const localTs  = parseInt(localStorage.getItem(`_sync_ts_${row.key}`) || '0');
    const remoteTs = new Date(row.updated_at).getTime();
    if (remoteTs > localTs) {
      const current = localStorage.getItem(row.key);
      if (current !== row.value) {
        localStorage.setItem(row.key, row.value);
        localStorage.setItem(`_sync_ts_${row.key}`, String(remoteTs));
        changed = true;
      }
    }
  }
  return changed;
}

// Reload mutable state from localStorage after a pull.
// Always call renderHome() (and the active tab) after this.
function applySyncedState() {
  try { state.bookmarks      = JSON.parse(localStorage.getItem('huda_bookmarks') || '[]'); } catch(e) {}
  try { state.surahBookmarks = JSON.parse(localStorage.getItem('huda_surah_bm') || '[]'); } catch(e) {}
  try { state.dhikrCounts    = JSON.parse(localStorage.getItem('huda_dhikr') || '{}'); } catch(e) {}
  state.tasbeeh  = parseInt(localStorage.getItem('huda_tasbeeh') || '0') || 0;
  state.darkMode = localStorage.getItem('huda_dark') === '1';
  state.fontSize = parseInt(localStorage.getItem('huda_fontsize') || '24') || 24;
  state.reciter  = localStorage.getItem('huda_reciter') || 'ar.alafasy';
  // Apply dark mode immediately
  document.documentElement.classList.toggle('dark', state.darkMode);
  // Re-evaluate dhikr daily reset in case huda_dhikr_date changed across devices
  checkDhikrReset();
}
```

- [ ] **Step 2: Commit**

```bash
git add js/sync.js
git commit -m "feat: add sync module (push/pull/merge)"
```

---

## Task 3: Auth UI modal + account button

**Files:**
- Modify: `index.html`
- Modify: `css/styles.css`

- [ ] **Step 1: Add account modal HTML to index.html**

After the `#install-banner` div (before `</div>` closing `#app`) add:

```html
<!-- Account Modal -->
<div id="auth-modal" class="auth-modal-overlay" style="display:none" onclick="closeAuthModal(event)">
  <div class="auth-modal-box" onclick="event.stopPropagation()">
    <button class="auth-modal-close" onclick="closeAuthModal()">✕</button>
    <div id="auth-modal-body"></div>
  </div>
</div>
```

Note: `onclick="event.stopPropagation()"` on `.auth-modal-box` ensures clicks inside the form (inputs, buttons) don't bubble to the overlay and accidentally close the modal.

- [ ] **Step 2: Add Supabase SDK + new JS files to index.html**

Before the existing `<script src="/js/data.js...">` line add:

```html
<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<!-- Auth & Sync -->
<script src="/js/auth.js?v=92"></script>
<script src="/js/sync.js?v=92"></script>
```

- [ ] **Step 3: Add auth + account button styles to css/styles.css**

Append to end of `css/styles.css`:

```css
/* ── Account Button ───────────────────────────────────────── */
.account-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.account-btn.signed-in { background: rgba(255,255,255,0.25); }

/* ── Auth Modal ───────────────────────────────────────────── */
.auth-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.auth-modal-box {
  background: var(--card-bg, #fff);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 340px;
  position: relative;
}
html.dark .auth-modal-box { background: #1e293b; color: #f1f5f9; }
.auth-modal-close {
  position: absolute;
  top: 12px; right: 12px;
  background: none; border: none;
  font-size: 18px; cursor: pointer;
  color: var(--gray-400, #94a3b8);
}
.auth-modal-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--emerald, #059669);
}
.auth-input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid var(--gray-200, #e2e8f0);
  border-radius: 10px;
  font-size: 15px;
  margin-bottom: 10px;
  box-sizing: border-box;
  background: var(--bg, #f8fafc);
  color: inherit;
}
html.dark .auth-input { background: #0f172a; border-color: #334155; }
.auth-btn-primary {
  width: 100%;
  padding: 12px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
}
.auth-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-switch-link {
  text-align: center;
  margin-top: 14px;
  font-size: 14px;
  color: var(--gray-400, #94a3b8);
}
.auth-switch-link a { color: #059669; cursor: pointer; text-decoration: none; font-weight: 600; }
.auth-error {
  color: #dc2626;
  font-size: 13px;
  margin-top: 6px;
  margin-bottom: 4px;
}
.auth-user-email {
  font-size: 14px;
  color: var(--gray-400, #94a3b8);
  margin-bottom: 16px;
  word-break: break-all;
}
.auth-btn-secondary {
  width: 100%;
  padding: 10px;
  background: none;
  border: 1.5px solid var(--gray-200, #e2e8f0);
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  color: inherit;
}
.sync-status {
  text-align: center;
  font-size: 12px;
  color: var(--gray-400, #94a3b8);
  margin-top: 8px;
}
```

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "feat: add auth modal HTML and CSS"
```

---

## Task 4: Auth + Sync logic in app.js

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add auth modal functions to app.js**

Add this block after the `state` object definition (after line ~91):

```js
// ── Auth Modal ────────────────────────────────────────────────
function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  // Use cached user for instant render; no async gap
  const user = authGetCachedUser();
  renderAuthModalBody(user ? 'account' : 'signin', user);
}

function closeAuthModal(e) {
  // Called from overlay onclick — only close if the overlay itself was clicked
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
      <input id="auth-pass" class="auth-input" type="password" placeholder="Password (min 6 chars)" autocomplete="new-password">
      <div id="auth-err" class="auth-error" style="display:none"></div>
      <button class="auth-btn-primary" onclick="handleSignUp()">Create Account</button>
      <div class="auth-switch-link">Already have an account? <a onclick="renderAuthModalBody('signin')">Sign in</a></div>
    `;
  } else {
    el.innerHTML = `
      <div class="auth-modal-title">Sign In</div>
      <input id="auth-email" class="auth-input" type="email" placeholder="Email" autocomplete="email">
      <input id="auth-pass" class="auth-input" type="password" placeholder="Password" autocomplete="current-password">
      <div id="auth-err" class="auth-error" style="display:none"></div>
      <button class="auth-btn-primary" onclick="handleSignIn()">Sign In</button>
      <div class="auth-switch-link">No account? <a onclick="renderAuthModalBody('signup')">Create one</a></div>
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
    await authSignUp(email, pass);
    // authOnChange will fire and trigger pullSync + pushSync
    document.getElementById('auth-modal').style.display = 'none';
  } catch(e) {
    showAuthError(e.message || 'Sign up failed.');
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

async function handleSignOut() {
  await authSignOut();
  document.getElementById('auth-modal').style.display = 'none';
  updateAccountBtn(null);
}

function showAuthError(msg) {
  const el = document.getElementById('auth-err');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function updateAccountBtn(user) {
  const btn = document.getElementById('account-btn');
  if (!btn) return;
  btn.textContent = user ? '👤' : '🔑';
  btn.classList.toggle('signed-in', !!user);
  btn.title = user ? `Signed in as ${user.email}` : 'Sign in / Create account';
}
```

- [ ] **Step 2: Add account button to the hero section in renderHome()**

In `renderHome()`, find the template literal line:
```js
    <div class="hero fade-in">
      <div class="hero-arabic">السَّلَامُ عَلَيْكُمْ</div>
```

Replace with:
```js
    <div class="hero fade-in" style="position:relative">
      <button class="account-btn" id="account-btn" onclick="openAuthModal()" title="Account">🔑</button>
      <div class="hero-arabic">السَّلَامُ عَلَيْكُمْ</div>
```

Then after `renderHome()` sets the innerHTML, call `updateAccountBtn` to restore the correct icon if the user is signed in. Add this line at the end of `renderHome()`, after `document.getElementById('tab-home').innerHTML = ...`:

```js
  // Restore account button state after re-render
  updateAccountBtn(authGetCachedUser());
```

- [ ] **Step 3: Initialize auth listener in the DOMContentLoaded block**

In the `document.addEventListener('DOMContentLoaded', ...)` block, after `setupInstallPrompt();`, add:

```js
  // Auth — fires on sign-in, sign-out, and page reload with existing session
  authOnChange(async user => {
    updateAccountBtn(user);
    if (user) {
      const changed = await pullSync();
      if (changed) {
        applySyncedState();
        renderHome();
        if (state.activeTab && state.activeTab !== 'home') {
          switchTab(state.activeTab);
        }
      }
      // Push local data so a new device gets it if remote is empty
      await pushSync();
    }
  });
```

- [ ] **Step 4: Add debouncedPush() after every localStorage mutation**

Correct function names (verified against codebase):

**`toggleBookmark()` — line ~143** (ayah bookmarks add/toggle):
```js
localStorage.setItem('huda_bookmarks', JSON.stringify(state.bookmarks));
debouncedPush(); // ← add
```

**`removeBookmark()` — line ~151** (ayah bookmark remove):
```js
localStorage.setItem('huda_bookmarks', JSON.stringify(state.bookmarks));
debouncedPush(); // ← add
```

**`toggleSurahBookmark()` — line ~162** (surah bookmark add/toggle):
```js
localStorage.setItem('huda_surah_bm', JSON.stringify(state.surahBookmarks));
debouncedPush(); // ← add
```

**`removeSurahBookmark()` — line ~177** (surah bookmark remove):
```js
localStorage.setItem('huda_surah_bm', JSON.stringify(state.surahBookmarks));
debouncedPush(); // ← add
```

**`tapDhikr()` — line ~1786** (dhikr tap):
```js
localStorage.setItem('huda_dhikr', JSON.stringify(state.dhikrCounts));
debouncedPush(); // ← add
```

**`tapTasbeeh()` — line ~1806**:
```js
localStorage.setItem('huda_tasbeeh', String(state.tasbeeh));
debouncedPush(); // ← add
```

**`resetTasbeeh()` — line ~1814**:
```js
localStorage.setItem('huda_tasbeeh', String(state.tasbeeh));
debouncedPush(); // ← add
```

**`toggleDarkMode()` — line ~118**:
```js
localStorage.setItem('huda_dark', state.darkMode ? '1' : '0');
debouncedPush(); // ← add
```

**`setReciter()` — line ~950**:
```js
localStorage.setItem('huda_reciter', id);
debouncedPush(); // ← add
```

**`changeFontSize()` — line ~2753** (font size, not `setFontSize`):
```js
localStorage.setItem('huda_fontsize', state.fontSize);
debouncedPush(); // ← add
```

**`openSurah()` — line ~543** (last read):
```js
localStorage.setItem('huda_last_read', JSON.stringify({ surah: n, name: s[2], arabic: s[1] }));
debouncedPush(); // ← add
```

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "feat: wire auth modal and sync hooks into app"
```

---

## Task 5: CSP update (vercel.json)

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Update Content-Security-Policy**

In `vercel.json`, edit the `Content-Security-Policy` header value:

Add `https://cdn.jsdelivr.net` to `script-src`:
```
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
```

Add `https://*.supabase.co https://cdn.jsdelivr.net` to `connect-src` (after `https://vitals.vercel-insights.com`):
```
connect-src 'self' https://vitals.vercel-insights.com https://*.supabase.co https://cdn.jsdelivr.net https://api.aladhan.com ...
```

(Keep all other existing domains in `connect-src` unchanged.)

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: add Supabase and jsDelivr to CSP"
```

---

## Task 6: Service worker + version bump + deploy

**Files:**
- Modify: `service-worker.js`
- Modify: `index.html`

- [ ] **Step 1: Add auth.js and sync.js to STATIC_ASSETS in service-worker.js**

In `service-worker.js`, find the `STATIC_ASSETS` array (the list of files cached on install). Add the two new files:

```js
'/js/auth.js',
'/js/sync.js',
```

- [ ] **Step 2: Bump cache version in service-worker.js**

```js
// Change:
const CACHE_NAME = 'huda-v91';
// To:
const CACHE_NAME = 'huda-v92';
```

- [ ] **Step 3: Bump version strings in index.html**

Update all `?v=91` query strings to `?v=92`:
- `css/styles.css?v=92`
- `js/adhan.min.js?v=92`
- `js/auth.js?v=92`
- `js/sync.js?v=92`
- `js/data.js?v=92`
- `js/app.js?v=92`

- [ ] **Step 4: Commit and deploy**

```bash
git add service-worker.js index.html
git commit -m "chore: bump to v92 — user accounts and sync"
npx vercel --prod
```

- [ ] **Step 5: Smoke test**
  - Open huda-six.vercel.app in a fresh browser (hard refresh to get v92 SW)
  - Tap the 🔑 button in the home header → sign in modal appears instantly (no flicker)
  - Create an account → button changes to 👤
  - Add a bookmark, tap dhikr, increment tasbeeh
  - Open the app in a second browser / incognito → sign in with same account → bookmark, dhikr counts, tasbeeh appear
  - Sign out → button returns to 🔑
  - Toggle dark mode → verify it syncs to the second browser after ~2s
