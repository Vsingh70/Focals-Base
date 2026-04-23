-- =============================================================
-- [APP_NAME] — database schema
-- Task 02 — fresh, normalized, multi-tenant with RLS
-- Idempotent: safe to re-run.
-- Apply via Supabase SQL editor (dashboard → SQL) or psql.
-- =============================================================

-- -------------------------------------------------------------
-- Extensions
-- -------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- Shared: updated_at trigger function
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =============================================================
-- profiles — extends auth.users
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  email text,
  avatar_url text,
  website text,
  instagram_handle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- clients
-- =============================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  notes text,
  source text, -- 'inquiry','referral','instagram','website','manual'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists clients_created_at_idx on public.clients(created_at desc);

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- =============================================================
-- projects
-- =============================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  category text, -- 'portrait','graduation','editorial','event','commercial'
  status text not null default 'inquiry', -- 'inquiry','booked','in_progress','editing','delivered','completed','cancelled'
  shoot_date date,
  location text,
  package_price numeric(10,2),
  amount_paid numeric(10,2) default 0,
  payment_status text default 'unpaid', -- 'unpaid','partial','paid'
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_client_id_idx on public.projects(client_id);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_created_at_idx on public.projects(created_at desc);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- =============================================================
-- shoots
-- =============================================================
create table if not exists public.shoots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  scheduled_at timestamptz not null,
  duration_minutes int default 60,
  location text,
  status text default 'scheduled', -- 'scheduled','completed','cancelled','rescheduled'
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shoots_user_id_idx on public.shoots(user_id);
create index if not exists shoots_scheduled_at_idx on public.shoots(scheduled_at);
create index if not exists shoots_project_id_idx on public.shoots(project_id);
create index if not exists shoots_client_id_idx on public.shoots(client_id);

drop trigger if exists trg_shoots_updated_at on public.shoots;
create trigger trg_shoots_updated_at
  before update on public.shoots
  for each row execute function public.set_updated_at();

-- =============================================================
-- finances
-- =============================================================
create table if not exists public.finances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  type text not null, -- 'income' | 'expense'
  category text, -- 'session_fee','print_sale','gear','software','travel','misc'
  amount numeric(10,2) not null,
  description text,
  date date not null,
  payment_method text, -- 'venmo','zelle','check','cash','stripe'
  created_at timestamptz not null default now()
);
create index if not exists finances_user_id_idx on public.finances(user_id);
create index if not exists finances_date_idx on public.finances(date);
create index if not exists finances_type_idx on public.finances(type);
create index if not exists finances_project_id_idx on public.finances(project_id);

-- =============================================================
-- gear
-- =============================================================
create table if not exists public.gear (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text, -- 'camera','lens','lighting','audio','bag','misc'
  brand text,
  model text,
  serial_number text,
  purchase_price numeric(10,2),
  purchase_date date,
  status text default 'owned', -- 'owned','wishlist','sold','rented'
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists gear_user_id_idx on public.gear(user_id);

-- =============================================================
-- inquiries
-- =============================================================
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null, -- 'website_form','email','instagram','manual'
  source_handle text,
  name text not null,
  email text,
  phone text,
  shoot_type text,
  preferred_date date,
  message text,
  status text default 'new', -- 'new','read','replied','converted','archived'
  converted_client_id uuid references public.clients(id) on delete set null,
  converted_project_id uuid references public.projects(id) on delete set null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inquiries_user_id_idx on public.inquiries(user_id);
create index if not exists inquiries_status_idx on public.inquiries(status);
create index if not exists inquiries_created_at_idx on public.inquiries(created_at desc);

drop trigger if exists trg_inquiries_updated_at on public.inquiries;
create trigger trg_inquiries_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

-- =============================================================
-- inquiry_sources
-- =============================================================
create table if not exists public.inquiry_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, -- 'website','email','instagram','custom'
  label text not null,
  config jsonb,
  is_active boolean default true,
  created_at timestamptz not null default now()
);
create index if not exists inquiry_sources_user_id_idx on public.inquiry_sources(user_id);

-- =============================================================
-- contract_templates
-- =============================================================
create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contract_templates_user_id_idx on public.contract_templates(user_id);

drop trigger if exists trg_contract_templates_updated_at on public.contract_templates;
create trigger trg_contract_templates_updated_at
  before update on public.contract_templates
  for each row execute function public.set_updated_at();

-- =============================================================
-- contracts
-- =============================================================
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid references public.contract_templates(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  body text not null,
  custom_fields jsonb default '{}'::jsonb,
  status text default 'draft', -- 'draft','sent','signed','void'
  sent_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contracts_user_id_idx on public.contracts(user_id);
create index if not exists contracts_project_id_idx on public.contracts(project_id);
create index if not exists contracts_client_id_idx on public.contracts(client_id);
create index if not exists contracts_status_idx on public.contracts(status);

drop trigger if exists trg_contracts_updated_at on public.contracts;
create trigger trg_contracts_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- =============================================================
-- forms
-- =============================================================
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists forms_user_id_idx on public.forms(user_id);

drop trigger if exists trg_forms_updated_at on public.forms;
create trigger trg_forms_updated_at
  before update on public.forms
  for each row execute function public.set_updated_at();

-- =============================================================
-- links
-- =============================================================
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  category text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists links_user_id_idx on public.links(user_id);

-- =============================================================
-- Row Level Security
-- Every table: auth.uid() must match user_id on read/write.
-- profiles is special: auth.uid() = id.
-- =============================================================

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.shoots enable row level security;
alter table public.finances enable row level security;
alter table public.gear enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_sources enable row level security;
alter table public.contract_templates enable row level security;
alter table public.contracts enable row level security;
alter table public.forms enable row level security;
alter table public.links enable row level security;

-- profiles: self-access keyed on id
drop policy if exists "profiles_self_access" on public.profiles;
create policy "profiles_self_access" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- generic per-user policies
drop policy if exists "clients_owner_access" on public.clients;
create policy "clients_owner_access" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_owner_access" on public.projects;
create policy "projects_owner_access" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "shoots_owner_access" on public.shoots;
create policy "shoots_owner_access" on public.shoots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "finances_owner_access" on public.finances;
create policy "finances_owner_access" on public.finances
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gear_owner_access" on public.gear;
create policy "gear_owner_access" on public.gear
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "inquiries_owner_access" on public.inquiries;
create policy "inquiries_owner_access" on public.inquiries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "inquiry_sources_owner_access" on public.inquiry_sources;
create policy "inquiry_sources_owner_access" on public.inquiry_sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "contract_templates_owner_access" on public.contract_templates;
create policy "contract_templates_owner_access" on public.contract_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "contracts_owner_access" on public.contracts;
create policy "contracts_owner_access" on public.contracts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "forms_owner_access" on public.forms;
create policy "forms_owner_access" on public.forms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "links_owner_access" on public.links;
create policy "links_owner_access" on public.links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
