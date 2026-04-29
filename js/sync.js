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
  'huda_plan',
  'huda_dhikr_history',
  'huda_streak',
  'huda_furthest_read',
  'huda_onboarded',
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
  state.darkMode = localStorage.getItem('huda_dark') !== '0';
  state.fontSize = parseInt(localStorage.getItem('huda_fontsize') || '28') || 28;
  state.reciter  = localStorage.getItem('huda_reciter') || 'ar.mahermuaiqly';
  try { state.plan = JSON.parse(localStorage.getItem('huda_plan') || 'null'); } catch(e) {}
  try { const r = JSON.parse(localStorage.getItem('huda_streak') || '{}'); state.streak = { count: parseInt(r.count, 10) || 0, lastDate: typeof r.lastDate === 'string' ? r.lastDate : null }; } catch(e) {}
  // dhikr_history is read directly from localStorage by getDhikrHistory() — no state field needed
  // Apply dark mode immediately
  document.documentElement.classList.toggle('dark', state.darkMode);
  // Re-evaluate dhikr daily reset in case huda_dhikr_date changed across devices
  checkDhikrReset();
}
