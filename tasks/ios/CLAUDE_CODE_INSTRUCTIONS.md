# Claude Code — iOS Execution Instructions

Read this file first before executing any task in `tasks/ios/`.

---

## How to use these files

This directory contains the full iOS implementation plan for [APP_NAME]. Each `.md` file is a self-contained task spec. Execute them in order.

```
00_MASTER_PROMPT.md                        ← Read first — overview, module index, decisions
01_PROJECT_SETUP.md                        ← Execute first
02_DATA_MODELS_AND_SUPABASE_CLIENT.md      ← Execute second
03_AUTH_AND_SESSION.md                     ← Execute third
04_NAVIGATION_AND_SHELL.md                 ← Execute fourth
05_READ_CACHE_LAYER.md                     ← Execute fifth
06_DASHBOARD.md                            ← Modules — can run in parallel after 05
07_INBOX.md
08_CALENDAR.md
09_PROJECTS_CLIENTS.md
10_FINANCES.md
11_CONTRACTS.md
12_GEAR_LINKS_FORMS_HELP_SETTINGS.md
13_NATIVE_FEATURES.md
15_PROJECT_UPLOAD.md                       ← Depends on 04, 05, 09, 12
14_TESTING_RELEASE_TELEMETRY.md            ← Final task — App Store submission
```

---

## Before you start

### 1. Prerequisites

- **Xcode 15.4+** (for SwiftData GA, iOS 17 SDK, modern AppIntents)
- **iOS 17 simulator** installed (iPhone 15 + iPad Pro 12.9")
- **Apple Developer Program** membership (`$99/yr`) — required for device testing, push, App Groups, and App Store submission. Free Apple ID works for simulator only
- **Supabase project**: `oqaqopkcpgmjgswaismm` (the existing project — same backend the web app uses)
- **Google OAuth iOS client ID**: create at https://console.cloud.google.com/apis/credentials under the existing OAuth project; add the bundle ID and URL scheme
- **Apple Sign In capability** enabled on the bundle ID in Apple Developer portal

### 2. Secrets setup

Create `ios/Focals/Secrets.xcconfig` (gitignored):

```
SUPABASE_URL = https:/$()/oqaqopkcpgmjgswaismm.supabase.co
SUPABASE_ANON_KEY = <copy from my-app/.env.local>
GOOGLE_OAUTH_CLIENT_ID = <from Google Cloud Console>
OAUTH_URL_SCHEME = com.[APP_NAME].ios
```

Note the `$()` escape on the URL — xcconfig treats `//` as a comment, so the literal `https://` must be split with an empty `$()` substitution.

`Info.plist` references these via `$(SUPABASE_URL)`, `$(SUPABASE_ANON_KEY)`, etc.

### 3. Build/test invocations

```bash
# Build for simulator
xcodebuild \
  -workspace ios/Focals.xcworkspace \
  -scheme Focals \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.5' \
  build

# Run unit tests
xcodebuild \
  -workspace ios/Focals.xcworkspace \
  -scheme Focals \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.5' \
  test

# Run UI tests
xcodebuild \
  -workspace ios/Focals.xcworkspace \
  -scheme FocalsUITests \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.5' \
  test
```

Convenience wrappers live in `ios/bin/`:
- `bin/build.sh` — clean build
- `bin/test.sh` — run all tests
- `bin/archive.sh` — archive for TestFlight (Task 14)

---

## Key constraints (never violate)

- **`user_id` is always set server-side** by Supabase RLS (`auth.uid() = user_id`). Never include `user_id` in any client payload. Mutations target the row by `id`; RLS ensures it belongs to the caller.
- **All writes go through the repository layer** in `FocalsAPI`. No direct `supabase.from(...).insert(...)` calls in views.
- **All list views paginate** — every list screen uses `PageRequest { cursor, limit }` with default limit 50. No unbounded fetches.
- **SwiftData store is keyed by `user_id`** and wiped on sign-out. Two users on the same device must not see each other's cached data.
- **Design tokens only** — no hardcoded colors. Use `Color.tokens.bg`, `Color.tokens.accent`, etc. Audit with: `rg 'Color\((red|hex|#)' ios/`.
- **SF Symbols + brand fonts only** — no PNG icons (except the app icon itself). No system fonts (San Francisco) for headlines — use the brand display face.
- **Public API routes need tokens** — `/api/inquiry` requires `X-Inquiry-Token`, `/api/calendar/[userId]` requires `?token=`. The iOS app reads/writes these tokens via `inquiry_sources` and `profiles.calendar_token`, never embeds them in source.
- **Never trust client-provided dates for ordering** — `created_at`/`updated_at` come from the server. The client sends the date for user-input fields like `shoot_date`.

---

## Design constraints

- **Editorial dark-first** — light mode is a secondary override, dark is the default. iOS system appearance toggle respected, but the brand identity is dark.
- **No rounded pill buttons.** No gradient hero sections. No stock illustrations. Reference the existing web aesthetic (Acne Studios / Linear / Vercel dashboard).
- **Tap targets** — minimum 44×44 (matches web's `.app-tap` rule and Apple HIG).
- **Haptics** — light tap on sheet open, success on save, error on failed mutation. Use `UIImpactFeedbackGenerator` not custom Core Haptics patterns (those are reserved for Live Activity / Dynamic Island).
- **Pull-to-refresh** is standard on every list screen.
- **Empty states** are designed, not blank — use the shared `EmptyState` component with an SF Symbol, headline, body, and optional CTA.
- **Loading states** are skeletons (same shape as final content), not spinners.

---

## Per-task done criteria

Before marking any task complete:

1. **Builds clean** — `bin/build.sh` exits 0 with zero warnings.
2. **Unit tests green** — `bin/test.sh` passes for new and existing tests.
3. **Manually verified on simulator** — open the app, walk through the feature, take screenshots.
4. **Manually verified on one physical device** — at least once per task. Simulators lie about haptics, EventKit permission UI, push, Face ID, and PencilKit pressure.
5. **Acceptance criteria checked off** — every checkbox in the task file's "Acceptance Criteria" section.
6. **USER_TODO.md appended** — per project rule, drop a section at the end of every task with: tests run, security concerns, deferred items, dashboard config (Apple Developer / Supabase / Google Cloud) the user must do manually.

---

## When stuck

- The web app is the source of truth for **schema** and **business logic**. If unsure how a calculation works, read [my-app/src/lib/actions/](../../my-app/src/lib/actions/).
- The web's [MobileCalendarView.tsx](../../my-app/src/components/calendar/MobileCalendarView.tsx) is the visual reference for the iOS calendar — match it pixel-for-pixel.
- The Supabase schema lives in [my-app/src/lib/supabase/types.ts](../../my-app/src/lib/supabase/types.ts) — never re-derive types, port them.
- For supabase-swift questions: https://github.com/supabase/supabase-swift
- For SwiftData questions: Apple Developer documentation, not third-party blogs (the API has churned a lot since iOS 17.0 → 17.4).
