# Claude Code — Execution Instructions

Read this file first before executing any task.

---

## How to Use These Files

This directory contains a full redesign prompt suite for [APP_NAME] (formerly Focals Base). Each `.md` file is a self-contained task spec. Execute them in order.

```
00_MASTER_PROMPT.md         ← Read first — project overview and module index
01_PROJECT_SETUP.md         ← Execute first
02_DATABASE_SCHEMA.md       ← Execute second (schema must exist before any code)
03_AUTH_AND_API.md          ← Execute third
04_CORE_MODULES.md          ← Dashboard, Projects, Clients, Shoots, Finances
05_INQUIRY_INBOX.md         ← New feature: unified inquiry intake
06_CALENDAR.md              ← New feature: calendar view + iCal sync
07_CONTRACTS.md             ← New feature: contract templates + PDF export
08_REMAINING_MODULES.md     ← Gear, Forms, Links, Settings
```

---

## Before You Start

1. **Read `00_MASTER_PROMPT.md` completely** before touching any code
2. **Run the DB schema in `02_DATABASE_SCHEMA.md` first** — apply all SQL in Supabase SQL editor
3. **Generate Supabase types** after schema is applied:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
   ```
4. **Set up `.env.local`**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=       # for admin client (server-only)
   RESEND_API_KEY=                  # for inbound email
   RESEND_WEBHOOK_SECRET=           # for webhook validation
   ```

---

## Key Constraints (Never Violate)

- `user_id` is **always** set from the server session — never trust client input for this
- All mutations go through **Server Actions** — no direct Supabase calls from client components
- All list views must support **pagination** — never fetch unbounded result sets
- Public API routes (`/api/inquiry`, `/api/calendar`) must validate a **secret/token** before processing
- The app name `[APP_NAME]` must appear **nowhere** in the final codebase (replace with actual name when decided)

---

## Design Reference

- Aesthetic: editorial photography meets Linear/Vercel dashboard
- Dark mode first, light mode secondary
- No rounded pill buttons, no gradient heroes, no stock illustrations
- Typography: Inter (body) + Canela (display/headings)
- Color palette defined in `globals.css` CSS variables — use those, never hardcode colors

---

## When You Finish Each Task

- Run `npm run build` and confirm zero errors before moving to the next task
- Run `npm run type-check` and confirm zero TypeScript errors
- Test auth flow (login, protected routes, sign out) after Task 03
- Test RLS by attempting a query with a different `user_id` after Task 02
