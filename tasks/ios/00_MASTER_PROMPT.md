# [APP_NAME] iOS — Master Prompt

## Overview

**[APP_NAME] for iOS** is the native Apple-platform companion to the existing Next.js + Supabase web app at [my-app/](../../my-app/). It mirrors every web module so users get full parity on iPhone and iPad, then layers on iOS-only capabilities (EventKit, WidgetKit, Live Activities, App Intents, PencilKit, Push) the web cannot do well.

The iOS app is a **separate Swift codebase** that talks to the **same Supabase backend** the web app already uses. There is no separate API server — both clients hit Postgres + Auth + RLS directly.

The web's [MobileCalendarView.tsx](../../my-app/src/components/calendar/MobileCalendarView.tsx) (iOS-style stacked month grid) and the responsive design tokens in [globals.css](../../my-app/src/app/globals.css) are the visual reference. The iOS app should feel like the **native version** of what the mobile web is currently approximating.

---

## Locked decisions (2026-04-27)

- **Repo layout**: same repo, `ios/` folder alongside `my-app/`.
- **Auth scope**: Google OAuth + Apple Sign In (App Store Guideline 4.8 compliance + cross-platform parity).
- **Offline scope (v1)**: read-cache only via SwiftData. Mutations require connectivity. Full offline-first deferred to v1.1.
- **Native features (v1)**: ALL of EventKit, App Intents, PencilKit, WidgetKit, Live Activities, Push Notifications.
- **No third-party UI kits**, no RxSwift/Combine plumbing beyond what `supabase-swift` uses internally.

---

## Tech stack

