# Task 01 — Project Setup, Rebrand & Folder Structure

## Goals
1. Rename all references from "Focals Base" → `[APP_NAME]`
2. Establish production folder structure with Next.js App Router
3. Configure TypeScript strict mode, ESLint, Prettier
4. Set up Tailwind CSS with design token CSS variables
5. Install and verify all dependencies
6. Configure middleware for auth-protected routes

---

## Step 1 — Global Rebrand Find & Replace

Search the entire codebase for all occurrences of:
- `Focals Base`, `focals-base`, `focals_base`, `FocalsBase`, `focalsbase`

Replace all with `[APP_NAME]` (or the appropriate casing variant).

Also update:
- `package.json` → `name` field
- `next.config.js` → any hardcoded references
- All page `<title>` tags and metadata
- Supabase project name (update in Supabase dashboard manually — note this in a comment)
- Any `.env` variable names that include the old name

---

## Step 2 — Folder Structure

Establish this exact folder structure:

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Sidebar + top nav shell
│   │   ├── page.tsx                 # Dashboard
│   │   ├── projects/
│   │   ├── clients/
│   │   ├── shoots/
│   │   ├── finances/
│   │   ├── gear/
│   │   ├── forms/
│   │   ├── links/
│   │   ├── inbox/                   # NEW — Inquiry Inbox
│   │   ├── calendar/                # NEW — Calendar View
│   │   ├── contracts/               # NEW — Contracts
│   │   └── settings/
│   ├── api/
│   │   ├── inquiry/route.ts         # Public POST endpoint for web form inquiries
│   │   ├── inquiry/email/route.ts   # Webhook for inbound email
│   │   └── calendar/[userId]/route.ts # Public .ics calendar feed
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                          # Base components (Button, Input, Modal, etc.)
│   ├── layout/                      # Sidebar, TopNav, PageHeader
│   ├── dashboard/
│   ├── projects/
│   ├── clients/
│   ├── shoots/
│   ├── inbox/
│   ├── calendar/
│   └── contracts/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts                 # Generated from schema
│   ├── actions/                     # Server actions per module
│   ├── validations/                 # Zod schemas per module
│   └── utils.ts
├── middleware.ts
└── types/
    └── index.ts
```

---

## Step 3 — Dependencies

Ensure `package.json` includes:

```json
{
  "dependencies": {
    "next": "^14",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0",
    "recharts": "^2",
    "tailwindcss": "^3",
    "clsx": "^2",
    "date-fns": "^3",
    "zod": "^3",
    "@react-pdf/renderer": "^3",
    "ical-generator": "^7",
    "resend": "^3",
    "react-big-calendar": "^1"
  }
}
```

---

## Step 4 — Tailwind + CSS Variables

In `globals.css`, define the full token set:

```css
:root {
  --color-bg: #0a0a0a;
  --color-bg-secondary: #111111;
  --color-bg-tertiary: #1a1a1a;
  --color-border: #222222;
  --color-border-secondary: #2a2a2a;
  --color-text-primary: #f0f0f0;
  --color-text-secondary: #888888;
  --color-text-tertiary: #555555;
  --color-accent: #e8e0d0;
  --color-accent-muted: #3a3530;
  --color-success: #4caf7d;
  --color-warning: #e8a020;
  --color-danger: #e85040;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Canela', Georgia, serif;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

---

## Step 5 — Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* get/set/remove from request/response */ } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/(dashboard)')

  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/inquiry|api/calendar).*)'],
}
```

Note: `/api/inquiry` and `/api/calendar/:path*` are excluded from auth middleware — they are public endpoints.

---

## Acceptance Criteria
- [ ] Zero occurrences of "Focals Base" in codebase
- [ ] Folder structure matches spec above
- [ ] `npm run build` completes with zero errors
- [ ] Strict TypeScript enabled with zero `any` types
- [ ] CSS variables defined and working in both dark/light modes
- [ ] Middleware redirects unauthenticated users to `/login`
- [ ] Public API routes are accessible without auth
