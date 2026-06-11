# Handoff: Lenslate waitlist — wire the landing pages to a real endpoint

> **For Claude Code.** The two marketing pages (`Lenslate iOS.html`, `Lenslate Web.html`) have a working waitlist form. It already POSTs `{ email, source, ts }` as JSON — it just needs a real server endpoint to receive it. This package gives you (1) the exact frontend contract the form sends, and (2) a complete server implementation that matches the **existing** Focals-Base stack: **Next.js 15 App Router + Supabase + Zod**, modeled on the app's own `src/app/api/inquiry/route.ts`.

---

## 1. What the frontend already does

The `Waitlist` component (in `landing-shared.jsx`) reads two globals and POSTs to them. Each landing page sets them in a plain `<script>` right after `<div id="root">`:

```html
<script>
  window.LENSLATE_WAITLIST_ENDPOINT = "";   // ← set this
  window.LENSLATE_WAITLIST_TOKEN = "";       // ← optional shared secret
</script>
```

**On submit it sends:**
```
POST <LENSLATE_WAITLIST_ENDPOINT>
Content-Type: application/json
X-Waitlist-Token: <LENSLATE_WAITLIST_TOKEN>   // only if the token global is non-empty

{ "email": "you@studio.com", "source": "ios-landing" | "web-landing", "ts": "2026-06-11T17:04:00.000Z" }
```
- `email` is already trimmed + lowercased client-side.
- `source` distinguishes which page converted (`ios-landing` / `web-landing`).

**It interprets the response as:**
| Response | UI result |
|---|---|
| `2xx` | success state ("You're on the list") |
| `409` | also success (already subscribed — no scary error) |
| other non-2xx | error state; shows `json.error` if present, else a generic message |
| network failure | error state ("Network error…") |

So your endpoint must: accept that JSON, return **201** on insert, **409** on duplicate, **4xx** with `{ "error": "..." }` on bad input, **500** on server failure. CORS matters only if you host the endpoint on a **different origin** than where the HTML is served (see §5).

**Demo mode:** while `LENSLATE_WAITLIST_ENDPOINT` is `""`, the form fakes success after ~0.6s with no network call. That's how it ships today — setting the URL flips it to live.

---

## 2. Database — a `waitlist_signups` table (Supabase)

Add a migration / run this SQL in the Supabase project. RLS on, no public policies — only the **service-role** admin client (used by the route handler) can write, exactly like `inquiries`.

```sql
create table if not exists public.waitlist_signups (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- one row per email (case-insensitive); lets us detect duplicates → 409
create unique index if not exists waitlist_signups_email_key
  on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;
-- No policies = no anon/auth access. The service-role key bypasses RLS.
```

Then regenerate Supabase types so `Database` includes the new table (the route handler is typed against it):
```bash
npx supabase gen types typescript --project-id <your-project> > src/lib/supabase/types.ts
# (or your existing types script)
```

---

## 3. Validation — `src/lib/validations/waitlist.ts`

The app already uses **Zod 4**. Add a schema (mirrors the style under `src/lib/validations`):

```ts
import { z } from 'zod';

export const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  source: z.string().trim().max(64).optional(),
  ts: z.string().datetime().optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
```

---

## 4. Route handler — `src/app/api/waitlist/route.ts`

Public, unauthenticated capture (no per-user token like `inquiry` needs — the waitlist is global). Uses `createAdminClient()` from `src/lib/supabase/admin.ts`. Returns the status codes the frontend expects.

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { waitlistSchema } from '@/lib/validations/waitlist';

// Only needed if the landing HTML is served from a DIFFERENT origin than this
// app. If you host the pages under this Next app (same origin), you can delete
// CORS_HEADERS, the OPTIONS handler, and the `headers:` on each response.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Waitlist-Token',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  // Optional shared-secret gate. Set WAITLIST_TOKEN in env to require it, and
  // put the same value in window.LENSLATE_WAITLIST_TOKEN on the pages.
  const required = process.env.WAITLIST_TOKEN;
  if (required && request.headers.get('x-waitlist-token') !== required) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter a valid email.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from('waitlist_signups').insert({
    email: parsed.data.email,
    source: parsed.data.source ?? null,
    user_agent: request.headers.get('user-agent'),
  });

  if (error) {
    // 23505 = unique_violation → already on the list. Frontend treats 409 as success.
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 409, headers: CORS_HEADERS });
    }
    return NextResponse.json({ error: 'Could not join right now.' }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: CORS_HEADERS });
}
```

> Env: no new vars are required (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` already exist for `createAdminClient`). Only add `WAITLIST_TOKEN` if you want the shared-secret gate — and document it in `.env.local.example` next to the existing keys.

---

## 5. Point the pages at the endpoint

In **both** `Lenslate iOS.html` and `Lenslate Web.html`, set the global:

- **Same origin** (pages served by this Next app, e.g. under `public/` or a route): use a relative path — no CORS needed, and you can delete the CORS bits from the handler.
  ```js
  window.LENSLATE_WAITLIST_ENDPOINT = "/api/waitlist";
  ```
- **Different origin** (pages on a static/marketing host, app on `app.lenslate.com`): use the absolute URL and keep the CORS headers.
  ```js
  window.LENSLATE_WAITLIST_ENDPOINT = "https://app.lenslate.com/api/waitlist";
  ```
- If you set `WAITLIST_TOKEN` in env, also set `window.LENSLATE_WAITLIST_TOKEN = "<same value>"`. (Note: a token in client JS is light spam-friction, not real auth — for stronger protection add a rate limit or CAPTCHA, see §7.)

That single line flips the form from demo mode to live. No other frontend change.

---

## 6. Verify

```bash
# same-origin dev
curl -i -X POST http://localhost:3000/api/waitlist \
  -H 'Content-Type: application/json' \
  -d '{"email":"Test@Studio.com","source":"web-landing","ts":"2026-06-11T17:04:00.000Z"}'
# → 201 {"ok":true}; row appears in waitlist_signups with email lowercased

curl -i -X POST http://localhost:3000/api/waitlist \
  -H 'Content-Type: application/json' -d '{"email":"test@studio.com"}'
# → 409 {"ok":true,"duplicate":true}

curl -i -X POST http://localhost:3000/api/waitlist \
  -H 'Content-Type: application/json' -d '{"email":"nope"}'
# → 400 {"error":"Please enter a valid email."}
```
Then load each landing page, submit the hero/footer waitlist, and confirm the success card. Check the Supabase table for `source` = `ios-landing` / `web-landing`.

- [ ] `waitlist_signups` table + unique `lower(email)` index + RLS on.
- [ ] `src/lib/supabase/types.ts` regenerated.
- [ ] `waitlist.ts` schema + `api/waitlist/route.ts` added.
- [ ] `window.LENSLATE_WAITLIST_ENDPOINT` set in both HTML files.
- [ ] 201 / 409 / 400 all behave as above; `npm run build` + `npm run typecheck` pass.

---

## 7. Optional follow-ups (ask the user first)
- **Rate limit** the route (e.g. per-IP) to blunt spam — the app has no limiter today.
- **Confirmation email**: the app deliberately has no `RESEND_API_KEY` (see `.env.local.example`). If the user wants a double opt-in, add Resend at that point and send from the handler.
- **Admin view**: a simple `/settings` or internal page listing `waitlist_signups` with CSV export.
- **honeypot field** on the form for extra spam friction.

---

## 8. Files in this bundle
- `Lenslate iOS.html`, `Lenslate Web.html` — the live pages (endpoint global near the top of each).
- `landing-shared.jsx` — contains the `Waitlist` component (the client contract, for reference).
- `README.md` — this plan.
