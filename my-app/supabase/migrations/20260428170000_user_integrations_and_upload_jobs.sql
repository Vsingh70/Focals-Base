-- =============================================================
-- File-upload → LLM-extracted project creation
--
-- Two new tables:
--   user_integrations    — encrypted per-user API keys for LLM providers
--   project_upload_jobs  — audit trail of upload jobs (no file contents)
--
-- Encryption is performed in Node (AES-256-GCM) using the
-- LLM_KEY_ENCRYPTION_SECRET env var. The ciphertext + nonce + auth tag are
-- packed as `iv (12) || tag (16) || ciphertext` and stored in
-- encrypted_key (bytea). Postgres never sees the plaintext key or the
-- encryption secret, which means schema-level access (e.g. an admin
-- console) cannot recover the keys.
-- Idempotent: safe to re-run.
-- =============================================================

-- -------------------------------------------------------------
-- user_integrations
-- -------------------------------------------------------------
create table if not exists public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,                 -- 'anthropic' | 'openai' (future)
  encrypted_key bytea not null,           -- pgp_sym_encrypt(plaintext_key, $secret)
  key_hint text not null,                 -- masked display: 'sk-ant-…XYZ'
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

drop trigger if exists trg_user_integrations_updated_at on public.user_integrations;
create trigger trg_user_integrations_updated_at
  before update on public.user_integrations
  for each row execute function public.set_updated_at();

alter table public.user_integrations enable row level security;

drop policy if exists "user_integrations_owner_access" on public.user_integrations;
create policy "user_integrations_owner_access" on public.user_integrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- project_upload_jobs
-- -------------------------------------------------------------
create table if not exists public.project_upload_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes integer not null,
  status text not null default 'pending',  -- pending | extracted | committed | failed
  error text,
  extracted_count integer,
  committed_count integer,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists project_upload_jobs_user_created
  on public.project_upload_jobs (user_id, created_at desc);

alter table public.project_upload_jobs enable row level security;

drop policy if exists "project_upload_jobs_owner_access" on public.project_upload_jobs;
create policy "project_upload_jobs_owner_access" on public.project_upload_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
