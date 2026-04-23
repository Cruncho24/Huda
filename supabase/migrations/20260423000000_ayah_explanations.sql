-- AI-generated tafsir explanations (permanent cache — Quran text never changes)
create table if not exists ayah_explanations (
  global_ayah_num integer primary key,
  explanation      jsonb        not null,
  created_at       timestamptz  default now()
);

-- Per-identity daily usage tracking for rate limiting
create table if not exists explanation_usage (
  identifier  text  not null,
  usage_date  date  not null,
  count       integer not null default 1,
  primary key (identifier, usage_date)
);

-- RLS: explanations are publicly readable (cached data is not sensitive)
alter table ayah_explanations enable row level security;
create policy "Public read explanations"
  on ayah_explanations for select using (true);

-- Edge function uses service_role key so it bypasses RLS for writes
-- Usage table: edge function only (service_role), no client access needed
alter table explanation_usage enable row level security;
