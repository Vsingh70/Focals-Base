-- =============================================================
-- Make sync_project_income honor payment_status changes.
--
-- Today: the trigger only fires on changes to amount_paid / shoot_date /
-- title. Flipping payment_status from 'unpaid' to 'paid' WITHOUT also
-- typing a number into the amount_paid field never reaches the
-- finances ledger, so the dashboard's Revenue this month stays at $0
-- and the project never appears on /finances.
--
-- After this migration: changing payment_status to 'paid' implies
-- "the full package_price was received" if no other amount_paid is set,
-- and the trigger writes the corresponding income row. payment_status
-- transitions away from 'paid' (e.g. 'paid' → 'partial') leave the
-- ledger alone — manual cleanup is the user's call.
--
-- Idempotent: re-running drops + recreates the function and trigger.
-- =============================================================

create or replace function public.sync_project_income()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  finance_date date;
  effective_amount numeric;
begin
  finance_date := coalesce((new.shoot_date::date), now()::date);

  -- Decide what amount represents this project's income for ledger purposes.
  -- Priority:
  --   1. amount_paid as set on the project (user typed a number).
  --   2. If amount_paid is 0 but payment_status is 'paid', treat the
  --      full package_price as paid — the user marked the project paid
  --      without typing the duplicate number.
  --   3. Otherwise zero (no income to record).
  effective_amount := coalesce(new.amount_paid, 0);
  if effective_amount <= 0 and new.payment_status = 'paid' then
    effective_amount := coalesce(new.package_price, 0);
  end if;

  -- No income to record: drop any prior auto-created income row.
  if effective_amount <= 0 then
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
       set amount = effective_amount,
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
      effective_amount,
      finance_date,
      'Auto: ' || new.title,
      'project_payment'
    );
  end if;
  return new;
end;
$$;

-- Recreate the trigger with payment_status + package_price added to the
-- watched columns. Without this, flipping payment_status alone wouldn't
-- fire the trigger even though the function now handles it.
drop trigger if exists trg_sync_project_income on public.projects;
create trigger trg_sync_project_income
  after insert or update of amount_paid, shoot_date, title, payment_status, package_price on public.projects
  for each row execute function public.sync_project_income();

-- One-time backfill: for every project where payment_status='paid' but
-- there's no income row yet (because the prior trigger never fired),
-- create one now using package_price as the amount.
insert into public.finances (user_id, project_id, type, amount, date, description, category)
select
  p.user_id,
  p.id,
  'income',
  coalesce(p.package_price, 0),
  coalesce(p.shoot_date::date, p.updated_at::date),
  'Auto: ' || p.title,
  'project_payment'
from public.projects p
where p.payment_status = 'paid'
  and coalesce(p.amount_paid, 0) <= 0
  and coalesce(p.package_price, 0) > 0
  and not exists (
    select 1 from public.finances f
    where f.project_id = p.id and f.user_id = p.user_id and f.type = 'income'
  );
