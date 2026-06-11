create table if not exists public.waitlist_signups (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- one row per email (case-insensitive); lets us detect duplicates → 409
create unique index if not exists waitlist_signups_email_key
  on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;
-- No policies = no anon/auth access. The service-role key bypasses RLS.
