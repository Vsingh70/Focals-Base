-- =============================================================
-- shoot_date semantics change: instant → wall-clock.
--
-- Until now, the form converted the user's local datetime-local input
-- through `new Date(...).toISOString()` — meaning a user in EDT entering
-- "8:30" wrote 12:30 UTC into the database. That was correct under
-- "instant in absolute time" semantics, but viewers saw the time
-- formatted in different timezones (Vercel server vs browser), so the
-- displayed time disagreed depending on where it was rendered.
--
-- The new model treats shoot_date as wall-clock: the digits the
-- photographer typed are the digits we want to display, regardless of
-- viewer timezone. Storage convention: anchor everything at +00 so the
-- UTC components ARE the wall-clock value, and every renderer formats
-- with timeZone: 'UTC'.
--
-- Backfill: subtract 4 hours from every existing shoot_date. The user
-- is in EDT (UTC-4), and every prior write went through
-- toISOString() — so the stored UTC value is always wall_clock + 4h.
-- Run-once migration.
--
-- Side effects on the noon-UTC rows from 20260429210000:
--   12:00:00 UTC → 08:00:00 UTC. Those were the LLM-imported rows that
--   had no original time anyway; 8 AM is a reasonable photography start.
--   The user can edit individual rows if a different time is wanted.
--
-- Idempotent guard: this migration only runs if the bookkeeping flag
-- below isn't set. Re-running with the flag present is a no-op.
-- =============================================================

create table if not exists public._migration_marks (
  key text primary key,
  applied_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from public._migration_marks where key = '20260430000000_shoot_date_wall_clock'
  ) then
    update public.projects
       set shoot_date = shoot_date - interval '4 hours'
     where shoot_date is not null;

    insert into public._migration_marks (key) values ('20260430000000_shoot_date_wall_clock');
  end if;
end$$;
