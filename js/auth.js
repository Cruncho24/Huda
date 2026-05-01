// ── Supabase Auth ─────────────────────────────────────────────
// Supabase anon key is intentionally public — RLS policies enforce per-user isolation.

const SUPABASE_URL  = 'https://yfzjvxzeomrmsasqqwqd.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmemp2eHplb21ybXNhc3Fxd3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTQ1OTMsImV4cCI6MjA4OTY5MDU5M30.0wvjwGpuuyy0gQHAhuOXXEREVqQVHesqW-JsJXU5LcA';

let _sb = null;
let _cachedUser = null; // avoids async gap in renderAuthModalBody

function _getClient() {
  if (typeof supabase === 'undefined') throw new Error('Supabase SDK unavailable');
  if (!_sb) _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

async function authSignUp(email, password) {
  const { data, error } = await _getClient().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: 'https://hudacompanion.com/auth/confirm' },
  });
  if (error) throw error;
  // session is null when email confirmation is required
  _cachedUser = data.session?.user ?? null;
  return { user: data.user, session: data.session };
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

async function authResetPassword(email) {
  const { error } = await _getClient().auth.resetPasswordForEmail(email, {
    redirectTo: 'https://hudacompanion.com/auth/reset',
  });
  if (error) throw error;
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
