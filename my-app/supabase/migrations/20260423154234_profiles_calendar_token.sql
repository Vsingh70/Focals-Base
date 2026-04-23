-- Each user gets a random calendar_token used to authenticate the public
-- /api/calendar/<user_id>?token=... iCal feed. Regenerating the token
-- invalidates any subscribed calendar clients.

alter table public.profiles
  add column if not exists calendar_token text not null default gen_random_uuid()::text;

create unique index if not exists profiles_calendar_token_idx
  on public.profiles(calendar_token);