| Layer | Technology |
|---|---|
| UI | SwiftUI (UIKit only where required: `ASWebAuthenticationSession`, `PKCanvasView`, `EKEventStore`) |
| Deployment target | iOS 17.0 (SwiftData GA, Observation framework, `NavigationStack`, `.sheet(item:)`, mature Live Activities) |
| Architecture | MV (Model + View) with `@Observable` stores per module — no separate ViewModel layer except for forms with complex validation |
| Persistence (cache) | SwiftData, keyed by `user_id`, encrypted at rest via FileProtection |
| Networking | [`supabase-swift`](https://github.com/supabase/supabase-swift) (Auth + PostgREST). No Realtime |
| Charts | Apple Charts framework |
| PDF | PDFKit (render server-rendered contract PDFs) |
| Maps | MapKit (static snapshot of shoot location) |
| Drawing | PencilKit (iPad contract signing) |
| Widgets | WidgetKit + App Groups |
| Background activity | ActivityKit (Live Activities) |
| Automation | AppIntents (Siri / Shortcuts / Spotlight) |
| Image cache | [Kingfisher](https://github.com/onevcat/Kingfisher) (avatar URLs from Google CDN) |
| Markdown | [MarkdownUI](https://github.com/gonzalezreal/swift-markdown-ui) (help docs) |
| Telemetry | [Sentry](https://sentry.io) (opt-in, crash reporting only) |

---

## Module index

Every web route maps to exactly one iOS module. Native-only modules (Widgets, Intents, Live Activity, Share Extension) are extension targets, not screens.

| # | Web route | iOS module | Supabase tables | Notes |
|---|---|---|---|---|
| 1 | `/` (Dashboard) | `Modules/Dashboard/` | `projects`, `shoots`, `finances` | KPI cards + Apple Charts |
| 2 | `/inbox` | `Modules/Inbox/` | `inquiries`, `clients`, `projects` | Status workflow + convert action |
| 3 | `/calendar` | `Modules/Calendar/` | `shoots` | Stacked month grid + EventKit mirror |
| 4 | `/projects`, `/projects/[id]` | `Modules/Projects/` | `projects`, `clients`, `shoots`, `finances` | CRUD + payment tracking |
| 5 | `/clients`, `/clients/[id]` | `Modules/Clients/` | `clients` | CRM + system Contacts link |
| 6 | `/shoots` | `Modules/Shoots/` | `shoots`, `projects`, `clients` | MapKit + EventKit add |
| 7 | `/finances` | `Modules/Finances/` | `finances` | Tx list + P&L + receipt capture |
| 8 | `/contracts`, `/contracts/[id]`, `/contracts/new`, `/contracts/templates` | `Modules/Contracts/` | `contracts`, `contract_templates` | PDFKit viewer + PencilKit signing |
| 9 | `/gear` | `Modules/Gear/` | `gear` | Inventory + photo per item |
| 10 | `/forms` | `Modules/Forms/` | `forms` | **Read-only in v1** (creation web-only) |
| 11 | `/links` | `Modules/Links/` | `links` | Bookmarks + SFSafariViewController |
| 12 | `/help`, `/help/[slug]` | `Modules/Help/` | (none — fetches markdown from web) | MarkdownUI render |
| 13 | `/settings` | `Modules/Settings/` | `profiles`, `inquiry_sources` | Profile + integrations + sign out |
| — | `/login` | `Auth/` | `profiles` | Google OAuth + Apple Sign In |

**Native-only extension targets:**
- `FocalsWidgets/` — WidgetKit (Today's Shoots, Revenue MTD)
- `FocalsIntents/` — App Intents (Log expense, Add inquiry, etc.)
- `FocalsLiveActivity/` — ActivityKit (shoot countdown)
- Share Extension (within main app target) — receive URL/text/image → create Inquiry/Link

---

## Task execution order

```
01_PROJECT_SETUP.md                        ← foundation, no dependencies
02_DATA_MODELS_AND_SUPABASE_CLIENT.md      ← depends on 01
03_AUTH_AND_SESSION.md                     ← depends on 01, 02
04_NAVIGATION_AND_SHELL.md                 ← depends on 01, 03
05_READ_CACHE_LAYER.md                     ← depends on 02, 03, 04
06_DASHBOARD.md                            ← depends on 04, 05
07_INBOX.md                                ← depends on 04, 05
08_CALENDAR.md                             ← depends on 04, 05
09_PROJECTS_CLIENTS_SHOOTS.md              ← depends on 04, 05
10_FINANCES.md                             ← depends on 04, 05, 09
11_CONTRACTS.md                            ← depends on 03, 04, 05
12_GEAR_LINKS_FORMS_HELP_SETTINGS.md       ← depends on 04, 05
13_NATIVE_FEATURES.md                      ← depends on 04, 05, 06–12
14_TESTING_RELEASE_TELEMETRY.md            ← depends on all above
```

Tasks 06–12 can execute in parallel (independent module work) once 04 + 05 are done.

---

## Design principles

- **Editorial dark aesthetic** — same tokens as web, lifted from [globals.css](../../my-app/src/app/globals.css) `:root` block. No hardcoded colors anywhere — only `Color+Tokens` references.
- **Tab bar replaces hamburger drawer** — iPhone uses a 5-tab `TabView`; iPad uses `NavigationSplitView` with the full nav list.
- **Bottom sheets replace modals** — every "detail" view that's a modal on web becomes a `.sheet` with `.presentationDetents([.medium, .large])` on iOS.
- **iOS-style stacked calendar mandatory** — pixel parity with `MobileCalendarView.tsx`, not a port of `react-big-calendar`.
- **Typography** — Inter (body) + brand display face (TBD per Open Item #2). SF Symbols for all iconography.
- **Performance** — SwiftData read-cache means every list screen renders in < 200ms cold. Charts and maps render asynchronously, never block first paint.
- **Multi-tenant** — every PostgREST query filtered server-side by RLS (`auth.uid() = user_id`). Client never includes `user_id` in payloads.

---

## Non-goals for v1

- ❌ Android (separate effort)
- ❌ Realtime subscriptions (web doesn't use them either; polling + pull-to-refresh covers it)
- ❌ Full offline-first with write queue (read-cache only — mutations require connectivity)
- ❌ Multi-device sync conflict resolution UI (server-wins; banner only)
- ❌ Watch app, tvOS, Mac Catalyst
- ❌ In-app purchases / subscriptions
- ❌ Custom keyboard / Action Extension
- ❌ Editing contract templates on iOS (web-only)
- ❌ Editing forms on iOS (web-only — read list only)

---

## Open items still to decide

1. **Real app name** — `[APP_NAME]` placeholder is in web tasks too. Bundle ID `com.[APP_NAME].ios`, App Store listing, and brand-font choice can't be finalized without it. Task 01 keeps the placeholder; rename happens once.
2. **Brand fonts on iOS** — Inter is fine. If web uses Canela (or any paid display face), the license must explicitly permit app embedding. Confirm before Task 01 commits a `Fonts/` bundle.
3. **Apple Developer Program account** — Task 01 assumes the user has one ($99/yr). Without it the app can run on simulator only.
4. **Schema-drift workflow** — when web adds a Postgres column, iOS Codable models must follow. Hand-written for v1; add a `bin/gen-swift-types` script in v1.1 if drift becomes painful.
