# App Store listing — Focals (v1.0)

Draft copy + metadata to paste into App Store Connect when submitting.
Update before pressing **Submit for Review**.

---

## App name

**Focals**

(30-character cap; "Focals" leaves room.)

## Subtitle (30 chars)

> Studio admin for photographers

(Alternates: "Run your photography studio", "Photographer admin, simplified")

## Promotional text (170 chars, can update without resubmission)

> Inquiries, projects, contracts, finances — every part of running a photo
> business in one editorial-feel iOS app. Bring your own camera; we'll
> handle the paperwork.

## Description (4000 chars)

> Focals is the studio admin app for working photographers. It bundles every
> non-creative task — chasing inquiries, scheduling shoots, drafting
> contracts, tracking finances, managing gear and clients — into one
> editorial-styled iOS app that mirrors the web companion exactly.
>
> ## What's inside
>
> **Inbox** — Inquiries from your widget, email, and manual entries land
> here grouped by status. Convert to a client and project in one tap.
>
> **Calendar** — A pixel-mirrored stacked-month grid with up to 12 months
> ahead. Subscribe to your iCal feed in Apple Calendar, or mirror projects
> directly into a dedicated Focals calendar with two-way edits.
>
> **Projects** — Status filters, payment progress bars, an in-app MapKit
> snapshot for the shoot location, and one-tap export to your iOS Calendar.
>
> **Clients** — Tap-to-call, tap-to-email, one-tap export to system
> Contacts. Linked projects and originating inquiries surface in the detail
> view.
>
> **Finances** — Month-grouped income / expense ledger, P&L view with
> Month / Quarter / Year toggles and a 6-month bar chart, CSV export for
> end-of-year accounting.
>
> **Contracts** — Draft from a saved template with merge fields auto-filled
> from the linked client and project. Status workflow: Draft → Sent →
> Signed → Void.
>
> **Gear** — Owned vs. wishlist tracking with prices and notes.
>
> **Links** — Bookmark inspiration and tools. Tap to open in-app.
>
> **AI file import** — Photograph a contract, snap a notebook page, or
> drop a CSV; Claude extracts proposed projects for review.
>
> **Notifications** — New inquiry alerts and the night-before project
> reminder. Live Activity countdown for the next shoot on the lock screen
> and Dynamic Island.
>
> **Universal Links** — Inquiry / project / contract URLs open the app
> directly from Safari, email, or a colleague's text.
>
> **Offline-first** — Every list reads from a local SwiftData cache, so
> the app is fast on cell signal and usable on airplane mode.
>
> ## Built for the way photographers actually work
>
> - Wall-clock timestamps everywhere — 8:30 AM is 8:30 AM regardless of
>   the timezone of whoever is looking at the calendar
> - Editorial font + dark-mode-first design, not yet another generic CRM
> - Sign in with Google or Apple
> - Web companion at focals-base.vercel.app — every change syncs both ways
> - Your data stays in your Supabase project; we don't read your
>   inquiries, finances, or contracts

## Keywords (100 chars, comma-separated)

```
photographer, photography, studio, crm, inquiry, contracts, finances, calendar, business, freelance
```

(That's 99 chars; tweak as needed — Apple counts spaces.)

## Categories

- Primary: **Productivity**
- Secondary: **Business**

(Alternative primary: Photo & Video — if marketing decides positioning is
"creative tool" not "admin tool".)

## URLs

- **Support URL** — `https://focals-base.vercel.app/help`
- **Marketing URL** — `https://focals-base.vercel.app`
- **Privacy policy URL** — `https://focals-base.vercel.app/privacy`

> ⚠️ Add a `/privacy` page on the web before submitting. Apple rejects
> apps without a working privacy URL. Boilerplate is fine; document what
> Focals collects (matches `PrivacyInfo.xcprivacy`).

## Age rating

4+ (no objectionable content).

## App Privacy declarations

Match the `PrivacyInfo.xcprivacy` file:

| Data type            | Linked? | Tracking? | Purpose             |
|----------------------|---------|-----------|---------------------|
| Name                 | Yes     | No        | App functionality   |
| Email                | Yes     | No        | App functionality   |
| Phone                | Yes     | No        | App functionality   |
| User content         | Yes     | No        | App functionality   |
| Other contacts       | Yes     | No        | App functionality   |
| Device ID (push)     | Yes     | No        | App functionality   |

## Review notes

```
Focals signs in via Supabase OAuth (Google or Apple). We've enabled both
providers. To test:

1. Tap "Continue with Google" or "Continue with Apple" on the login screen
2. Use any Google or Apple account; a profile is created automatically
3. The dashboard, inbox, calendar, projects, finances, and contracts will
   all be empty for a fresh account

If a demo account is required, email <YOUR-EMAIL> and we'll provision one
seeded with sample data.

Camera, Calendar, and Contacts permission prompts are gated behind explicit
user actions:
- Calendar: Settings → "Mirror projects to iOS Calendar"
- Contacts: Client detail → "Add to Contacts"

The app is offline-first; you can review inquiries, projects, and finances
without network connectivity.

Push notifications: only sent for new inquiries and 24h-before-shoot
reminders. Both can be toggled per-type in Settings.
```

## Screenshots (TODO before submit)

Required sizes (App Store Connect):
- iPhone 6.7" — 1290×2796 (iPhone 17 Pro Max)
- iPhone 6.5" — 1284×2778
- iPad 12.9" — 2048×2732 (iPad Pro M2)

Recommended set (5–10 frames):
1. Dashboard with greeting + KPI tiles
2. Inbox grouped by status
3. Calendar stacked-month grid with detail panel open on a day with projects
4. Project detail with payment progress + MapKit snapshot
5. Contracts list + detail with markdown body
6. Finances P&L view with chart + by-category breakdown
7. iPad split-view with sidebar
8. Settings showing notifications + EventKit toggle
9. (Once Live Activity widget extension lands) lock-screen Live Activity
10. (Once widget extension lands) home-screen widget

Generate via `xcrun simctl io booted screenshot` while running each scene
in the simulator. Add marketing copy in Figma.

## Changelog (1.0)

> First release. The full feature surface as described above.

## Pre-submission checklist (cross-link)

See `tasks/ios/14_TESTING_RELEASE_TELEMETRY.md` Section H.
