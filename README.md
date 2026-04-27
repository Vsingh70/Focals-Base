# [APP_NAME]

A photography business management platform for solo operators and small studios. Centralizes inquiries, projects, clients, shoots, finances, contracts, gear, links, and forms in one place.

> The codename `[APP_NAME]` is a placeholder. The display name in the UI is read from `NEXT_PUBLIC_APP_NAME` at build time, so a real product name can be wired up later by changing one env var.

## Features

- **Dashboard** — KPI cards (revenue MTD, active projects, upcoming shoots, pending payments) and 6-month income/expense + project-status charts.
- **Inbox** — unified inquiry intake from a website widget, Resend / Zapier / Typeform webhooks, and manual entries. Convert-to-client and convert-to-project flows.
- **Calendar** — desktop month/week/day views (react-big-calendar) and an iOS-style stacked-month grid on mobile/tablet. Public iCal feed for Apple Calendar and Google Calendar subscription.
- **Projects, Clients, Shoots, Finances** — full CRUD with status pipelines, payment tracking, period-based finance reporting.
- **Contracts** — reusable templates with merge tags, custom fields per contract, PDF export via `@react-pdf/renderer`.
- **Gear, Forms, Links, Settings** — equipment tracking with total-value, drag-and-drop form builder, categorized link bookmarks, profile + integrations + appearance + account.
- **In-app tutorials** — first-run guided tours per page, plus a permanent `/help` section with module guides.
- **Embeddable inquiry widget** — vanilla JS bundle hosted at `/widget/inquiry.js`, with Shadow DOM isolation, paste-to-any-website.
- **Mobile-first responsive UX** — 3 breakpoint tiers (phone ≤ 640, tablet 641–1024, desktop ≥ 1025) with hamburger drawer nav, card layouts on small viewports, and 44px tap targets.
- **Multi-tenant security** — every table has Row-Level Security with `auth.uid() = user_id` policies. Cross-user reads return empty; writes reject.

## Tech stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict)
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Auth**: Supabase Auth + Google OAuth
- **Charts**: Recharts
- **Calendar**: react-big-calendar (desktop) + custom stacked grid (mobile)
- **Drag & drop**: @dnd-kit
- **PDF**: @react-pdf/renderer
- **iCal**: ical-generator
- **Validation**: Zod
- **Deployment**: Vercel (recommended)

## Project layout

```
my-app/                    # Next.js app
  src/
    app/
      (auth)/login/        # Google-only sign-in
      (dashboard)/         # All authenticated pages
        page.tsx           # Dashboard
        inbox/
        calendar/
        projects/
        clients/
        shoots/
        finances/
        contracts/
        gear/
        links/
        forms/
        settings/
        help/              # In-app docs
      api/
        inquiry/           # Public POST endpoint (widget + webhooks)
        calendar/[userId]/ # Public iCal feed
        contracts/[id]/pdf # Authenticated PDF export
      auth/callback/
    components/            # Module-scoped UI
      ui/                  # Shared primitives (Button, Card, Badge, etc.)
      layout/              # Sidebar, MobileNav
      tour/                # In-app tour primitives
      dashboard/, inbox/, calendar/, projects/, ...
    lib/
      actions/             # Server actions, one file per module
      validations/         # Zod schemas, one file per module
      queries/             # RSC data fetchers
      supabase/            # client.ts, server.ts, admin.ts, middleware.ts, types.ts
      contracts/           # Merge tag engine + default template
      pdf/                 # @react-pdf documents
      help/                # Help guide content
      tour/                # Tour ID constants
      inquiries/           # Webhook payload parsers
    middleware.ts
  public/
    widget/inquiry.js      # Embeddable form widget
  supabase/
    config.toml
    migrations/            # Tracked schema migrations
tasks/                     # Original spec files
USER_TODO.md               # Living checklist of post-launch + manual tasks
```

## Local development

### 1. Prerequisites
- Node.js 20+ and npm
- A Supabase project (free tier is fine)
- Supabase CLI installed (`brew install supabase/tap/supabase`)

### 2. Clone and install
```bash
git clone <your-repo-url>
cd <repo>/my-app
npm install
```

### 3. Configure env
```bash
cp .env.local.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project's **Settings → API** page. Set `NEXT_PUBLIC_SITE_URL` to `http://localhost:3000` for dev.

### 4. Apply DB schema
```bash
# From the my-app/ directory:
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000 → click **Continue with Google**. (Google OAuth must be configured in Supabase Auth — see the Deployment section below.)

## Deployment to Vercel

See [`USER_TODO.md`](./USER_TODO.md) for the full step-by-step deployment runbook. The short version:

1. Push to GitHub.
2. Import the repo in Vercel. Set **Root Directory** to `my-app`.
3. Configure env vars in Vercel project settings (same five as `.env.local`, but `NEXT_PUBLIC_SITE_URL` should be your production URL).
4. In Supabase Auth → URL Configuration: add your production URL as a Site URL and `<production-url>/auth/callback` as a Redirect URL.
5. In Google Cloud Console → OAuth client: add `https://<your-supabase-project>.supabase.co/auth/v1/callback` to Authorized redirect URIs.
6. Click Deploy in Vercel.

## Scripts

```bash
npm run dev    # Start dev server (Turbopack)
npm run build  # Production build
npm run start  # Run the production build locally
npm run lint   # Run ESLint
```

## Database migrations

Schema lives in `my-app/supabase/migrations/`. To add a new migration:

```bash
cd my-app
# Create a new migration file
supabase migration new <name>
# Edit the generated SQL
# Apply to remote
supabase db push
# Regenerate types
supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/lib/supabase/types.ts
```

## Status

The app is feature-complete on the original spec (all routes, full CRUD on every module, RLS-enforced multi-tenancy, mobile + tablet responsive). Outstanding deferred items, manual configuration steps, and security follow-ups are tracked in [`USER_TODO.md`](./USER_TODO.md).
