# Task 02 — Database Schema Redesign (Supabase / PostgreSQL)

## Goal
Replace the original schema (JSONB blobs, unnormalized) with a fully relational, multi-tenant schema. Every table scoped to `user_id` with Row Level Security enforced at DB level.

---

## Core Tables

### users (managed by Supabase Auth — extend with profiles)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  business_name TEXT,
  email TEXT,
  avatar_url TEXT,
  website TEXT,
  instagram_handle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### clients
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  source TEXT, -- 'inquiry', 'referral', 'instagram', 'website', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON clients(user_id);
```

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT, -- 'portrait', 'graduation', 'editorial', 'event', 'commercial'
  status TEXT NOT NULL DEFAULT 'inquiry', -- 'inquiry','booked','in_progress','editing','delivered','completed','cancelled'
  shoot_date DATE,
  location TEXT,
  package_price NUMERIC(10,2),
  amount_paid NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid','partial','paid'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON projects(user_id);
CREATE INDEX ON projects(client_id);
CREATE INDEX ON projects(status);
```

### shoots
```sql
CREATE TABLE shoots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  location TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled','completed','cancelled','rescheduled'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON shoots(user_id);
CREATE INDEX ON shoots(scheduled_at);
CREATE INDEX ON shoots(project_id);
```

### finances
```sql
CREATE TABLE finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'income' | 'expense'
  category TEXT, -- 'session_fee','print_sale','gear','software','travel','misc'
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  payment_method TEXT, -- 'venmo','zelle','check','cash','stripe'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON finances(user_id);
CREATE INDEX ON finances(date);
CREATE INDEX ON finances(type);
```

### gear
```sql
CREATE TABLE gear (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- 'camera','lens','lighting','audio','bag','misc'
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_price NUMERIC(10,2),
  purchase_date DATE,
  status TEXT DEFAULT 'owned', -- 'owned','wishlist','sold','rented'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON gear(user_id);
```

### inquiries
```sql
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'website_form','email','instagram','manual'
  source_handle TEXT, -- e.g. instagram username or email address
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  shoot_type TEXT,
  preferred_date DATE,
  message TEXT,
  status TEXT DEFAULT 'new', -- 'new','read','replied','converted','archived'
  converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  converted_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  raw_payload JSONB, -- store original webhook/email payload for debugging
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON inquiries(user_id);
CREATE INDEX ON inquiries(status);
CREATE INDEX ON inquiries(created_at DESC);
```

### inquiry_sources (user-configurable intake channels)
```sql
CREATE TABLE inquiry_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'website','email','instagram','custom'
  label TEXT NOT NULL, -- e.g. "vflics.com Contact Form"
  config JSONB, -- e.g. { "webhook_secret": "...", "form_url": "..." }
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON inquiry_sources(user_id);
```

### contracts
```sql
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  body TEXT NOT NULL, -- markdown/text with merge tags like {{client_name}}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL, -- rendered body with merge tags replaced
  custom_fields JSONB DEFAULT '{}', -- project-specific additions
  status TEXT DEFAULT 'draft', -- 'draft','sent','signed','void'
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON contracts(user_id);
CREATE INDEX ON contract_templates(user_id);
```

### forms & links (existing — keep normalized)
```sql
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security Policies

Apply to every table:

```sql
-- Example for projects (repeat pattern for all tables)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Apply the same `auth.uid() = user_id` pattern to: `clients`, `shoots`, `finances`, `gear`, `inquiries`, `inquiry_sources`, `contracts`, `contract_templates`, `forms`, `links`.

---

## Acceptance Criteria
- [ ] All tables created with correct types and constraints
- [ ] Foreign keys use `ON DELETE CASCADE` or `SET NULL` as appropriate
- [ ] Indexes exist on all `user_id`, `created_at DESC`, and foreign key columns
- [ ] RLS enabled and policies applied to every table
- [ ] Supabase types generated: `npx supabase gen types typescript --local > lib/supabase/types.ts`
- [ ] No JSONB used for structured relational data (only for raw payloads and flexible config)
