-- =============================================================
-- Drop the shoots concept + auto-create finance income from projects
--
-- Two interlinked changes:
--
-- 1. The `shoots` table is removed. The `projects.shoot_date` column
--    already captures when a session happens, so a separate shoots table
--    was duplicating data. No FKs reference shoots, so the drop is clean.
--
-- 2. `projects.amount_paid` previously had to be mirrored into the
--    `finances` ledger by hand (or the dashboard's Revenue MTD KPI would
--    show $0). A trigger now keeps a single 'income' finances row in sync
--    per project, so revenue tracking is automatic and idempotent.
--
-- Idempotent: safe to re-run.
-- =============================================================

drop table if exists public.shoots cascade;

-- -------------------------------------------------------------
-- Auto-sync trigger: one finances "income" row per project, mirroring
-- amount_paid. Fired on insert/update of (amount_paid, shoot_date, title).
-- -------------------------------------------------------------
create or replace function public.sync_project_income()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  finance_date date;
begin
  finance_date := coalesce((new.shoot_date::date), now()::date);

  -- Payment removed or zero → drop any prior auto-created income row.
  if coalesce(new.amount_paid, 0) <= 0 then
    delete from public.finances
     where project_id = new.id
       and user_id = new.user_id
       and type = 'income';
    return new;
  end if;

  -- Upsert the per-project income row. We identify "the project's income
  -- row" by (project_id, type='income'); manually-entered finance rows of
  -- type='expense' for the same project, or income rows tied to a different
  -- project (or no project), are untouched.
  if exists (select 1 from public.finances
              where project_id = new.id
                and user_id = new.user_id
                and type = 'income') then
    update public.finances
       set amount = new.amount_paid,
           date = finance_date,
           description = coalesce(description, 'Auto: ' || new.title)
     where project_id = new.id
       and user_id = new.user_id
       and type = 'income';
  else
    insert into public.finances (user_id, project_id, type, amount, date, description, category)
    values (
      new.user_id,
      new.id,
      'income',
      new.amount_paid,
      finance_date,
      'Auto: ' || new.title,
      'project_payment'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_project_income on public.projects;
create trigger trg_sync_project_income
  after insert or update of amount_paid, shoot_date, title on public.projects
  for each row execute function public.sync_project_income();

-- -------------------------------------------------------------
-- Backfill: create income rows for every existing project with
-- amount_paid > 0 that doesn't already have one. Safe to re-run.
-- -------------------------------------------------------------
insert into public.finances (user_id, project_id, type, amount, date, description, category)
select
  p.user_id,
  p.id,
  'income',
  p.amount_paid,
  coalesce(p.shoot_date::date, p.updated_at::date),
  'Auto: ' || p.title,
  'project_payment'
from public.projects p
where coalesce(p.amount_paid, 0) > 0
  and not exists (
    select 1 from public.finances f
    where f.project_id = p.id and f.user_id = p.user_id and f.type = 'income'
  );
