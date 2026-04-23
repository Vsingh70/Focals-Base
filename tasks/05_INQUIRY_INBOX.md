# Task 13 — Inquiry Inbox (NEW FEATURE)

## Goal
A unified inquiry intake system that aggregates leads from multiple sources (website form, inbound email, Instagram) into a single inbox UI. Industry-standard approach using webhooks + a public API route.

---

## Architecture Overview

```
vflics.com contact form  ──POST──▶  /api/inquiry          ──▶  inquiries table
Inbound email            ──webhook─▶  /api/inquiry/email   ──▶  inquiries table
Instagram DM (future)    ──webhook─▶  /api/inquiry/ig      ──▶  inquiries table
Manual entry             ──UI──────▶  Server Action        ──▶  inquiries table
                                                                     │
                                                              /inbox UI reads
```

---

## 1. Public Inquiry API Route

```typescript
// app/api/inquiry/route.ts
// Public POST endpoint — no auth required
// Accepts form submissions from any connected website

import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const InquirySchema = z.object({
  user_id: z.string().uuid(),       // identifies which photographer's inbox
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  shoot_type: z.string().optional(),
  preferred_date: z.string().optional(),
  message: z.string().optional(),
  source_label: z.string().optional(), // e.g. "vflics.com"
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = InquirySchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid' }, { status: 400 })

  const supabase = createAdminClient() // bypasses RLS for public insert
  const { error } = await supabase.from('inquiries').insert({
    ...parsed.data,
    source: 'website_form',
    raw_payload: body,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true }, { status: 201 })
}
```

## 2. Embeddable Form Widget for vflics.com

Generate a JavaScript snippet the user can paste into any website:

```html
<!-- Paste this into vflics.com -->
<script>
  window.APP_NAME_CONFIG = {
    userId: "YOUR_USER_ID",
    apiBase: "https://your-app.vercel.app"
  }
</script>
<script src="https://your-app.vercel.app/widget/inquiry.js" async></script>
```

The widget renders a minimal styled form (name, email, shoot type, date, message) that POSTs to `/api/inquiry`. Build `public/widget/inquiry.js` as a self-contained vanilla JS bundle.

## 3. Inbound Email Webhook

Use **Resend** inbound email parsing (or Postmark as alternative):

- User sets up a forwarding rule: `inquiries@vflics.com` → Resend inbound webhook
- Resend POSTs parsed email payload to `/api/inquiry/email`

```typescript
// app/api/inquiry/email/route.ts
export async function POST(request: Request) {
  const payload = await request.json()
  // Resend inbound payload shape:
  // { from, to, subject, text, html, ... }

  // Map to inquiry row:
  const inquiry = {
    user_id: resolveUserFromToAddress(payload.to), // map inbox address to user
    source: 'email',
    source_handle: payload.from,
    name: extractNameFromEmail(payload.from),
    email: payload.from,
    message: payload.text,
    raw_payload: payload,
  }
  // Insert via admin client
}
```

## 4. Multi-Source Configuration UI

In `/settings/integrations`, the user can:
- Add multiple inquiry sources (website URLs, email addresses)
- See a unique webhook URL / embed snippet per source
- Toggle sources on/off
- Each source maps to a row in `inquiry_sources` table

## 5. Inbox UI `/inbox`

```
┌─────────────────────────────────────────────────────┐
│  Inbox  [New 3]          [+ Manual Entry]            │
│  Filter: All | New | Read | Replied | Converted      │
├──────────────────────────────────────────────────────┤
│  ● John Smith          website_form    2h ago        │
│    Portrait session · June 15 · "Looking for..."     │
├──────────────────────────────────────────────────────┤
│  ● Sarah Chen          email           1d ago        │
│    "Hi, I saw your work on Instagram..."             │
└──────────────────────────────────────────────────────┘
```

- Clicking a row opens a detail panel (slide-over)
- Detail panel actions:
  - Mark as Read / Replied
  - **Convert to Client** → creates a `clients` row pre-filled from inquiry data
  - **Convert to Project** → creates a `projects` row linked to the new client
  - Archive
- Source badge per row: `website_form`, `email`, `instagram`, `manual`
- Unread count badge in sidebar nav

## Acceptance Criteria
- [ ] Public `/api/inquiry` POST endpoint works without auth
- [ ] Embeddable widget JS file built and served from `/public/widget/`
- [ ] Inbound email webhook parses Resend payload and creates inquiry row
- [ ] Inbox UI shows all sources in unified list
- [ ] Convert to Client/Project pre-fills data from inquiry
- [ ] Multi-source management UI in Settings
- [ ] Webhook secret validation to prevent spoofed requests
