# [APP_NAME] — Full Production Redesign Master Prompt

## Overview

**[APP_NAME]** (formerly Focals Base) is a full-stack photography business management platform built for solo creative operators and small studios. Originally built as a learning project, it is now being redesigned into a production-grade, multi-tenant SaaS application.

The platform centralizes all business operations for photographers: client management, project tracking, shoot scheduling, finances, contracts, inquiry intake, gear inventory, and more.

---

## Rebrand Note

The app is being renamed from **Focals Base** to **[APP_NAME]** (placeholder). All references to "Focals Base" in code, UI copy, metadata, Supabase project settings, and documentation must be replaced with `[APP_NAME]` throughout. Do a global find-and-replace as part of Task 01.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router, React Server Components) |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | Supabase Auth + Google OAuth |
| Styling | Tailwind CSS + CSS Variables |
| Charts | Recharts |
| PDF Generation | @react-pdf/renderer |
| Calendar | ical-generator (for .ics feeds) |
| Email Parsing | Inbound email via Resend or Postmark webhook |
| Deployment | Vercel (serverless/edge optimized) |

---

## Module Index

| # | Module | Route | Status |
|---|---|---|---|
| 1 | Dashboard | `/` | Redesign |
| 2 | Projects | `/projects` | Redesign |
| 3 | Clients | `/clients` | Redesign |
| 4 | Shoots | `/shoots` | Redesign |
| 5 | Finances | `/finances` | Redesign |
| 6 | Gear | `/gear` | Redesign |
| 7 | Forms | `/forms` | Redesign |
| 8 | Links | `/links` | Redesign |
| 9 | Inquiry Inbox | `/inbox` | **New** |
| 10 | Calendar View | `/calendar` | **New** |
| 11 | Contracts | `/contracts` | **New** |
| 12 | Account/Settings | `/settings` | Redesign |

---

## Task Execution Order

Execute tasks in this order. Each task has its own file with full specs and acceptance criteria.

```
01_PROJECT_SETUP.md         — Rebrand, dependencies, folder structure, middleware
02_DATABASE_SCHEMA.md       — Full normalized schema + RLS policies
03_AUTH.md                  — Supabase Auth, Google OAuth, protected routes
04_API_LAYER.md             — Server actions, Zod validation, typed responses
05_DASHBOARD.md             — KPI cards, charts, upcoming shoots, quick actions
06_PROJECTS.md              — Project CRUD, status pipeline, payment tracking
07_CLIENTS.md               — Client CRM, linked projects/shoots/inquiries
08_SHOOTS.md                — Shoot scheduling, linked to projects + clients
09_FINANCES.md              — Income/expense tracking, P&L, payment status
10_GEAR.md                  — Equipment inventory, purchased vs wishlist
11_FORMS.md                 — Dynamic form builder with configurable field types
12_LINKS.md                 — Saved link bookmarks with categories
13_INQUIRY_INBOX.md         — Unified inquiry intake (web form, email, Instagram)
14_CALENDAR.md              — Calendar view + Apple/Google Calendar iCal feed
15_CONTRACTS.md             — Contract templates, merge tags, PDF export
16_SETTINGS.md              — User profile, branding, integrations, billing
```

---

## Global Design Principles

- **Editorial aesthetic** — clean, high-craft UI. Reference: Acne Studios, Linear, Vercel dashboard
- **Dark mode first** — CSS variables for all colors, light mode as secondary
- **No generic SaaS look** — avoid rounded pill buttons, gradient hero sections, stock icon sets
- **Typography** — use a single high-quality type system (e.g. Inter + a display face)
- **Performance** — RSC for all data-fetching pages, client components only for interactive islands
- **Multi-tenant** — every DB query scoped to `user_id` from server session, never from client input
