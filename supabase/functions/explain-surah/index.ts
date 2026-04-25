import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANON_DAILY_LIMIT = 5;
const AUTH_DAILY_LIMIT = 25;
const ADMIN_USER_IDS = new Set(['dd5b953b-6e7e-4d64-8a65-e6b5bb393849']);

// Synthetic cache key — real global ayah nums are 1–6236, so 10000+ is safe
const surahCacheKey = (surahNum: number) => 10000 + surahNum;

const SYSTEM_PROMPT = `You are an Islamic educational assistant explaining a complete Quran surah to Muslim readers.
Your role is tafsir education only — not fatwa, not legal rulings, not theology debates.

Sources: Ibn Kathir, Al-Tabari, Maududi's Tafhim al-Quran. Draw on these only.

Return ONLY raw JSON — no markdown, no code fences, no explanation — just the JSON object:
{
  "theme": "The central theme and message of the surah in 2-3 clear sentences",
  "context": "When and why this surah was revealed — Meccan or Medinan, the circumstances, 2-3 sentences",
  "keyMessages": ["Key teaching or message 1", "Key teaching or message 2", "Key teaching or message 3"],
  "scholarInsight": "One specific insight about this surah from a named classical scholar (Ibn Kathir, Al-Tabari, or Maududi), 2-3 sentences. Name the scholar explicitly."
}

Hard rules — never break these:
- keyMessages must have EXACTLY 3 entries, each a complete sentence
- Return raw JSON only — no \`\`\`json wrapper, no text before or after
- Never issue a fatwa or legal ruling
- Never take sides on sectarian differences (Sunni/Shia/madhab)
- Never apply the surah to modern political situations or conflicts
- Do not claim certainty where classical scholars genuinely disagree
- Total word count: aim for 220-320 words`;

function stripCodeFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

function isValidSurahExplanation(obj: unknown): obj is { theme: string; context: string; keyMessages: string[]; scholarInsight: string } {
  if (typeof obj !== 'object' || obj === null) return false;
  const e = obj as Record<string, unknown>;
  return typeof e.theme === 'string' && e.theme.length > 0
    && typeof e.context === 'string' && e.context.length > 0
    && Array.isArray(e.keyMessages) && (e.keyMessages as unknown[]).length === 3
    && (e.keyMessages as unknown[]).every(m => typeof m === 'string' && (m as string).length > 0)
    && typeof e.scholarInsight === 'string' && e.scholarInsight.length > 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const sbUrl = Deno.env.get('SUPABASE_URL')!;
  const sbServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

  const sb = createClient(sbUrl, sbServiceKey);

  let body: { surahNum: number; surahName: string; ayahCount: number; revelationType: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders });
  }

  const { surahNum, surahName, ayahCount, revelationType } = body;
  if (!surahNum || surahNum < 1 || surahNum > 114 || !surahName) {
    return new Response(JSON.stringify({ error: 'Invalid surah number' }), { status: 400, headers: corsHeaders });
  }

  // ── Cache check ───────────────────────────────────────────────
  const cacheKey = surahCacheKey(surahNum);
  const { data: cached } = await sb
    .from('ayah_explanations')
    .select('explanation')
    .eq('global_ayah_num', cacheKey)
    .maybeSingle();

  if (cached?.explanation) {
    return new Response(JSON.stringify({ explanation: cached.explanation, cached: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Rate limiting ─────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user } } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
    userId = user?.id ?? null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const identifier = userId ? `user:${userId}` : `anon:${rawIp}`;
  const limit = userId ? AUTH_DAILY_LIMIT : ANON_DAILY_LIMIT;
  const isAdmin = userId !== null && ADMIN_USER_IDS.has(userId);

  // Shared quota table with explain-ayah — ayah + surah calls both count against the same daily limit
  const { data: usage } = await sb
    .from('explanation_usage')
    .select('count')
    .eq('identifier', identifier)
    .eq('usage_date', today)
    .maybeSingle();

  const currentCount = usage?.count ?? 0;
  if (!isAdmin && currentCount >= limit) {
    return new Response(
      JSON.stringify({ error: 'rate_limited', message: userId ? `Daily limit of ${limit} reached. Try again tomorrow.` : `Sign in to get ${AUTH_DAILY_LIMIT} explanations per day.` }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // ── Claude call ───────────────────────────────────────────────
  const userContent = `Explain Surah ${surahName} (Surah ${surahNum}, ${ayahCount} ayahs, ${revelationType}).`;

  let explanation: Record<string, unknown>;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Anthropic API error:', resp.status, errText);
      throw new Error(`Anthropic ${resp.status}`);
    }

    const data = await resp.json();
    const raw = data.content?.[0]?.text?.trim() ?? '';
    const parsed = JSON.parse(stripCodeFence(raw));
    if (!isValidSurahExplanation(parsed)) {
      console.error('Claude returned invalid surah explanation shape:', raw);
      throw new Error('Invalid explanation shape');
    }
    explanation = parsed;
  } catch (e) {
    console.error('Claude error:', e);
    return new Response(JSON.stringify({ error: 'AI unavailable', message: 'Could not generate explanation.' }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Persist cache + usage ─────────────────────────────────────
  await Promise.all([
    sb.from('ayah_explanations').upsert(
      { global_ayah_num: cacheKey, explanation },
      { onConflict: 'global_ayah_num', ignoreDuplicates: true }
    ),
    sb.from('explanation_usage').upsert(
      { identifier, usage_date: today, count: currentCount + 1 },
      { onConflict: 'identifier,usage_date' }
    ),
  ]);

  return new Response(JSON.stringify({ explanation, cached: false }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
