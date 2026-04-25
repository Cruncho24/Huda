import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANON_DAILY_LIMIT = 5;
const AUTH_DAILY_LIMIT = 25;
const ADMIN_USER_IDS = new Set(['dd5b953b-6e7e-4d64-8a65-e6b5bb393849']);

const SYSTEM_PROMPT = `You are an Islamic educational assistant explaining Quran ayahs to Muslim readers.
Your role is tafsir education only — not fatwa, not legal rulings, not theology debates.

Sources: the classical Sunni tafsir tradition (the works of Ibn Kathir, Al-Tabari, Maududi). Draw on these traditions only — but never name any scholar in your output.

Return ONLY raw JSON — no markdown, no code fences, no explanation — just the JSON object:
{
  "meaning": "Plain meaning in 2-3 clear sentences",
  "context": "Historical or revelation context in 2-3 sentences. If no specific occasion of revelation is known, describe the broader Meccan or Medinan context.",
  "wordStudy": [
    {"arabic": "one key word in Arabic script", "root": "trilateral Arabic root", "meaning": "what this word carries that English translation loses"}
  ],
  "scholarInsight": "What the classical tafsir tradition generally understood or emphasised about this ayah, 2-3 sentences. Do NOT name or attribute to any specific scholar — describe the general classical view only."
}

Hard rules — never break these:
- wordStudy must have EXACTLY 1 entry (one word only, pick the most theologically rich)
- Return raw JSON only — no \`\`\`json wrapper, no text before or after the JSON
- Never issue a fatwa or legal ruling
- Never name any specific scholar anywhere in the output — general classical view only throughout
- Never take sides on sectarian differences (Sunni/Shia/madhab)
- Never apply the ayah to modern political situations or conflicts
- Never authenticate or discuss hadith
- Do not claim certainty where classical scholars genuinely disagree
- If a field would require speculation beyond classical scholarship, write: "Classical sources do not record a specific occasion for this — it is part of the broader Medinan/Meccan revelation."
- Total word count: match the ayah's complexity — aim for ~150 words for a short ayah, ~250 for a medium ayah, ~300-350 for a long ayah (e.g. Ayat al-Kursi, long Baqarah ayahs). Err toward completeness rather than brevity for long ayahs`;

function stripCodeFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

function isValidExplanation(obj: unknown): obj is { meaning: string; context: string; wordStudy: Array<{arabic: string; root: string; meaning: string}>; scholarInsight: string } {
  if (typeof obj !== 'object' || obj === null) return false;
  const e = obj as Record<string, unknown>;
  return typeof e.meaning === 'string' && e.meaning.length > 0
    && typeof e.context === 'string' && e.context.length > 0
    && Array.isArray(e.wordStudy) && (e.wordStudy as unknown[]).length > 0
    && (e.wordStudy as unknown[]).every(w => {
        if (typeof w !== 'object' || w === null) return false;
        const entry = w as Record<string, unknown>;
        return typeof entry.arabic === 'string' && entry.arabic.length > 0
          && typeof entry.root === 'string' && entry.root.length > 0
          && typeof entry.meaning === 'string' && entry.meaning.length > 0;
      })
    && typeof e.scholarInsight === 'string' && e.scholarInsight.length > 0;
}

// verify_jwt is disabled — this function handles auth itself for rate-limit tiering.
// Rate limiting + service_role-only writes provide the abuse protection JWT would otherwise give.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const sbUrl = Deno.env.get('SUPABASE_URL')!;
  const sbServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

  const sb = createClient(sbUrl, sbServiceKey);

  let body: { globalAyahNum: number; surahNum: number; ayahNum: number; surahName: string; arabicText?: string; englishText?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders });
  }

  const { globalAyahNum, surahNum, ayahNum, surahName, arabicText, englishText } = body;
  if (!globalAyahNum || !surahNum || !ayahNum) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
  }

  // ── Cache check ───────────────────────────────────────────────
  const { data: cached } = await sb
    .from('ayah_explanations')
    .select('explanation')
    .eq('global_ayah_num', globalAyahNum)
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
  // Take only the first IP when x-forwarded-for is a comma-separated list
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const identifier = userId ? `user:${userId}` : `anon:${rawIp}`;
  const limit = userId ? AUTH_DAILY_LIMIT : ANON_DAILY_LIMIT;
  const isAdmin = userId !== null && ADMIN_USER_IDS.has(userId);

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

  // ── Claude call via REST API ──────────────────────────────────
  const userContent = [
    `Explain ${surahName} (${surahNum}:${ayahNum}).`,
    arabicText ? `Arabic: ${arabicText}` : '',
    englishText ? `Translation: ${englishText}` : '',
  ].filter(Boolean).join('\n');

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
        max_tokens: 1500,
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
    if (!isValidExplanation(parsed)) {
      console.error('Claude returned invalid explanation shape:', raw);
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
    // upsert + ignoreDuplicates guards against concurrent cache-miss double-insert
    sb.from('ayah_explanations').upsert(
      { global_ayah_num: globalAyahNum, explanation },
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
