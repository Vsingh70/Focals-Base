# Task 14 — Calendar View + Apple/Google Calendar Sync (NEW FEATURE)

## Goal
A full calendar view of all shoots, with a public `.ics` feed URL that syncs natively with Apple Calendar and Google Calendar — no OAuth required.

---

## Architecture

The cleanest, most compatible approach is an **iCalendar (.ics) feed** — a standard URL Apple Calendar and Google Calendar can subscribe to and auto-refresh. This is how most booking apps (Calendly, Acuity, etc.) work.

```
Supabase shoots table
        │
        ▼
/api/calendar/[userId]/route.ts   ← generates .ics feed on demand
        │
        ├──▶ Apple Calendar (subscribe to URL)
        └──▶ Google Calendar (subscribe to URL)
```

---

## 1. iCal Feed API Route

```typescript
// app/api/calendar/[userId]/route.ts
// Public GET — no auth (URL is the secret, include a token param)
import ical from 'ical-generator'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  // Validate token against profiles table (store a calendar_token per user)
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('calendar_token, full_name, business_name')
    .eq('id', params.userId)
    .single()

  if (!profile || profile.calendar_token !== token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: shoots } = await supabase
    .from('shoots')
    .select('*, clients(full_name), projects(title)')
    .eq('user_id', params.userId)
    .neq('status', 'cancelled')

  const calendar = ical({ name: `${profile.business_name || '[APP_NAME]'} Shoots` })

  for (const shoot of shoots ?? []) {
    const start = new Date(shoot.scheduled_at)
    const end = new Date(start.getTime() + (shoot.duration_minutes ?? 60) * 60000)
    calendar.createEvent({
      start,
      end,
      summary: shoot.title,
      description: `Client: ${shoot.clients?.full_name ?? 'Unknown'}\nProject: ${shoot.projects?.title ?? '—'}\n\n${shoot.notes ?? ''}`,
      location: shoot.location ?? undefined,
    })
  }

  return new Response(calendar.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="shoots.ics"',
      'Cache-Control': 'no-cache, no-store',
    }
  })
}
```

Add `calendar_token` column to `profiles`:
```sql
ALTER TABLE profiles ADD COLUMN calendar_token TEXT DEFAULT gen_random_uuid()::text;
```

---

## 2. Calendar UI `/calendar`

Use `react-big-calendar` with the `date-fns` localizer.

```
┌─────────────────────────────────────────────────────┐
│  Calendar  [Month ▾]  [← Apr 2026  →]   [+ Shoot]  │
│                                                      │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun                   │
│   6    7    8    9   10   11   12                    │
│                  ●Portrait            ●Wedding       │
│  13   14   15   16   17   18   19                    │
│                       ●Grad                          │
└─────────────────────────────────────────────────────┘
```

- Month / Week / Day / Agenda views
- Click event → shoot detail slide-over (same as Shoots module)
- Click empty date → create shoot modal pre-filled with that date
- Color coded by shoot status: scheduled (accent), completed (muted), rescheduled (warning)

---

## 3. Calendar Sync UI in Settings

In `/settings/integrations` → Calendar section:

```
┌──────────────────────────────────────────────────┐
│  📅 Calendar Sync                                 │
│                                                  │
│  Subscribe to your shoots from any calendar app. │
│                                                  │
│  Feed URL:  [https://app.com/api/calendar/...]   │
│             [Copy Link]  [Regenerate]            │
│                                                  │
│  ┌─────────────────────┐  ┌──────────────────┐  │
│  │ Add to Apple Cal    │  │ Add to Google Cal │  │
│  └─────────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────┘
```

- "Add to Apple Calendar" → `webcal://` URL scheme (opens Apple Calendar directly)
- "Add to Google Calendar" → `https://calendar.google.com/calendar/r?cid=` deep link
- "Regenerate" → creates a new `calendar_token` (invalidates old URL)

---

## Acceptance Criteria
- [ ] `/api/calendar/[userId]` returns valid `.ics` feed
- [ ] Token validation prevents unauthorized access
- [ ] Apple Calendar can subscribe to `webcal://` URL and shows shoots
- [ ] Google Calendar can subscribe via URL and shows shoots
- [ ] Calendar UI renders month/week/day/agenda views
- [ ] Creating a shoot from calendar pre-fills the date
- [ ] Regenerating token invalidates the old feed URL
