-- =============================================================
-- Snap UTC-midnight shoot_dates to noon UTC.
--
-- Why: 20260429180000 promoted projects.shoot_date from `date` to
-- `timestamptz`. The cast (`shoot_date::timestamptz`) turned every
-- pre-existing date value into that day at 00:00:00 UTC. Any client
-- west of UTC then renders the value as the *previous* day at the
-- local UTC offset (e.g. 20:00 in EDT) — visible on the projects
-- list, calendar, and project detail since those are client-rendered.
-- The dashboard's UpcomingProjects strip is a server component and
-- runs in UTC, so it incidentally rendered correctly.
--
-- Bare-date imports from the LLM upload flow have the same shape
-- (the prompt explicitly returns "YYYY-MM-DD" when no time is given,
-- which Postgres stores as 00:00:00 UTC).
--
-- Fix: every row whose shoot_date is exactly UTC midnight and has
-- no fractional second is treated as a date-only intent, and is
-- bumped to 12:00:00 UTC. Noon UTC renders as the same calendar
-- day in any timezone from UTC-11 (Samoa) through UTC+11 (Solomons),
-- which covers every populated tz on Earth.
--
-- Rows with a real time-of-day (e.g. 15:00:00 UTC) are left alone.
--
-- Idempotent: re-running matches no rows the second time, since the
-- new value is noon, not midnight.
-- =============================================================

update public.projects
   set shoot_date = date_trunc('day', shoot_date) + interval '12 hours'
 where shoot_date is not null
   and shoot_date = date_trunc('day', shoot_date);
