-- =============================================================
-- Promote projects.shoot_date from `date` to `timestamptz`
--
-- The column was originally `date`, but the form now sends a full
-- ISO timestamp (date + time). Postgres was silently truncating the
-- time portion to midnight, so users saw their carefully-set times
-- vanish on save.
--
-- Tricky bit: the trg_sync_project_income trigger added in
-- 20260429000000 references shoot_date in its UPDATE-OF clause, so
-- Postgres blocks the type change until the trigger is dropped.
-- We drop, alter, recreate. The trigger function itself doesn't need
-- to change — it casts shoot_date to date inside, which works on a
-- timestamptz too.
--
-- The cast is safe: every existing `date` value becomes that day at
-- 00:00 UTC. Going forward, the form's full timestamp is preserved.
-- Idempotent — re-running is a no-op once the type is timestamptz.
-- =============================================================

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'projects'
      and column_name  = 'shoot_date'
      and data_type    = 'date'
  ) then
    drop trigger if exists trg_sync_project_income on public.projects;

    alter table public.projects
      alter column shoot_date type timestamptz
      using shoot_date::timestamptz;

    create trigger trg_sync_project_income
      after insert or update of amount_paid, shoot_date, title on public.projects
      for each row execute function public.sync_project_income();
  end if;
end$$;
