# User TODO — [APP_NAME] redesign

Items that need **your** action (outside code): manual testing, dashboard configuration, security rotations, and deferred implementation work. Organized by task.

> Ordering: items are sorted so you can mostly work top-to-bottom, but the **Urgent Security** section at the top should be addressed before the app goes anywhere beyond localhost.

---

## 🚨 Urgent security (do first)

These secrets were pasted into the Claude chat transcript at some point and should be treated as exposed. Most can be rotated in under 5 minutes.

- [ ] **Rotate Supabase DB password** — Dashboard → Project Settings → Database → **Reset database password**. Then update `~/.supabase/cli-env` with the new value (keep the single quotes around it since it may contain `$`).
- [ ] **Rotate `SUPABASE_SERVICE_ROLE_KEY`** — Dashboard → Project Settings → API → **Reset service role key**. Update `my-app/.env.local` `SUPABASE_SERVICE_ROLE_KEY=...` with the new value. Restart `npm run dev` after.
- [ ] **Confirm old Supabase personal access token is revoked** — https://supabase.com/dashboard/account/tokens — delete the token starting `sbp_b238...` if it's still listed (the new `sbp_81e9...` is what `~/.supabase/cli-env` uses now).

---

## Task 01 — Project Setup

Completed in full. Nothing user-side outstanding.

---

## Task 02 — Database Schema

Completed. Schema applied to project `oqaqopkcpgmjgswaismm` via `supabase db push`.

Tests to verify when convenient:
- [x] Open Supabase Dashboard → **Table Editor**. Confirm all 12 tables exist: `profiles`, `clients`, `projects`, `shoots`, `finances`, `gear`, `inquiries`, `inquiry_sources`, `contract_templates`, `contracts`, `forms`, `links`.
- [x] Dashboard → **Authentication → Policies**. Confirm each table shows one policy (`*_owner_access` or `profiles_self_access`) and that RLS is enabled.

No deferred implementation items.

---

## Task 03 — Auth & API Layer

Code done; dashboard setup pending.

### Google OAuth configuration (BLOCKING sign-in)

Currently the `/login` page shows a "Continue with Google" button, but clicking it will fail until these are configured:

- [x] **Google Cloud Console** → create an OAuth 2.0 Client ID (type: Web application). Note the client ID and client secret.
- [x] Google Cloud Console → OAuth 2.0 Client → **Authorized redirect URIs** → add `https://oqaqopkcpgmjgswaismm.supabase.co/auth/v1/callback`.
- [x] **Supabase Dashboard** → Authentication → Providers → Google → toggle **Enabled**, paste the Google client ID + secret, save.
- [x] Supabase Dashboard → Authentication → URL Configuration:
  - **Site URL**: `http://localhost:3000` (dev) — change to your Vercel URL for production.
  - **Redirect URLs**: add `http://localhost:3000/auth/callback` (and the prod version when deployed).

### Tests to run once Google OAuth is configured

- [x] `npm run dev`, visit `/login` in an incognito window.
- [x] Click "Continue with Google" → complete the OAuth flow → should land on `/` (dashboard), not `/auth/auth-code-error`.
- [x] In Supabase Table Editor → `profiles` table → confirm a row exists with your `id`, `email`, `full_name`, and `avatar_url` populated from the Google account.
- [x] While signed in, visit `/projects`, `/clients`, `/inbox`, `/calendar` — pages should load (will be empty / stubs for the modules not yet built).
- [x] In a **second** incognito window (not signed in), visit `/projects` → should 307-redirect to `/login`.
- [x] Sign out from the Account page (if still using the old JS page) OR call the `signOut` server action manually. Confirm session is cleared and you're redirected to `/login`.

### Deferred

- [ ] Rebuild the Sidebar nav to show the new routes (`/inbox`, `/calendar`, `/contracts`, `/clients`, `/settings`). It currently only shows Dashboard, Account, Shoots, Gear.
- [ ] Remove the direct `supabase.auth.signOut()` calls in the legacy files at `src/app/(dashboard)/account/AccountSettings.jsx` — will be rewritten when the Settings module is done.

---

## Task 04 — Dashboard

Code done. Requires an authenticated session (blocked by Google OAuth above) to see the UI.

### Tests to run

- [x] Sign in, visit `/` — dashboard should render with four KPI cards, two charts, the upcoming-shoots strip, recent projects list, and quick actions panel.
- [ ] With an empty DB, all four KPIs should show `$0` / `0` and the charts should render placeholder/empty states.
- [ ] **Quick Actions → New Project** → opens right-side slide-over → enter title → click "Create project" → slide-over closes → the recent projects list shows the new row.
- [ ] **Quick Actions → Add Client** → opens slide-over → enter name + email → submit → slide-over closes (no visual change on dashboard yet since clients aren't listed there, but you can confirm by checking Supabase `clients` table).
- [ ] **Quick Actions → Log Expense** → should navigate to `/finances/add` (legacy JS page — works against the OLD schema, will break; leave for Task 09 rewrite).
- [ ] **Quick Actions → New Inquiry** → should navigate to `/inbox` where you can click "+ Manual Entry".
- [ ] Click any KPI card → should navigate to its module (`/finances`, `/projects`, `/shoots`).
- [ ] Revenue chart shows the last 6 months of income vs expenses. With test data in the `finances` table, both lines should appear.

### Deferred

- [ ] **Dashboard loads in <1s on Vercel edge** (spec criterion) — requires a production deploy on Vercel to verify. Localhost dev server timings aren't representative.
- [ ] Real end-to-end testing with seeded data — if you don't want to manually click through the Quick Actions, a seed script using the service-role key would populate realistic test rows.

---

## Task 05 — Inquiry Inbox

Core flow done and E2E-verified (public endpoint tested live against your Supabase project).

### Tests to run

#### In the UI (requires sign-in)

- [ ] Visit `/inbox` — should show "No inquiries yet" empty state.
- [ ] Click **+ Manual Entry** → fill name + message → submit → row appears in the list with a `manual` source badge and `new` status.
- [ ] Click the inquiry row → slide-over opens showing all fields.
- [ ] Confirm the inquiry status flipped from `new` to `read` automatically when opened.
- [ ] Click **Mark replied** → badge changes to `replied`, panel closes.
- [ ] Filter tabs: click `New` / `Read` / `Replied` / `Converted` / `Archived` — list filters correctly.
- [ ] Create another manual inquiry → open it → click **Convert to Client** → check Supabase `clients` table for the new row, and `inquiries` table for `status='converted'`, `converted_client_id=<new client id>`.
- [ ] Create another → **Convert to Client + Project** → check both `clients` AND `projects` tables. The project's `client_id` should match the new client's `id`.

#### Public `/api/inquiry` endpoint (can be done without sign-in)

- [ ] Create a test inquiry source via the Supabase Table Editor OR via the `createInquirySource` action once a settings UI exists. For now, manual insert:
  - Table Editor → `inquiry_sources` → Insert row:
    - `user_id`: your own profile id (find in `profiles` table)
    - `type`: `website`
    - `label`: e.g. `my-website`
    - `config`: `{"token":"SOME_RANDOM_STRING_32_CHARS"}`
    - `is_active`: true
- [ ] Run this curl (substitute your token and make sure `npm run dev` is up):
  ```bash
  curl -X POST http://localhost:3000/api/inquiry \
    -H "Content-Type: application/json" \
    -H "X-Inquiry-Token: SOME_RANDOM_STRING_32_CHARS" \
    -d '{"name":"Test","email":"t@example.com","message":"Curl test"}'
  ```
  Expected: `{"success":true}` HTTP 201, and a new row in the `inquiries` table under your user_id.
- [ ] Same curl without the `X-Inquiry-Token` header → expect HTTP 401 with `{"error":"Missing X-Inquiry-Token header"}`.
- [ ] With a wrong token value → expect HTTP 401 `{"error":"Invalid token"}`.
- [ ] Toggle the source's `is_active=false` → retry the valid-token curl → expect HTTP 401 (inactive sources don't match).

### Security concerns

- [ ] **Rate-limit `/api/inquiry`** — currently no throttling. A bad actor with a leaked token can flood an inbox. Options: Vercel Edge Middleware with `@upstash/ratelimit`, Vercel Firewall rules, or Cloudflare in front. Even a crude middleware-level IP bucket is better than nothing.
- [ ] **Secure token generation on token display** — tokens are only shown once when `createInquirySource` is called. The future settings UI must make it clear the user should copy it immediately.
- [ ] **CORS policy** — `/api/inquiry` currently allows `Access-Control-Allow-Origin: *`. That's needed for the embeddable widget to work from arbitrary domains, but it means CORS alone can't gate requests (the token does). OK for now; revisit if multi-tenant in hostile environment.

### Deferred implementation

These are called out in the Task 05 spec but not built yet:

- [x] **Embeddable widget** `public/widget/inquiry.js` — DONE. Self-contained vanilla JS bundle with Shadow DOM isolation. Settings → Integrations → Inquiry sources now shows a "Embed widget snippet" `<details>` block per source, plus a "Test with curl" snippet. Test the rendering locally at [http://localhost:3000/widget/test.html](http://localhost:3000/widget/test.html). End-to-end verified: a real POST through the widget's payload format created the expected `inquiries` row with `source='website_form'` and `source_handle` populated from `sourceLabel`. (See **Widget tests** below.)
- [x] **Multi-source settings UI** — DONE in Task 08 (Integrations section of `/settings`). Now also includes the widget embed snippet, curl test snippet, AND a copyable webhook URL per source for connecting Resend / Zapier / Typeform / Tally / etc.
- [x] **Inbound email + multi-provider webhook intake** — DONE 2026-04-24. Architecture pivoted to user-owned integrations: each user wires up their own Resend account / Zapier flow / form service to point at this app's endpoint, instead of you running a central Resend account. The `/api/inquiry` endpoint now accepts three payload shapes via [src/lib/inquiries/parsers.ts](my-app/src/lib/inquiries/parsers.ts) — widget, Resend inbound-email (from/subject/text), generic JSON (smart field-name matching). Token can be in `X-Inquiry-Token` header OR `?token=` query for compatibility with low-code integrations. E2E verified all three parsers.
- [ ] **Sidebar unread-count badge** — small dot on the `Inbox` nav item showing count of `status='new'` inquiries. Requires either server-rendered layout fetch or polling.
- [ ] **Instagram DM intake** `/api/inquiry/ig/route.ts` — flagged as "future" in the spec; skip unless Meta/Instagram integration is in scope.

### User-side intake setup guides (how YOUR users connect their tools)

Each user creates an inquiry source in `/settings`, copies the webhook URL, then pastes it into one of these integrations:

#### Resend inbound parse (for users on Resend)
1. User goes to Resend Dashboard → **Domains** → confirm their domain is verified.
2. Resend Dashboard → **Inbound** → **Add inbound rule** → set the address (e.g. `inquiries@vflics.com`).
3. **Webhook URL** field: paste the webhook URL from `/settings` (the `?token=...` form, since Resend's UI takes a URL).
4. Save. Send a test email → it lands in the inbox with `source: 'email'`, `name` extracted from the From header.

#### Zapier
1. New zap, trigger on whatever (Gmail new email, Typeform submission, Slack message, etc.).
2. Action: **Webhooks by Zapier → POST**.
3. URL: paste the webhook URL from `/settings`.
4. Payload type: **JSON**. Map fields to `name` / `email` / `phone` / `message` / `shoot_type` / `preferred_date`.
5. The generic parser will pick it up. Common Zapier source fields auto-map.

#### Typeform / Tally / Google Forms
1. Form's webhook/integrations settings → POST to URL → paste the webhook URL from `/settings`.
2. The generic parser handles common field names; if your form labels are non-standard, rename to `name`/`email`/`message` for cleanest mapping.

#### Anything else that POSTs JSON
Just point it at the webhook URL. The generic parser tolerates a wide range of field names (`fullName`, `emailAddress`, `description`, `body`, `firstName`, etc.). If a payload doesn't extract correctly, you'll see it in `raw_payload` on the inquiry row and can adjust the parser later.

### Widget tests (added when widget shipped — `/public/widget/inquiry.js`)

#### Local smoke test (no real submission, just rendering)

- [ ] `npm run dev` running. Visit [http://localhost:3000/widget/test.html](http://localhost:3000/widget/test.html) directly (no auth needed — `/widget/*` is public).
- [ ] The host page shows garish red/lime/Comic Sans styling. Inside the bordered box below "Widget renders here ↓", the widget should render in a totally separate aesthetic: plain font, gray border, dark text on white. **If the widget inherits the host's red/lime styles, Shadow DOM isolation is broken.**
- [ ] Click into each input. Cursor moves between fields. The text inputs are NOT styled with the host page's red background.
- [ ] Submit with token = `TEST_TOKEN_REPLACE_ME` → expect "Invalid token" error rendered in the widget. Confirms error handling works.

#### Real-world submission test (requires sign-in)

- [ ] Sign in to `/settings`, scroll to **Inquiry sources**.
- [ ] Reveal the token on an active source. Copy it.
- [ ] Edit `my-app/public/widget/test.html` and replace `TEST_TOKEN_REPLACE_ME` with the real token. Save.
- [ ] Reload `http://localhost:3000/widget/test.html` (no cache; turbopack picks up the change).
- [ ] Fill in the form: name, email, message → click **Send inquiry**.
- [ ] Widget should switch to a "✓ Inquiry sent" success state.
- [ ] Visit `/inbox` → new inquiry appears with `source=website_form`, `name` from form, `source_handle` matching `sourceLabel` from `window.APP_NAME_CONFIG` (in test.html, "widget test page").

#### Production embedding test (requires Vercel deploy + real domain)

- [ ] After deploying to Vercel, copy the widget snippet from `/settings` (it'll point to your Vercel URL).
- [ ] Paste into any HTML file on a different domain (e.g. `vflics.com`). Confirm:
  - The CORS preflight OPTIONS request succeeds (browser DevTools → Network).
  - The form renders and submits.
  - You can see the inquiry in your Inbox.
- [ ] **Important:** revoke the token (toggle Disable in `/settings`) and confirm the embedded widget then shows "Invalid token" on submit.

### Security concerns added by the widget

- [ ] **`/widget/*` is now in `PUBLIC_ROUTES`** in middleware (Task 05 widget addition). This means any future file you put in `my-app/public/widget/` will be served unauthenticated. Don't put sensitive files there.
- [ ] **Widget code itself contains no secrets** — the token is provided at runtime via `window.APP_NAME_CONFIG.token` set by the embedding page, not baked into `inquiry.js`. Anyone who downloads `inquiry.js` learns nothing they couldn't get by inspecting a website that embeds it.
- [ ] **Token is visible to anyone who views source on the embedding page.** This is fundamental to the design — a per-source token IS designed to live in client-side HTML. Keep tokens revocable and per-site so a leak only compromises one inbox channel.
- [ ] **Source-label spoofing** — a malicious actor with the token could submit `source_label: "Anything"`. The endpoint stores whatever comes in. Mitigation: in the inbox UI, also surface the configured source label from `inquiry_sources.label` (which the actor can't change) alongside the user-supplied `source_handle`. Currently we use `source_label ?? source.label`, falling back to the configured label, which is reasonable.

---

## Task 06 — Calendar

Core flow done and E2E-verified (public `.ics` endpoint tested live against your Supabase project).

### Tests to run

#### In the UI (requires sign-in)

- [ ] Visit `/calendar` — calendar renders with month view, filter buttons (Month / Week / Day / Agenda), today's date highlighted in accent color.
- [ ] Click an empty day → slide-over opens with date prefilled → fill title → **Create shoot** → slide-over closes → event appears on the calendar.
- [ ] Click an existing event → slide-over opens in edit mode with all fields populated → change duration → **Save changes** → event updates.
- [ ] In edit mode, click **Delete** (confirm prompt) → event disappears.
- [ ] Click **+ Shoot** button in the header → same slide-over opens with no preset date.
- [ ] Switch views between Month / Week / Day / Agenda — each view renders with the dark theme.
- [ ] Navigate forward/back months via toolbar arrows — events in other months render correctly.
- [ ] The "Subscribe" card below the calendar shows your unique feed URL.

#### Calendar subscribe URLs (requires sign-in + seeded shoot)

- [ ] Click **Copy** on the subscribe card → URL copies to clipboard, button shows "Copied".
- [ ] Click **Add to Apple Calendar** → macOS should prompt to subscribe via `webcal://`. Accept. Open Calendar app → your shoots appear in a new subscribed calendar. Refresh interval defaults to ~every hour.
- [ ] Click **Add to Google Calendar** → opens Google Calendar in a new tab with "Add by URL" prompt pre-filled. Accept. Shoots appear in a new calendar under "Other calendars".
- [ ] Click **Regenerate URL** → confirm prompt → click Yes → URL in the code block changes. Apple Calendar / Google Calendar subscriptions using the old URL should stop refreshing (they'll show 401 silently until you re-add).

#### Public `/api/calendar/<userId>` endpoint (no sign-in)

The E2E tests already passed against the live DB — these are the manual versions if you want to reproduce:

- [ ] Without token: `curl -I http://localhost:3000/api/calendar/<your-user-id>` → HTTP 401.
- [ ] With wrong token: `curl -I http://localhost:3000/api/calendar/<your-user-id>?token=wrong` → HTTP 401.
- [ ] With valid token: `curl http://localhost:3000/api/calendar/<your-user-id>?token=<your-token>` → `text/calendar` body starting with `BEGIN:VCALENDAR`.
  - Find your user_id in the `profiles` table; the token in `profiles.calendar_token`.
- [ ] `cancelled` shoots should NOT appear in the feed — flip a shoot's status in the Table Editor and re-fetch to confirm.

### Security concerns

- [ ] **Feed token is URL-based** — the URL itself is the secret. If you share your subscribe URL with anyone, they have read access to your entire shoots calendar. Regenerate if you accidentally pasted it somewhere public.
- [ ] **No rate limiting on `/api/calendar/<userId>`** — same concern as `/api/inquiry`. Apple/Google Calendar poll every ~5-60 minutes, so traffic is low in practice, but an attacker brute-forcing tokens should be throttled. Add an IP-based rate limit before public launch.
- [ ] **Token format is a UUID v4** (from `gen_random_uuid()`), which is 122 bits of entropy. Good enough, but not rotatable automatically.
- [ ] **The `.ics` feed leaks client names, project titles, locations, and notes** to anyone with the URL — that's the intended behavior (otherwise you couldn't see the events in your calendar app), but be mindful of that when sharing.

### Deferred implementation

- [ ] **Calendar sync card in `/settings/integrations`** — the spec envisions this on a Settings page. For now the CalendarSync card lives directly on `/calendar`. Move it during the Settings module task (Task 08 in the spec).
- [ ] **Drag-to-reschedule** on calendar events — `react-big-calendar` supports this via `onEventDrop`. Currently events are click-to-edit only. Easy follow-up if you want it.
- [ ] **Color coding by project category** — currently events are colored by shoot status (scheduled/completed/cancelled/rescheduled). Could also tint by project category if useful.
- [ ] **`completed` shoots included in feed** — currently only `cancelled` is excluded. Consider adding a user preference to also hide `completed` after a certain age to reduce calendar clutter.

### Dashboard / external config

- [ ] Nothing new on the Supabase dashboard side for Task 06. The migration `20260423154234_profiles_calendar_token.sql` was already applied via `supabase db push`.
- [ ] The `NEXT_PUBLIC_SITE_URL` env var in `.env.local` is currently `http://localhost:3000`. When you deploy to Vercel, update it to your Vercel URL — otherwise the feed URLs on the subscribe card will still say `localhost`.

---

## Task 07 — Contracts

All 5 routes done: `/contracts` (list), `/contracts/new` (create flow with live preview), `/contracts/[id]` (detail + status transitions), `/contracts/templates` (manage templates), `/api/contracts/[id]/pdf` (PDF export). Typecheck + build green; all routes auth-gated.

### Prerequisites to test this

To exercise the full flow, you need at least:
- **One authenticated session** (Google OAuth must be configured — see Task 03 section above).
- **At least one client row** (create from Dashboard Quick Actions → Add Client, OR seed directly in Supabase Table Editor).
- **At least one project row** (create from Dashboard Quick Actions → New Project, OR seed directly).

Without a client + project, `/contracts/new` shows an empty-state prompt instead of the form.

### Tests to run (requires sign-in)

- [ ] Visit `/contracts` → first visit auto-creates the "Photography session agreement" starter template (check `contract_templates` table to confirm one row exists with your user_id). Page shows empty state.
- [ ] Click **Templates** → `/contracts/templates` → starter template is listed with a merge-tag count.
- [ ] Click **Edit** on the starter template → slide-over opens with body editable and a row of merge-tag chips (client_name, shoot_date, etc.) — clicking a chip inserts `{{tag}}` at the cursor.
- [ ] Edit the template body, hit **Save changes** → slide-over closes, list reflects updated timestamp.
- [ ] Click **+ New template** → slide-over opens empty → enter a name and body with `{{client_name}}` → save → new template appears.
- [ ] Click **Delete** on a non-default template → confirm prompt → disappears from list.
- [ ] Back to `/contracts`, click **+ New contract** → opens `/contracts/new`.
- [ ] Select template + project + client → the right-side preview renders with all merge tags filled in.
- [ ] Leave a `{{some_unknown}}` in the template body → preview shows that token literally AND the yellow "Unfilled tags" warning below.
- [ ] Add a custom field with key `some_unknown` and value "X" → preview updates and warning clears.
- [ ] Click **Create contract** with any unresolved tags → error message, doesn't save.
- [ ] With all tags resolved, click **Create contract** → navigates to `/contracts/<id>` showing the rendered body.
- [ ] On the detail page, click **Mark as sent** → status badge changes to `sent`, `sent_at` populated (check `contracts` table).
- [ ] Click **Mark as signed** → status changes, `signed_at` populated.
- [ ] Click **Void** → status → `void`. Then click **Restore to draft** → back to draft.
- [ ] Click **Export PDF** → browser downloads a `<title>.pdf` file.
- [ ] Open the PDF → has letterhead (business/photographer name), title, subline (client · project), rendered body, a "Additional terms" section if any custom fields existed, page footer with contract id + page number.
- [ ] Back to `/contracts` → the new contract appears in the table with client, project, status, created date columns.

### Security concerns

- [ ] **PDF route requires auth** — `/api/contracts/[id]/pdf` is NOT in the middleware public routes list, so an unauthenticated request gets a 307 redirect to `/login`. The route handler also double-checks `user.id` matches `contracts.user_id` via RLS. Confirmed via probe.
- [ ] **RLS covers all contracts access** — the table policy `contracts_owner_access` (from Task 02) blocks cross-user reads and writes. The PDF renderer pulls only rows owned by the current user.
- [ ] **Contract body is immutable after creation** — merge tags are resolved server-side at create time and persisted. If source data (package price, client name) changes later, the contract body does NOT drift. That's intentional for contract integrity, but note: **there is no UI to edit a rendered contract body**. Users must delete and recreate if they need changes. Consider if you want an "Edit body" flow later.
- [ ] **Unreplaced merge tags are blocked** — `createContract` validates `findUnreplacedTags` returns zero before saving. Can't accidentally ship a contract with `{{balance_due}}` literal in it.
- [ ] **`ensureDefaultTemplate` runs on every GET to `/contracts`, `/contracts/templates`, `/contracts/new`** — cheap guard (one SELECT + one INSERT only if empty), but it means a malicious concurrent request volley could race to create duplicates. In practice RLS + unique `(user_id, name)` would be the right hardening if this becomes a real concern; for a single-user app it's fine.

### Deferred implementation

- [ ] **"Contract linked to project" rendering in the project detail panel** — spec says "Contracts linked to projects show in project detail panel." That lives in the Projects module (Task 06 in the spec, not yet rewritten). When the Projects module is rebuilt, include a Contracts tab in its detail slide-over showing `contracts` filtered by `project_id`.
- [ ] **Rich-text template editor** — currently plain textarea. If you want bold/italics/lists in templates later, plug in tiptap/prosemirror; PDF layer would need a matching renderer.
- [ ] **Contract versioning / editing** — once created, a contract's rendered body is frozen. No "edit body" button. Add an explicit "Duplicate contract" button if you need to revise.
- [ ] **E-signature integration** — the "Mark as signed" button just flips status + timestamp. No actual digital signature collection. Tools like DocuSeal or HelloSign could be wired in later.
- [ ] **Template preview on `/contracts/templates`** — currently templates show only name + tag count. A "Preview with sample data" mode would help users before they use a template. Spec mentions this but it's optional.

### Dashboard / external config

Nothing new on any external service. All work was code + DB queries against existing tables (`contract_templates`, `contracts` — created in Task 02's init migration).

---

## Task 08 — Remaining Modules (Gear, Links, Forms, Settings)

Four modules built end-to-end. Sidebar nav rebuilt to expose all routes. Theme provider rewritten for the new editorial palette. Production build green.

### Tests to run (requires sign-in)

#### Sidebar nav (sanity check first)

- [ ] Sign in. Confirm the sidebar now shows: Dashboard / Inbox / Calendar / Projects / Clients / Shoots / Finances / Contracts (under "Main") and Gear / Forms / Links / Settings (under "More"). Active route should be highlighted.
- [ ] Click each nav item → page loads (some still legacy and broken — see "Legacy JS modules" section below).

#### Gear `/gear`

- [ ] Visit `/gear` — empty state shown.
- [ ] Click **+ Add gear** → slide-over opens → fill name, category, status, brand, model, purchase price → **Add gear** → row appears in the grid with a status badge.
- [ ] "Total value (owned)" in the header should match the sum of `purchase_price` across owned items.
- [ ] Filter chips: click `Wishlist` → only wishlist items shown. Click `Sold` / `Rented` / `All`.
- [ ] Category filter chips work the same way.
- [ ] Click a gear card → slide-over re-opens in edit mode → change something → **Save changes** → reflected on grid.
- [ ] Click **Delete** in edit mode → confirm → row gone.

#### Links `/links`

- [ ] Visit `/links` — empty state.
- [ ] Click **+ Add link** → enter title + URL (must be valid http(s)://) + category + notes → save → card appears with favicon, hostname, category badge.
- [ ] Click the title → opens URL in new tab.
- [ ] Click ⋯ button on a card → slide-over opens for edit → save / delete.
- [ ] Filter by category (Inspiration / Client / etc.) — only matching links shown.

#### Forms `/forms`

- [ ] Visit `/forms` — empty state.
- [ ] Click **+ New form** → slide-over opens. The 5 system fields (Name / Date / Category / Pay / Expenses) are listed as locked and cannot be removed.
- [ ] Click **+ Add custom field** → a new editable row appears with drag handle, label input, type select (text/date/currency/contact/checkbox), Required and Preview checkboxes, ×.
- [ ] Add multiple fields, then drag the handle on one to reorder. Order should update visually.
- [ ] Try to enable Preview on a 4th field — disabled because limit is 3 hover previews. Header shows `3/3 hover previews` in warning color.
- [ ] Add 11 fields → should refuse with "Maximum 10 custom fields" error.
- [ ] Save → row appears in the forms list with the count of custom fields and updated date.
- [ ] Click **Edit** on a saved form → fields render in saved order with their checkbox states preserved → modify → save again.
- [ ] Click **Delete** in edit mode → confirm → form gone.

#### Settings `/settings`

- [ ] Visit `/settings` — anchor nav at top with Profile / Integrations / Appearance / Account.
- [ ] **Profile section**: full_name, business_name fields auto-populated from your Google profile (set during auth callback). Email is read-only. Edit website + instagram_handle → **Save profile** → green "Saved." → check `profiles` table in Supabase to confirm persistence.
- [ ] **Integrations → Inquiry sources**: click **+ New inquiry source**, choose type Website, label e.g. "test-site" → **Create source**. New row appears with masked token. Click **Reveal** → token shown. **Copy** → token in clipboard. Click **Show embed snippet** → vanilla JS HTML snippet visible with the token + your endpoint URL pre-filled.
- [ ] **Disable** an inquiry source → repeat the curl test from the Task 05 section using its token → expect HTTP 401 (inactive sources are rejected).
- [ ] **Integrations → Calendar sync**: same `CalendarSync` card from Task 06 — Copy URL / Add to Apple Calendar / Add to Google Calendar / Regenerate URL. Already tested in Task 06.
- [ ] **Integrations → Future integrations**: shows three "Coming soon" cards (Instagram DM / Stripe / HoneyBook). Visual only, no actions.
- [ ] **Appearance**: click each theme button (Light / Dark / System). Page should re-paint immediately. Reload the page — preference persists (localStorage). Click an accent color (Sand / Sage / Rose / Sky / Terracotta) → accent color in cards/buttons changes. Reload — accent persists.
- [ ] **Account → Sign out**: clicks signOut server action → redirects to /login.
- [ ] **Account → Delete account**: click "I understand, continue" → typed confirmation appears → typing anything other than `DELETE` keeps the button disabled → type `DELETE` → click. After ~1s, you're redirected to /login. **DESTRUCTIVE — this permanently deletes your auth user + ALL data via cascade. Don't run unless you actually want to wipe.** If you want to test, create a throwaway Google account first.

### Security concerns

- [ ] **`deleteAccount` uses the admin Supabase client** (service-role) to call `auth.admin.deleteUser`. The action verifies `requireUser()` first (RLS-equivalent on the action layer) AND requires the user to type "DELETE" exactly. Both guards are needed — the admin client bypasses RLS, so omitting either would let any signed-in user delete any user by guessing IDs (wait, no — the action only deletes `auth.user.id` of the caller, no ID-passing parameter). Still, defense-in-depth.
- [ ] **Database FK cascade is what actually wipes the data**. When `auth.users.<id>` is deleted, every table with `user_id REFERENCES profiles(id) ON DELETE CASCADE` removes its rows. We confirmed this is set on every table during Task 02. **If you ever ALTER any table later and use `ON DELETE NO ACTION` or `SET NULL`, account deletion will start orphaning data.**
- [ ] **Inquiry source tokens are stored in plaintext JSONB** (`config->>token`). Hashed-at-rest would be better, but tokens are revocable per-source and only used for inserts (not reads), so the blast radius of a leak is limited. If you start using these tokens for higher-trust operations, hash them.
- [ ] **`createAdminClient` is now imported in 3 places**: `/api/inquiry`, `/api/calendar/[userId]`, `lib/actions/profile.ts` (deleteAccount). Each of these has its own auth guard. Make sure no one ever imports `createAdminClient` from a regular page or middleware — it's marked `'server-only'` to make that fail at build time.
- [ ] **No CSRF protection on server actions** — Next.js's built-in protection only fires for actions invoked through forms, not for direct fetches. The deleteAccount action specifically takes a string parameter, so a malicious site COULD theoretically trigger it via a CORS-allowed request. In practice the user must be signed in AND the action requires the literal "DELETE" string. Worth knowing if you ever add cross-origin auth.

### Deferred implementation

- ~~**Avatar upload**~~ — Decided 2026-04-24: not implementing. The Google OAuth avatar (auto-populated into `profiles.avatar_url` at first login) is the source of truth. No Supabase Storage bucket / upload UI needed.
- [ ] **Form submissions table** — spec said "Form submissions stored (future feature — scaffold the table now)". I did NOT scaffold a `form_submissions` table. The current `forms` table just stores definitions. When you're ready to collect submissions, add a migration with a `form_submissions` table (form_id, submitted_at, payload JSONB, etc.) and an API endpoint to receive them.
- [ ] **Forms drag-drop on touch devices** — the @dnd-kit setup uses PointerSensor + KeyboardSensor. Touch should work but isn't tested. Add `TouchSensor` if you find phone reordering is broken.
- [ ] **Account section: Export data** — not in spec but worth considering before full Delete. Common pattern: button to download a JSON export of all user-owned rows. Add later if needed.

### Dashboard / external config

- [ ] Nothing new on Supabase / Google Cloud / Resend dashboards. All work was code + DB queries against tables that already existed (created in Task 02).

---

## Task 09 — Projects, Clients, Shoots, Finances rewrites

All four legacy modules rewritten on the new schema. Legacy JSX pages, legacy API routes, legacy `app/components/`, legacy `utils/`, and the `/test` page have all been deleted. The codebase no longer has ANY references to the old `user` column or JSONB `fields` blobs.

### Tests to run (requires sign-in)

#### Projects `/projects`

- [ ] Visit `/projects` — empty state shows.
- [ ] Click **+ New project** → slide-over → fill title, optionally select a client, set status / shoot date / package price → **Create project** → row appears in table.
- [ ] Click a row → slide-over re-opens in edit mode → change `amount_paid` and `payment_status` → save → table reflects new payment badge.
- [ ] Click a column header (Project / Status / Shoot date / Price) → table sorts. Click again → reverse direction.
- [ ] Click status pipeline tabs (Inquiry / Booked / In progress / Editing / Delivered / Completed / Cancelled) → table filters. Each tab shows a count.
- [ ] Click **Delete** in edit mode → confirms → row gone. Note: linked shoots / finances / contracts have their `project_id` set to NULL (FK SET NULL).

#### Clients `/clients` and `/clients/[id]`

- [ ] Visit `/clients` — empty state shows.
- [ ] Click **+ New client** → fill name + email + source → save → row appears.
- [ ] Search box: type partial name / email / phone → list narrows.
- [ ] Source filter chips (inquiry / referral / instagram / website / manual) → list narrows.
- [ ] Click a client row → navigates to `/clients/[id]` (full page, not slide-over per spec).
- [ ] Detail page shows: Contact card (email, phone, notes, source badge), Projects card (filtered by client_id), Shoots card, Inquiry history (only if any inquiries with this client as `converted_client_id`), Contracts card.
- [ ] Click **Edit** on detail page → ClientForm slide-over opens → save → page refreshes.
- [ ] Click **Delete** in edit mode → confirms → redirects to `/clients`. Linked projects / shoots / inquiries have their `client_id` set to NULL.

#### Shoots `/shoots`

- [ ] Visit `/shoots` — defaults to "Upcoming" tab.
- [ ] Click **+ New shoot** → ShootForm slide-over (same one used in Calendar / Dashboard) → save → appears in upcoming list.
- [ ] Each shoot card: large date badge on the left, title + meta in the middle (time, client, project, location, duration), status badge on the right.
- [ ] On a `scheduled` upcoming shoot, click **Done** → status flips to `completed`, row visible only in Past tab. Click **Cancel** → status `cancelled`, also moves to Past tab.
- [ ] Click on a shoot's date badge or title → ShootForm opens in edit mode.
- [ ] Toggle to **Past** tab → past shoots ordered descending by date.

#### Finances `/finances`

- [ ] Visit `/finances` — defaults to "This month" period.
- [ ] Period chips work: This month / Last month / This quarter / This year / All time.
- [ ] Summary bar shows: Income (green), Expenses (red), Net profit (auto green if positive, red if negative).
- [ ] Bar chart shows last 6 months of income vs expenses (rolling, NOT affected by period filter).
- [ ] Click **+ Income** → slide-over with type pre-set to `income` → fill amount + date + category → save → row appears in table with green badge and `+$` formatted amount.
- [ ] Click **+ Expense** → same flow but red badge and `−$` prefix.
- [ ] Click a transaction row → slide-over opens in edit mode → modify or delete.
- [ ] Sort: rows are date-descending automatically.
- [ ] After adding/editing/deleting a transaction, the dashboard `/` should reflect the new revenue MTD KPI on next load (revalidatePath `/` is called from the actions).

### Security concerns

- [ ] **All four modules use the standard `requireUser()` + RLS pattern**. Same security posture as the rest of the app: server-side auth check, RLS-scoped queries.
- [ ] **Project / client / shoot deletes cascade correctly** (FK ON DELETE SET NULL on linked rows from Task 02 schema). No orphan data, but linked rows lose their reference.
- [ ] **Finances actions revalidate `/` AND `/finances`** so the Dashboard KPIs stay fresh. If you add more pages that depend on finance totals, add their paths to `revalidatePath` calls in [src/lib/actions/finances.ts](my-app/src/lib/actions/finances.ts).
- [ ] **No new secrets exposed in this task.**

### Deferred implementation

- [ ] **Multi-tab project detail panel** — spec called for slide-over with Overview / Shoots / Finances / Contract tabs. We chose a single edit-only slide-over for simplicity; linked rows are visible on the project page or via Client detail. If you want the tabbed view later, the data is already there.
- [ ] **Custom date range on Finances** — the spec mentioned a "Custom" option; we provided 5 fixed periods. Add later if you need a date-picker.
- [ ] **CSV export on Finances** — common for accounting / tax season; spec didn't call it out but it's a natural follow-up.
- [ ] **Virtualized projects table** — currently renders all rows up to the 200-row default cap from `listProjects`. Add `@tanstack/react-virtual` if you ever exceed that.
- [ ] **"Convert inquiry" button on client detail** — spec mentioned this but inquiries → clients is already handled in `/inbox` Convert action. Adding a redundant button on the client detail isn't worth the complexity right now.

### Dashboard / external config

- [ ] Nothing new on Supabase / Google / Resend / Vercel. All work was code-only against tables that existed since Task 02.

---

## Task 10 — In-app tutorials + Help docs

User-requested: tour-style onboarding for every page on first visit + a permanent /help section with per-module guides.

### What was built

- **Migration** — `profiles.tutorial_progress JSONB` column added (default `{}`). Tracks per-tour seen state, survives logout / multiple devices. ([migrations/20260426191116_profiles_tutorial_progress.sql](my-app/supabase/migrations/20260426191116_profiles_tutorial_progress.sql))
- **Server actions** — [src/lib/actions/tutorial.ts](my-app/src/lib/actions/tutorial.ts): `markTourSeen(tourId)` and `resetTours()`.
- **Tour UI primitives**:
  - [Tour.tsx](my-app/src/components/tour/Tour.tsx) — spotlight + step dialog, keyboard nav (←/→/Enter/Esc), auto-positioning around target element with viewport clamping
  - [TourGate.tsx](my-app/src/components/tour/TourGate.tsx) — server component that reads `tutorial_progress` and only renders the Tour if not yet seen
  - [tours.ts](my-app/src/components/tour/tours.ts) — 12 tour configs, one per module, ~3 steps each
  - [types.ts](my-app/src/components/tour/types.ts) — TourStep / TourConfig types
- **Module wiring** — every page (`/`, `/inbox`, `/calendar`, `/projects`, `/clients`, `/shoots`, `/finances`, `/contracts`, `/gear`, `/links`, `/forms`, `/settings`) renders its `<TourGate>` and has `data-tour` attributes on the elements its steps reference.
- **Help docs** — [/help](my-app/src/app/(dashboard)/help/page.tsx) index page + [/help/[slug]](my-app/src/app/(dashboard)/help/[slug]/page.tsx) dynamic per-module page. Content lives in [src/lib/help/content.ts](my-app/src/lib/help/content.ts) — 12 entries × ~3 sections each. SSG-rendered (12 pages prerendered at build).
- **Sidebar** — added `Help` to the More group between Links and Settings.
- **Settings → Account** — added a "Replay tutorials" button that calls `resetTours()` and lets the user re-trigger every page tour.

### Tests to run (requires sign-in)

- [ ] Sign in fresh (or reset via Settings → Replay tutorials, or manually clear `tutorial_progress` to `{}` in Supabase Table Editor).
- [ ] Visit `/` — tour overlay appears with a centered intro dialog, Skip + Next + Step counter.
- [ ] Click Next → spotlight moves to the KPI row with the dialog positioned below. Then to the charts row, then the Quick Actions panel. Final step Got it dismisses the tour.
- [ ] Reload `/` — tour does NOT appear again (saved to `profiles.tutorial_progress.dashboard = true`).
- [ ] Visit `/inbox` — its own tour appears (independent of the dashboard tour).
- [ ] Same for `/calendar`, `/projects`, `/clients`, `/shoots`, `/finances`, `/contracts`, `/gear`, `/links`, `/forms`, `/settings`.
- [ ] Press Esc during any tour → dismissed and marked seen.
- [ ] Press ← / → / Enter for keyboard navigation.
- [ ] Visit `/help` from the sidebar → grid of 12 module tutorial cards.
- [ ] Click any card → `/help/<slug>` shows multi-section guide with "Open <module>" button at top right.
- [ ] Settings → Account → click **Replay tutorials** → confirmation appears → reload any module page → tour shows again.

### Security concerns

- [ ] `markTourSeen` and `resetTours` use `requireUser()` and only update the calling user's row (RLS-equivalent on the action layer, plus the WHERE clause hardcodes `auth.user.id`). No way to write to another user's tutorial state.
- [ ] `tutorial_progress` is a JSONB column — accepts any shape. We only store boolean values keyed by tour id, but a malicious caller could theoretically inject other keys. Harmless because we only ever read keys we know about, and the column is ignored everywhere else.

### Deferred

- [ ] **Tour content review** — the 12 tour configs and 12 help entries were written from scratch in one go. If anything reads weirdly to actual users, edit [tours.ts](my-app/src/components/tour/tours.ts) and [help/content.ts](my-app/src/lib/help/content.ts). Help content rebuilds on every deploy (SSG); tour content is just a code update.
- [ ] **Tour analytics** — we don't currently track which tours users skip vs. complete. If you want to optimize for completion rate later, add a "skipped" / "completed" distinction in `markTourSeen`.
- [ ] **Per-step deep links** — if you change a `data-tour` attribute on a page but forget to update the corresponding step's `target`, the spotlight just falls through to a centered dialog. Tolerated; would be nice to surface a build-time warning.

---

## Task 11 — Mobile-responsive UX

User-requested: "Design the UX to be responsive for mobile too." Sweep across the entire app to deliver app-quality mobile experience with cards instead of tables, hamburger drawer nav, 44px tap targets, and stacked form layouts.

### What was built

**Global responsive primitives** ([src/app/globals.css](my-app/src/app/globals.css))

- Breakpoint at 768px (matches Tailwind's `md`).
- Utility classes: `.app-mobile-only` / `.app-desktop-only` (block), `.app-mobile-only-inline` / `.app-desktop-only-inline` (inline-flex), `.app-stack-mobile` (collapses any grid to 1 column), `.app-page` (shrinks page padding from 2rem 1.5rem → 1rem), `.app-tap` (44x44 minimum), `.app-tap-skip` (opt-out for drag handles, etc.).
- Global mobile rules: all buttons, anchors with role=button, form controls bumped to `min-height: 44px`. Form inputs get `font-size: 1rem` to prevent iOS Safari zoom-on-focus.
- Page titles shrink from 2rem → 1.5rem on mobile.
- Viewport meta export in [layout.js](my-app/src/app/layout.js): `width=device-width, initial-scale=1, viewport-fit=cover` (allows zoom for accessibility).

**Hamburger drawer nav** ([src/components/layout/MobileNav.tsx](my-app/src/components/layout/MobileNav.tsx))

- Sticky top bar (56px tall) with hamburger button on left, current page title in center.
- Tap hamburger → drawer slides in from left over a backdrop. Tap backdrop, tap a nav item, or press Esc → closes.
- Body scroll locks when drawer open. Drawer auto-closes on route change.
- Sidebar refactored: `<Sidebar>` is the desktop fixed rail; `<NavBody>` is the shared inner nav re-used by both sidebar and mobile drawer (DRY).
- `(dashboard)/layout.tsx` uses `app-desktop-only` to hide sidebar on phones, and a global `.app-shell` class that drops the 220px offset on mobile.

**Tables → cards on mobile** ([Projects](my-app/src/components/projects/ProjectsTable.tsx), [Finances](my-app/src/components/finances/FinancesView.tsx), [Contracts](my-app/src/app/(dashboard)/contracts/page.tsx))

Each list now ships two layouts:
- Desktop: existing table with column headers, sortable, hover rows.
- Mobile: stacked cards with title + status + meta line + key value (price, amount, etc.) + secondary badge.

The desktop element gets `className="app-desktop-only"`, the mobile card list gets `className="app-mobile-only"`. Both render server-side; CSS toggles visibility — no JS branching, no hydration mismatch risk.

**Form internal grids stack** — every form's `gridTemplateColumns: '1fr 1fr'` / `'1fr 1fr 1fr'` / `'2fr 1fr'` row got `className="app-stack-mobile"` so it collapses to one column on phones. Affected: ClientForm, ProfileSection, ShootForm, ProjectForm, GearForm, TransactionForm, NewContractForm preview/inputs split, contract-detail DtDd grid, client-detail Contact grid, dashboard's Recent Projects + Quick Actions split, settings inquiry-source detail rows.

**Calendar mobile** ([CalendarView.tsx](my-app/src/components/calendar/CalendarView.tsx) + [calendar-overrides.css](my-app/src/components/calendar/calendar-overrides.css))

- Auto-default to Agenda view on screens ≤ 600px (Month grid is unusable that small).
- Toolbar wraps to multi-row vertical layout on phones, buttons shrink slightly.

**Tap-target opt-outs** — drag handle and × button in [SortableField.tsx](my-app/src/components/forms/SortableField.tsx) marked `app-tap-skip` so 44px doesn't break the inline form-builder row layout.

### Tests to run on mobile (real device or Chrome DevTools device-emulator)

- [ ] Open Chrome DevTools → toggle device emulator → iPhone 14 Pro or similar (≤ 768px).
- [ ] Visit `/` → no horizontal scroll. Sidebar gone, top bar visible with hamburger + "Dashboard" title.
- [ ] Tap hamburger → drawer slides in from left with all nav items. Tap any item → navigates AND drawer closes.
- [ ] Tap hamburger again, then tap the backdrop (gray area) → drawer closes.
- [ ] Press Esc with drawer open → drawer closes.
- [ ] Scroll `/` content while drawer open is impossible (body scroll-locked) — close drawer to scroll.
- [ ] Visit `/projects` with seeded data → cards stack vertically, no table. Tap a card → slide-over opens at full mobile width.
- [ ] Same on `/finances` → bar chart still renders, summary stats stack, transactions show as cards with green/red type badges.
- [ ] Same on `/contracts` → contract cards instead of table.
- [ ] Visit `/calendar` → defaults to Agenda view. Toolbar buttons are stacked vertically.
- [ ] Open any slide-over (New project, Add client, etc.) → fills nearly the full screen width with proper padding.
- [ ] Inside a slide-over, 2-column field rows (e.g. Status / Shoot date in ProjectForm) stack to single column.
- [ ] Tap any text input → cursor positions, no automatic page zoom (iOS Safari specifically).
- [ ] Tap the small `⋯` button on a Links card → slide-over opens for editing.
- [ ] Visit `/settings`, scroll to Inquiry sources → token rows wrap onto multiple lines on phone (was a single 90px label + value + 2 buttons row on desktop).
- [ ] First sign-in tour still triggers; tour dialog stays within viewport bounds (no off-screen text).
- [ ] Form Builder drag handle still draggable; drag-handle and remove × stayed compact (didn't get bumped to 44px).

### What was NOT changed (intentionally)

- Login page — already mobile-friendly, didn't touch.
- Help guide pages — single-column text content already responsive.
- Auth callback / error pages — non-interactive.
- Tour dialog itself — already had `maxWidth: calc(100vw - 32px)` and viewport-clamping.

### Security concerns

- [ ] None added by this task. Mobile responsive is purely UI/CSS work.

### Deferred

- [ ] **Bottom tab bar option** — we chose hamburger drawer per your selection. If you ever want to switch to a bottom tab bar (Instagram/X-style), the nav data is now centralized in `ALL_NAV_ITEMS` and `NavBody` so it's a contained refactor.
- [ ] **Mobile-specific empty states / illustrations** — current empty states are text-only and work fine; could be more delightful with simple illustrations.
- [ ] **Pull-to-refresh on lists** — common mobile expectation. Not built; would need a small client component wrapping list pages.
- [ ] **Native install / PWA manifest** — could ship a `manifest.json` so users add the app to home screen. Not in scope today.

### Dashboard / external config

- [ ] Test on a real iOS device + Android device once deployed. Chrome DevTools emulator catches most issues but not all (touch latency, Safari-specific layout quirks, etc.).

---

## Task 12 — Deploy to Vercel + custom domain

Step-by-step runbook. Most steps are dashboard configuration on Vercel / Supabase / Google Cloud / your DNS provider — not code changes.

### What was added in the codebase to make deployment safe

- ✅ Stray root `package.json` + `node_modules` removed (was causing Vercel build detection ambiguity).
- ✅ Comprehensive `.gitignore` so no secrets leak (env files, `.next`, `.vercel`, `.supabase`, OS junk all covered).
- ✅ Real [README.md](README.md) with feature list, project layout, local dev instructions.
- ✅ `engines.node >= 20.0.0` pinned in [my-app/package.json](my-app/package.json) so Vercel builds with the right runtime.
- ✅ Removed unused dependencies: `react-select`, `resend` (we use the inquiry endpoint as a webhook target, not the SDK).
- ✅ Added `npm run typecheck` script (`tsc --noEmit`) for CI.
- ✅ [/api/health](my-app/src/app/api/health/route.ts) endpoint for monitoring — returns 200 with Supabase round-trip ms, 503 if Supabase unreachable. Public route in middleware.
- ✅ [next.config.mjs](my-app/next.config.mjs) hardened:
  - `poweredByHeader: false` (don't leak Next.js version)
  - `reactStrictMode: true`
  - `remotePatterns` includes Supabase Storage + `lh3.googleusercontent.com` (Google avatars)
  - Global response headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
  - Public widget gets explicit caching + CORS headers

### Step 1 — Commit and push to GitHub

```bash
cd /Users/vs/Desktop/Code/personal/Focals-Base
git add .
git commit -m "Prepare for production deployment"
# Create a new GitHub repo (private recommended) at https://github.com/new
git remote add origin git@github.com:<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

> The git history contains an old `.env.local` from before Task 02 with the **deleted** Supabase project's anon key. That project no longer exists, so it's not an active leak, but if the repo is going public, consider running `git filter-repo` or starting fresh:
> ```bash
> git filter-repo --invert-paths --path my-app/.env.local
> ```

### Step 2 — Create the Vercel project

1. Go to https://vercel.com/new.
2. Import your GitHub repo.
3. **Framework Preset**: Next.js (auto-detected).
4. **Root Directory**: click Edit → set to `my-app` (this is the most important setting, since the Next app isn't at the repo root).
5. **Build Command**: leave default (`next build`).
6. **Output Directory**: leave default (`.next`).
7. **Install Command**: leave default (`npm install`).
8. **Node.js Version**: 20.x (matches `engines.node` in `package.json`).
9. **DON'T deploy yet** — first add env vars (next step).

### Step 3 — Add Vercel environment variables

In the Vercel project settings → **Environment Variables**, add for **Production** (and optionally Preview / Development):

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `[APP_NAME]` (or your final product name) | Shown in sidebar, page titles, contracts. |
| `NEXT_PUBLIC_SITE_URL` | `https://app.yourdomain.com` (or whatever your domain will be) | Used for OAuth redirect URLs and webhook URLs in settings. **Must match the domain set in Supabase Auth**. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://oqaqopkcpgmjgswaismm.supabase.co` | Same as `.env.local`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (paste from Supabase → Settings → API) | Public anon key. Same as `.env.local`. |
| `SUPABASE_SERVICE_ROLE_KEY` | (paste from Supabase → Settings → API) | **Server-only**. Used by `/api/inquiry`, `/api/calendar/[userId]`, `/api/health`, and admin actions like `deleteAccount`. Mark this as production-only. |

Do NOT set `RESEND_API_KEY` — we don't run a central Resend account anymore.

### Step 4 — First deploy

Click **Deploy** in Vercel. Watch the build log. If anything fails, the most common issues are:
- **"Module not found"** — Root Directory isn't set to `my-app`. Re-check Step 2.5.
- **"Invalid Supabase URL"** — env var typo. Verify in Vercel project settings.
- **TypeScript error you didn't see locally** — Vercel runs strict type checks; ours has been passing locally so this is unlikely. If it does happen, run `npm run typecheck` locally to reproduce.

After it finishes, you'll get a URL like `https://your-repo.vercel.app`. Click it — the login page should load.

### Step 5 — Connect your custom domain

1. In Vercel project → **Settings → Domains** → add your domain (e.g. `app.yourdomain.com`).
2. Vercel will tell you what DNS records to add (typically a CNAME pointing to `cname.vercel-dns.com`, or A records for an apex domain).
3. Add those records at your DNS provider (Cloudflare, Namecheap, Google Domains, etc.). Propagation usually takes 1-30 minutes.
4. Once Vercel detects the records, it provisions a Let's Encrypt cert automatically.
5. Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to use the custom domain. Redeploy.

### Step 6 — Update Supabase Auth URL Configuration

Go to https://supabase.com/dashboard/project/oqaqopkcpgmjgswaismm/auth/url-configuration

1. **Site URL**: change from `http://localhost:3000` to `https://app.yourdomain.com` (your production domain).
2. **Redirect URLs**: ADD `https://app.yourdomain.com/auth/callback`. Keep `http://localhost:3000/auth/callback` for local dev.
3. (Optional) Add Vercel preview URLs as redirect URLs too: `https://*.vercel.app/auth/callback` so PR preview deploys can sign in.
4. Save.

### Step 7 — Update Google OAuth client

Go to https://console.cloud.google.com/apis/credentials → your OAuth 2.0 Client ID:

1. **Authorized JavaScript origins**: ADD `https://app.yourdomain.com`. Keep `https://oqaqopkcpgmjgswaismm.supabase.co`.
2. **Authorized redirect URIs**: should already have `https://oqaqopkcpgmjgswaismm.supabase.co/auth/v1/callback`. No change needed there — Google always redirects to Supabase first, Supabase then redirects to your app.
3. Save.

### Step 8 — Smoke test the production deploy

In an incognito window:

- [ ] Visit `https://app.yourdomain.com` → redirects to `/login`.
- [ ] Click **Continue with Google** → completes OAuth → lands on `/`.
- [ ] In Supabase Table Editor → `profiles` → confirm a row exists for your user with `full_name`, `avatar_url`, `email` populated.
- [ ] `https://app.yourdomain.com/api/health` returns `{"status":"ok","duration_ms":<low number>}`.
- [ ] `https://app.yourdomain.com/widget/inquiry.js` returns the JS bundle (200, `application/javascript`).
- [ ] Test the embeddable widget on a separate static page: paste the snippet from `/settings → Inquiry sources → Embed widget snippet` into a test HTML file, open it locally, submit → confirm new inquiry appears in `/inbox`.
- [ ] Calendar feed: copy the URL from `/calendar → Subscribe`, paste into Apple Calendar's "New Calendar Subscription" → events appear.

### Step 9 — Post-deploy hardening

- [ ] **Set up uptime monitoring**: point a service like Better Uptime, UptimeRobot, or Vercel's own monitoring at `https://app.yourdomain.com/api/health`. Alert on non-200 or duration > 2000ms.
- [ ] **Enable Vercel Analytics**: Vercel Dashboard → Analytics → enable. Free tier includes Core Web Vitals + page views.
- [ ] **Set up Vercel Speed Insights** for real-user metrics (LCP, INP, CLS).
- [ ] **Review Vercel Firewall rules** for `/api/inquiry` rate limiting — leftover from Task 05 deferred items. Vercel's WAF Pro tier or Cloudflare in front of Vercel are both options.
- [ ] **Configure Supabase database backups**: Settings → Database → Backups → enable daily backups (free on Supabase Pro tier; manual on free tier).
- [ ] **Add a Sentry / error monitoring integration** if you want to track production errors. Vercel + Sentry has a one-click integration.

### Step 10 — Test data setup for early users

If you're going to onboard real photographers:

- [ ] Decide if each user should start with empty data, or with 1-2 example projects/clients/contracts as a guide. Currently the app starts empty (except for the auto-seeded contract template).
- [ ] Consider writing a seeding migration that creates a "Welcome — sample project" row on first profile creation. Optional polish.
- [ ] Make sure the Help guides are accurate against the current UI (re-read after deploy).

### Things that DIDN'T need to change for deployment

- The Supabase project is already production-grade (RLS on every table, service role key never reaches the client, profile auto-create trigger on auth user signup).
- The webhook endpoint at `/api/inquiry` is already CORS-configured for any origin and validates per-source tokens.
- The iCal feed at `/api/calendar/[userId]` already validates the `?token=` against `profiles.calendar_token`.
- The widget at `/public/widget/inquiry.js` is already mobile/desktop-responsive with Shadow DOM isolation.
- The middleware already auth-gates everything except the public routes (`/login`, `/auth/callback`, `/api/inquiry`, `/api/calendar`, `/api/health`, `/widget`).
- Mobile/tablet UX is already polished (Task 11 + iPad-specific tier).
- All in-app tutorials and `/help` guides are already shipping.

---

## Codebase status: feature-complete on the spec

After Task 09, every route mentioned in the Master Prompt index has a real implementation against the new schema:

| Route | Status |
|---|---|
| `/` Dashboard | ✅ Task 04 |
| `/inbox` | ✅ Task 05 |
| `/calendar` | ✅ Task 06 |
| `/contracts` (+ `/new` `/templates` `/[id]` + PDF API) | ✅ Task 07 |
| `/gear` `/links` `/forms` `/settings` | ✅ Task 08 |
| `/projects` | ✅ Task 09 (this task) |
| `/clients` (+ `/[id]`) | ✅ Task 09 |
| `/shoots` | ✅ Task 09 |
| `/finances` | ✅ Task 09 |
| `/login` + `/auth/callback` | ✅ Task 03 |
| `/api/inquiry` (public) | ✅ Task 05 |
| `/api/calendar/[userId]` (public iCal) | ✅ Task 06 |
| `/api/contracts/[id]/pdf` | ✅ Task 07 |

**Removed in Task 09 cleanup:**
- 6 legacy module dirs under `(dashboard)/`: `projects`, `clients`, `shoots`, `finances` — all now reborn fresh
- 7 legacy API route dirs: `api/{auth, projects, clients, shoots, finances, profiles, links, forms, gear}`
- 1 legacy test page: `/test`
- The legacy `app/components/` folder (Sidebar, BottomBar, DesktopBar, Element/, Navbar/, AddRow, List, toast) — superseded by `src/components/{layout,ui,...}`
- The legacy `src/utils/` folder (api.js, types.js)

The build is now lean — no orphaned files, no broken-against-new-schema code.

---

## Legacy JS modules — RESOLVED (Task 09)

✅ All previously-broken legacy modules have been replaced. `/projects`, `/clients`, `/shoots`, `/finances`, `/gear`, `/forms`, `/links`, and `/account` (now `/settings`) all use the new schema. Their old API routes under `/api/*` have been deleted along with the legacy `app/components/` folder and `src/utils/`. Codebase has zero references to the old `user` column or JSONB `fields` pattern.

Also update line 266 of this file (the Sidebar nav check item) — the parenthetical "some still legacy and broken" is no longer accurate since every nav item now points to a working module.

---

## Environment / infrastructure reminders

- [ ] **`.env.local` has both legacy and new Supabase key formats** — `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new `sb_publishable_...` format, unused) and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy JWT format, what the code reads). Safe to leave both; the `PUBLISHABLE_KEY` line is just unused noise.
- ~~**`RESEND_API_KEY` / `RESEND_WEBHOOK_SECRET` in `.env.local`**~~ — Decided 2026-04-24: not needed. Architecture pivoted away from a central Resend account; users connect their own intake services (Resend, Zapier, Typeform, etc.) directly to `/api/inquiry`. Safe to leave the env keys empty or remove them from `.env.local.example`.
- [ ] **`NEXT_PUBLIC_SITE_URL`** — currently `http://localhost:3000`. Update to your Vercel deployment URL before deploying. Referenced in [src/lib/actions/auth.ts:siteUrl()](my-app/src/lib/actions/auth.ts).
- [ ] **`next.config.mjs`** is now derived from `NEXT_PUBLIC_SUPABASE_URL` — no hardcoded hostname. Safe as long as the env var is set at build time.

---

## Deployment — DONE (2026-04-27)

First production deploy is live on Vercel.

- **Production URL:** https://focals-base.vercel.app
- **Vercel project:** `virajs-projects-e73ae1f2/focals-base` (linked via `my-app/.vercel/project.json`)
- **Branch deployed:** `v2` (HEAD at deploy time: 094b880)
- **Smoke checks passing:**
  - `/api/health` → 200, `{"status":"ok"}` (Supabase reachable from Vercel)
  - `/projects` (incognito) → 307 to `/login` (middleware gating works)
  - `/login` → 200 (public route works)
  - `/api/inquiry` → 405 on GET, *not* 307 (public allowlist works)

### Deploy-time fix worth noting

Vercel rejected the first deploy because Next 15.3.2 had a stack of open advisories (Image Optimizer cache confusion, SSRF via middleware redirects, DoS via Server Components, etc.). Bumped to **15.5.15** (the patched backport on the 15.5 line) — same major, no breaking changes — and the build went through clean. Locked into `package.json` so future installs stay on the patched range.

### URGENT — secrets to rotate

The Vercel personal access token used for CLI deploy was pasted into chat earlier. Treat it as compromised:

1. Go to https://vercel.com/account/settings/tokens
2. Revoke the token named `claude-cli-local` (or whatever you named it)
3. If you want to keep the local deploy workflow, generate a new one and update [`~/.vercel-cli-env`](~/.vercel-cli-env)

### Post-deploy manual config (Supabase + Google OAuth)

These are dashboard-only — can't be done from code. Do them now or sign-in will redirect to localhost:

- [ ] **Supabase → Authentication → URL Configuration** — set **Site URL** to `https://focals-base.vercel.app`
- [ ] **Supabase → Authentication → URL Configuration** — add **Redirect URL**: `https://focals-base.vercel.app/auth/callback`
- [ ] **Google Cloud Console → OAuth 2.0 Client IDs** → your Supabase OAuth client → add to **Authorized redirect URIs**: `https://oqaqopkcpgmjgswaismm.supabase.co/auth/v1/callback` (already set if Google login worked locally — double-check)
- [ ] **Google Cloud Console → OAuth consent screen → Authorized domains** — add `vercel.app` if not already there
- [ ] **Vercel → Project → Settings → Environment Variables** — add or update `NEXT_PUBLIC_SITE_URL=https://focals-base.vercel.app` so server actions that build redirect URLs use prod, not localhost. After adding, trigger a redeploy (`npx vercel --prod`) so the new env value is baked in.

### Custom domain (optional, when ready)

- [ ] Buy/point a domain (e.g. via Cloudflare or Namecheap)
- [ ] **Vercel → Project → Settings → Domains** — add the domain; Vercel gives you DNS records (A or CNAME)
- [ ] Add the records at your registrar; wait for TLS provisioning
- [ ] Repeat the Supabase + Google steps above with the new domain
- [ ] Update `NEXT_PUBLIC_SITE_URL` env var in Vercel to the custom domain

### Day-to-day deploy commands

From `my-app/`:
```bash
source ~/.vercel-cli-env
npx vercel@latest                # preview deploy
npx vercel@latest --prod         # production deploy
npx vercel@latest logs           # tail recent function logs
```
Or just `git push` to whichever branch Vercel is watching — push deploys are auto-wired.

---

## iOS app — planning DONE (2026-04-27)

A 16-file task plan for the native iOS companion app now lives at `tasks/ios/`. The plan mirrors the existing web tasks structure: numbered .md files, a master prompt, a Claude Code instructions file. Total ~5,900 lines of detailed implementation specs.

### Decisions that are locked in (so you don't have to re-decide)

- **Repo layout**: same repo, `ios/` folder alongside `my-app/`
- **Auth scope**: Google OAuth + Apple Sign In (App Store Guideline 4.8 compliance)
- **Offline scope**: read-cache only via SwiftData. Mutations require connectivity. Full offline-first deferred to v1.1
- **Native features in v1**: ALL of EventKit, Shortcuts/App Intents, PencilKit, WidgetKit, Live Activities, Push
- **Tech stack**: SwiftUI-first, iOS 17+, supabase-swift SDK, Apple Charts, no third-party UI kits

### Open items still pending YOUR decisions before iOS implementation can start

- [ ] **Real app name** — `[APP_NAME]` placeholder is in both web and iOS tasks. Bundle ID `com.[APP_NAME].ios` and the App Store listing can't be finalized without it. (Pick one and do a single repo-wide find-replace once.)
- [ ] **Brand fonts on iOS** — Inter is fine. If you have a paid display face on web (e.g. Canela), the license must explicitly permit app embedding. Confirm before Task 01.
- [ ] **Apple Developer Program membership** — $99/yr. Required for device testing, push, App Groups, App Store submission. Free Apple ID works for simulator only.
- [ ] **Schema-drift workflow** — when web adds a Postgres column, iOS Codable models must follow. Hand-written for v1 is fine. Add a `bin/gen-swift-types` script in v1.1 if it gets painful.

### Implementation order (when you're ready)

```
01_PROJECT_SETUP                ← foundation (no deps)
02_DATA_MODELS_AND_SUPABASE_CLIENT
03_AUTH_AND_SESSION
04_NAVIGATION_AND_SHELL
05_READ_CACHE_LAYER             ← required by every module screen
06_DASHBOARD       ┐
07_INBOX           │
08_CALENDAR        ├ can run in parallel after 05
09_PROJECTS_CLIENTS_SHOOTS │
10_FINANCES        │
11_CONTRACTS       │
12_GEAR_LINKS_FORMS_HELP_SETTINGS ┘
13_NATIVE_FEATURES              ← widgets, push, Live Activities, etc.
14_TESTING_RELEASE_TELEMETRY    ← App Store submission
```

Solo dev: realistic 3–4 months end to end with all native features in v1. If push becomes blocking, defer Section E of Task 13 to v1.1.

### Web changes the iOS plan will require (small)

These get done DURING the relevant iOS task, not before:

- [ ] **Apple App Site Association** — `my-app/src/app/.well-known/apple-app-site-association/route.ts` serving JSON for Universal Links (Task 13 Section F)
- [ ] **Push notification trigger** — Supabase Edge Function + Postgres trigger for new-inquiry pushes; pg_cron for shoot reminders (Task 13 Section E)
- [ ] **`profiles.push_token` column** — schema migration to store APNs device tokens (Task 13 Section E)
- [ ] **Markdown source endpoint for help docs** — OPTIONAL; either add `/help/[slug]/markdown/route.ts` to web, or bundle markdown into iOS app resources (Task 12 Module 4)
- [ ] **Privacy policy page** — `/privacy` on web. Required for App Store listing (Task 14)

---

## UX polish (2026-04-27) — done in this session

Three small fixes shipped:

1. **In-line "Add new client" inside the project + shoot client pickers.** The dropdown now has a `+ Add new client…` option that expands a tiny inline form (name + email + phone). On save it creates the client via the existing `createClient` server action, adds it to the local list, auto-selects it, and shows a success toast. The full client list refreshes on the parent form's `router.refresh()` after the parent saves.

2. **Project shoot date now includes time.** `ProjectForm` switched from `<input type="date">` to `<input type="datetime-local">`. The Zod validator (`my-app/src/lib/validations/projects.ts`) now accepts either a `YYYY-MM-DD` date or a full ISO timestamp, so the form continues to work whether or not you've migrated the DB column.

3. **Toast + custom confirm dialog** replace every `window.confirm()` and Chrome popup. New components: `my-app/src/components/ui/Toast.tsx`, `my-app/src/components/ui/ConfirmDialog.tsx`, mounted via `AppProviders` in the root layout. All 11 sites that used `confirm()` now use the in-app dialog (`useConfirm()`), and every successful create/update/delete fires a `useToast().show(...)` success toast in the brand styling. Failed mutations show a red toast with the server error message.

### Optional schema migration to support time on `projects.shoot_date`

The current Postgres column is `date` (no time). The form sends a full ISO timestamp; Postgres truncates the time portion server-side, so **no migration is required** for the front-end change to ship. But to actually persist the time, run this in the Supabase SQL editor:

```sql
ALTER TABLE projects
  ALTER COLUMN shoot_date TYPE timestamptz
  USING (shoot_date::timestamptz);
```

After running:
- existing rows keep their date at midnight in UTC
- new saves persist the local hour/minute the user picked
- every `formatDate(...)` call site continues to work because they all wrap in `new Date(...)` which handles both formats

Skip this migration if you don't care about the time being persisted yet — the UI will just always show 12:00 AM.

---

## File-upload → LLM project extraction (2026-04-28)

New "Import from file" button on the Projects page. User uploads PDF/CSV/XLSX/DOCX/TXT/JPG/PNG/HEIC, Claude Haiku 4.5 extracts proposed project rows, user reviews/edits/skips in a slide-over, then commits. Supports bulk imports and creates new clients inline when extracted names don't match the user's existing list. BYO Anthropic API key (v1) — modular `LLMProvider` interface lets us flip to a server-paid model later without touching call sites.

### URGENT — required before this works in production

- [ ] **Run the new SQL migration** in the Supabase SQL editor (or via `supabase db push` if the local CLI is wired up):
  - File: [my-app/supabase/migrations/20260428170000_user_integrations_and_upload_jobs.sql](my-app/supabase/migrations/20260428170000_user_integrations_and_upload_jobs.sql)
  - Creates two tables: `user_integrations` (encrypted per-user API keys) and `project_upload_jobs` (audit trail). Both RLS-locked to `auth.uid() = user_id`.
- [ ] **Generate a `LLM_KEY_ENCRYPTION_SECRET`** and add it to BOTH `.env.local` (for local dev) and Vercel's environment variables (for production):
  ```bash
  openssl rand -base64 48
  ```
  - Add to all three Vercel envs: Production, Preview, Development.
  - The same secret must be used everywhere. Rotating it invalidates every stored API key.
- [ ] **Redeploy** to Vercel after adding the env var (`NEXT_PUBLIC_*` vars get baked into the bundle, but server-only vars are read at runtime — actually, you still need a redeploy to pick up the new var). From `my-app/`:
  ```bash
  source ~/.vercel-cli-env
  npx vercel@latest --prod
  ```
- [ ] **Get a personal Anthropic API key** at https://console.anthropic.com/settings/keys — ~$5 of credits is plenty for testing. Add it via the new Settings → Integrations → AI file import card.

### How it works (architecture summary)

1. User uploads a file → `POST /api/projects/upload` ([route](my-app/src/app/api/projects/upload/route.ts))
2. Server extracts text (or base64 image) via per-format extractors at [my-app/src/lib/upload/extractors.ts](my-app/src/lib/upload/extractors.ts) — pdf-parse 2.x, papaparse, xlsx (sheetjs), mammoth (docx), heic-convert (HEIC → JPEG), plain text passthrough
3. Calls Claude Haiku 4.5 via tool-use forced output ([extractProjects.ts](my-app/src/lib/upload/extractProjects.ts)) — strict JSON tool schema means malformed responses are essentially impossible
4. Server-side fuzzy-matches each extracted client name against the user's existing clients ([matchClient.ts](my-app/src/lib/upload/matchClient.ts)) using a token-overlap + Levenshtein hybrid score
5. Returns `AnnotatedProposedProject[]` — proposed projects + per-row client match annotations + warnings
6. User reviews in [ProjectsUploadDialog.tsx](my-app/src/components/projects/ProjectsUploadDialog.tsx) — every field editable, per-row Skip checkbox, ambiguous client matches force a radio pick, "Create new client" inline option
7. User clicks "Create N projects" → `commitUploadedProjects` server action ([projects.ts](my-app/src/lib/actions/projects.ts)) loops the user's edited list, validates each row through the existing `createProjectSchema`, creates clients on-the-fly when needed, returns per-row errors so any failures stay in the dialog for retry

### Privacy / security notes

- API keys are encrypted with AES-256-GCM ([encryption.ts](my-app/src/lib/llm/encryption.ts)) before being stored. Postgres only ever sees the ciphertext + nonce + auth tag; the encryption secret lives only in env vars.
- The masked display on the Settings card is computed at save time from the original input and stored in a separate `key_hint` column (non-encrypted). No way to recover the full key from what's shown.
- Files are sent to Anthropic for one-time extraction. We log filename / size / MIME / row counts in `project_upload_jobs` but **NOT** the file contents.
- The file upload endpoint requires a logged-in session — middleware-gated, no public-token bypass.

### Switching from BYO to "we pay" later

When you're ready to fold cost into a paid tier:
1. Add `ANTHROPIC_API_KEY` env var to Vercel.
2. Add a `ServerKeyProvider` class to [my-app/src/lib/llm/provider.ts](my-app/src/lib/llm/provider.ts) (parallel to `UserKeyProvider`).
3. Change `getProvider()` to: `return process.env.ANTHROPIC_API_KEY ? new ServerKeyProvider() : new UserKeyProvider();`
4. Optionally add a `usage_log` table to count tokens per user for tier enforcement. The `recordUsage(userId, in, out)` hook on `LLMProvider` is already wired into the API route.

That's literally the whole change — no UI updates, no schema changes, no call-site edits. The Settings UI for "Add API key" just becomes optional — users who don't have a key fall through to the server's.

### What v1 doesn't do

- Multi-file upload (single file at a time).
- OAuth-style "connect Anthropic account" — that doesn't exist as a product. Users must paste an API key.
- Editing/replaying old upload jobs — `project_upload_jobs` is append-only audit data.
- ChatGPT/OpenAI provider — the `LLMProvider` interface accommodates it, but only Anthropic is wired in v1.

---

## iOS Task 01 — Project Setup, Folder Structure & Design Tokens ✅

**Completed:** 2026-04-28

### Tests run
- `xcodebuild build` — BUILD SUCCEEDED (zero errors, zero warnings) on iPhone 17 Pro simulator
- Unit test placeholder (`FocalsTests.swift`) — passes
- UI test placeholder (`FocalsUITests.swift`) — passes
- FocalsKit SPM package resolves all dependencies (supabase-swift 2.45.0, Kingfisher 7.12.0, MarkdownUI 2.4.1)

### Security concerns
- `Secrets.xcconfig` is gitignored (verified with `git check-ignore`). Contains SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_OAUTH_CLIENT_ID, OAUTH_URL_SCHEME
- Code signing is disabled (`CODE_SIGNING_ALLOWED = NO`) — appropriate for simulator-only dev. Must be re-enabled before device testing or App Store submission (Task 14)

### Deferred items
- [ ] **Download Inter font files** — Place `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf` into `ios/Focals/Resources/Fonts/`. Download from https://fonts.google.com/specimen/Inter (select Regular 400, Medium 500, SemiBold 600 weights). Without these, the app falls back to system font
- [ ] **Verify DesignTokenGallery renders correctly** — Launch app on simulator, toggle dark/light mode, confirm all 13 brand colors and typography render as expected
- [ ] **Verify Info.plist secrets substitution** — After filling in Secrets.xcconfig, confirm `Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL")` returns a value at runtime

### Dashboard config (manual steps required)
- [ ] **Supabase** — No changes needed for Task 01. Existing project `oqaqopkcpgmjgswaismm` is used as-is
- [ ] **Google Cloud Console** — Create an iOS OAuth 2.0 client ID at https://console.cloud.google.com/apis/credentials. Set the bundle ID to `com.focals.ios` and add the URL scheme. Copy the client ID into `ios/Focals/Secrets.xcconfig` as `GOOGLE_OAUTH_CLIENT_ID`
- [ ] **Apple Developer** — No action needed yet. Required starting Task 03 (Apple Sign In capability) and Task 14 (App Store submission)
- [ ] **Secrets.xcconfig** — Copy `SUPABASE_ANON_KEY` from `my-app/.env.local` (the `NEXT_PUBLIC_SUPABASE_ANON_KEY` value) into `ios/Focals/Secrets.xcconfig`

---

## iOS Task 02 — Data Models & Supabase Client ✅

**Completed:** 2026-04-29

### Tests run
- `xcodebuild build` — BUILD SUCCEEDED (zero errors, zero warnings) on iPhone 17 Pro simulator
- 15 unit tests pass: 12 model decoding tests (one per table), 2 date format tests (fractional + whole seconds), 1 existing placeholder test
- 1 UI test passes (app launches)
- All fixtures decode correctly including nested JSONB (TutorialProgress, FormField[], AnyCodable for raw_payload/config, [String: String] for custom_fields)

### Security concerns
- No secrets in model/repository code — `FocalsClient` reads from Info.plist at runtime
- `user_id` is never included in create payloads — RLS auto-fills via `auth.uid()`
- All repository methods surface `FocalsAPIError` — no raw `PostgrestError` leaks to callers

### What was built
- **12 Codable structs** in `FocalsModels`: Profile, Client, Project, Shoot, Contract, ContractTemplate, Form, Inquiry, InquirySource, Finance, Gear, Link
- **8 status enums** matching web Zod validations (corrected from task doc): ProjectStatus (7 cases), PaymentStatus (3), ShootStatus (4), InquiryStatus (5), ContractStatus (4), FinanceType (2), GearStatus (4), FormFieldType (5)
- **AnyCodable** helper for JSONB columns with variable shape
- **JSONDecoder.supabase / JSONEncoder.supabase** with ISO8601 fractional + whole second support
- **FocalsClient** singleton reading secrets from Info.plist
- **Repository protocol** with PageRequest cursor pagination (limit 50 default)
- **12 concrete repositories** (11 conforming to Repository protocol + ProfileRepository with getCurrent/update)
- **FocalsAPIError** enum with network/auth/rls/decoding/offline/notFound/unknown cases
- **12 JSON test fixtures** with realistic data
- **SCHEMA_MAPPING.md** drift detection doc matching current types.ts

### Enum corrections from task doc
The task doc's enum values were stale. Used web Zod validations as source of truth:
- ProjectStatus: `inquiry, booked, in_progress, editing, delivered, completed, cancelled` (doc had `lead, booked, inProgress, delivered, archived`)
- InquiryStatus: `new, read, replied, converted, archived` (doc had `new, responding, quoted, booked, lost`)
- ContractStatus: `draft, sent, signed, void` (doc had `draft, sent, signed, declined, expired`)
- PaymentStatus: `unpaid, partial, paid` (doc had extra `refunded`)
- GearStatus: `owned, wishlist, sold, rented` (doc had `lost` instead of `rented`)

### Deferred items
- [ ] **Test with real Supabase data** — Once Secrets.xcconfig is filled in (Task 01 deferred), verify `ClientsRepository.shared.list(.init())` returns real data from a signed-in session
- [ ] **Schema drift workflow** — Currently manual (update SCHEMA_MAPPING.md when web schema changes). Automated `bin/gen-swift-types` script deferred to v1.1

### Dashboard config (manual steps required)
- No new dashboard config needed for Task 02. Supabase/Google/Apple config from Task 01 still applies.

---

## iOS Task 04 — Navigation & Shell ✅

**Completed:** 2026-04-29

### Tests run
- `xcodegen generate` — clean
- `xcodebuild build` for iPhone 17 simulator — BUILD SUCCEEDED, zero errors
- `xcodebuild test` — 17/17 unit tests pass (no regressions from Task 02 model decoding suite)
- App launches in iPhone 17 simulator. `xcrun simctl openurl "iPhone 17" focals://project/<UUID>` accepted (custom-scheme deep link is registered)

### Security concerns
- None new. Deep-link router still rejects `oauth-callback` host so it doesn't leak codes/tokens into navigation paths.
- The custom `focals://` scheme is unauthenticated — `DeepLinkRouter.resolve(_:)` only navigates the user; any privileged data on the destination screen still has to be loaded through the authenticated Supabase client.

### What was built
- **`Route` enum** — every navigable destination (13 top-level + 7 detail). No shoot variants.
- **`AppRouter`** — `@Observable @MainActor` singleton. Per-tab paths (dashboard/inbox/calendar/projects/more), combined `detailPath` for iPad, `presentedSheet`, `sidebarSelection`, `selectedTab`. `navigate(to:)` dispatches by case.
- **`SheetRoute`** — Identifiable enum with createProject/createClient/createInquiry/createFinance/projectUpload, each producing a stable `id`.
- **`RouteDestination.swift`** — `routeDestination(_:)` and `sheetDestination(_:)` ViewBuilders shared by both shells.
- **`TabBarShell`** — iPhone 5-tab `TabView` (Dashboard / Inbox / Calendar / Projects / More), each tab is its own `NavigationStack` with `.navigationDestination(for: Route.self)` wired to `routeDestination`.
- **`SplitViewShell`** — iPad `NavigationSplitView`. Sidebar lists all 13 modules grouped Main/More. Detail column is a single `NavigationStack(path: detailPath)`.
- **`RootView` rewrite** — gone is `LoggedInPlaceholder`; replaced with `LoggedInRoot` that picks shell on `horizontalSizeClass` and presents `router.presentedSheet` globally.
- **`PlaceholderScreens.swift`** — 19 placeholder screens (12 top-level + ProjectUpload + More + 7 detail). Each uses the shared `EmptyState`, sets a navigation title, and points at the task that fills it in. Detail screens print `id.uuidString.prefix(8)…` so route plumbing is verifiable end-to-end. SettingsScreen carries a Sign Out CTA so the Task 03 sign-out flow stays reachable until Task 12 lands the real settings.
- **`EmptyState`** — SF symbol + title + optional description + optional CTA. Renamed parameter `body` → `description` to avoid shadowing `View.body`.
- **`LoadingSkeleton`** — `SkeletonCard` (translating gradient shimmer) + `SkeletonList(count:)`.
- **`Haptics`** — light/medium/success/warning/error helpers with documented convention.
- **`DetailSheet`** — wraps content in NavigationStack, `.presentationDetents([.medium, .large])`, drag indicator, Done button via `@Environment(\.dismiss)`.
- **`ConnectivityBanner`** + `ConnectivityMonitor` — `NWPathMonitor`-backed @Observable singleton, "Offline" capsule pill rendered when path is unsatisfied.
- **`DeepLinkRouter.resolve(_:)`** — maps `focals://project/<UUID>`, `focals://client/<UUID>`, `focals://contract/<UUID>`, `focals://inquiry/<UUID>`, `focals://help/<slug>`, `focals://upload` to the right `AppRouter.navigate(to:)` / `presentedSheet` action.
- **Info.plist** — second `CFBundleURLTypes` entry registers the `focals` URL scheme alongside the existing OAuth scheme.

### Deferred items
- [ ] **Wire `ConnectivityBanner` into the toolbar of every list screen** — banner exists and is observable, but no module screen places it yet. Pick this up in Tasks 06+ as each real screen is built.
- [ ] **Universal Links** for `focals-base.vercel.app/...` — deferred to Task 13 per spec. Custom-scheme `focals://` deep links work today.
- [ ] **Verify haptics on a real device** — simulator is silent for haptic feedback per the spec; confirm `Haptics.tap()` actually fires on a physical iPhone before Task 14 (Release / Telemetry).
- [ ] **`ios/Focals/Modules/_README.md`** — task spec asks for this so module tasks don't reinvent top-bar conventions. Skipped for now since the conventions are documented inline in the task file; can add the README in Task 06 if it becomes useful.
- [ ] **Stage Manager 1/3 width testing on iPad** — the spec calls this out; left for the user to verify on an actual iPad since the simulator's compact-iPad reproduction is fiddly.

### Dashboard config (manual steps required)
- No new dashboard config needed for Task 04. The `focals://` URL scheme is registered in the app's Info.plist; nothing to set on Supabase/Google/Apple Developer.

---

## Web bugfix — `shoot_date` showing previous day at 8 PM ✅

**Completed:** 2026-04-29

### Symptom
- Projects list, project detail, and calendar pages rendered every imported project's date as "previous day at 8:00 PM" (or whatever the local UTC offset works out to). The dashboard's Upcoming Projects strip rendered the same data correctly.

### Root cause
- The `20260429180000_projects_shoot_date_to_timestamptz.sql` migration cast the existing `date`-typed column to `timestamptz` via `using shoot_date::timestamptz`, which Postgres interprets as `that-day 00:00:00 UTC`. Every pre-existing row, plus every LLM-upload row that came in as a bare `YYYY-MM-DD` string, ended up stored as UTC midnight.
- The dashboard's `UpcomingProjectsStrip` is a server component (runs on Vercel, which is UTC) so its `new Date(iso); d.getDate()` rendered the intended day. The projects table, calendar view, and mobile calendar are all client components — same code, but `new Date` runs in the user's browser TZ (EDT / UTC-4), so UTC midnight rendered as previous-day 20:00.

### Tests run
- `npm run typecheck` — clean
- `npm run build` — clean (compiled successfully in 3.1s, all 59 routes generated)

### Security concerns
- None. The migration only updates rows owned by the existing user (RLS still enforces ownership on read/write paths).

### What was changed
- **NEW migration** `my-app/supabase/migrations/20260429210000_normalize_shoot_date_utc_midnight.sql` — bumps every `projects.shoot_date` that's exactly UTC midnight to noon UTC. Idempotent. Noon UTC renders as the same calendar day in any populated timezone (UTC-11 to UTC+11).
- **`my-app/src/lib/validations/projects.ts`** — `createProjectSchema.shoot_date` now has a Zod `transform` that promotes any bare `YYYY-MM-DD` input to `T12:00:00.000Z` before insert. Defense-in-depth: covers manual edits, inquiry conversion, and upload commits in one place.
- **`my-app/src/lib/upload/extractProjects.ts`** — LLM extraction prompt updated so it knows the server defaults the time when only a date is given (less likely the model invents a wrong time).
- **`my-app/src/components/projects/ProjectsUploadDialog.tsx`** — when the `datetime-local` value is exactly `YYYY-MM-DDT00:00`, the commit payload now sends the bare date string instead of running it through `new Date().toISOString()` (which would lock in the user's local-midnight UTC offset). The server schema's transform takes it from there.

### Manual step required
- [ ] **Run the new migration in Supabase**: open the Supabase SQL Editor for project `oqaqopkcpgmjgswaismm` and paste the contents of `my-app/supabase/migrations/20260429210000_normalize_shoot_date_utc_midnight.sql`, or run `supabase db push` from the CLI if linked. Until this runs, the existing 52 imported projects will still show as previous-day 8 PM in the user's browser.

### Verification (after running the migration)
1. Refresh the projects list — every imported project should show its intended calendar day.
2. Open the calendar — events should sit on the correct day cell.
3. Edit a project, save without touching `shoot_date` — value stays correct (no shift).
4. Run another LLM file upload with a bare-date entry — committed `shoot_date` should land at noon UTC, not midnight.

### Deferred / out of scope
- The user's `Project` detail page rendering still uses the same `new Date(iso)` pattern. After the data fix it'll display correctly, but if a future user is east of UTC+12 (Tonga, Kiribati) noon UTC would still render as the next day. Acceptable for v1.

---

## iOS Task 05 — Read-Cache Layer (SwiftData) ✅

**Completed:** 2026-04-29

### Tests run
- `xcodegen generate` — clean
- `xcodebuild build` for iPhone 17 simulator — BUILD SUCCEEDED, zero errors
- `xcodebuild test` — 17/17 unit tests + 1 UI test pass (no regressions)
- App launches in iPhone 17 simulator with the new cache plumbing; no crashes from container init

### Security concerns
- The SwiftData store file is per-user and lives in the App Group container (or `Application Support/` fallback). Sign-out wipes the file before the next user can mount their own container, so a shared device can't leak data.
- The store contains the same fields as the server (no extra PII), but it IS unencrypted at rest. iOS Data Protection class is `Complete` by default for files under `Application Support/`, which means the file is unreadable when the device is locked — same protection level as `URLCache`. Acceptable for v1.

### What was built
- **App Group `group.com.focals.ios`** wired via `Focals/Focals.entitlements` + `CODE_SIGN_ENTITLEMENTS` build setting in `project.yml`. CacheContainer uses the App Group container when entitled and falls back to `Application Support/` when running unsigned (simulator without a real provisioning profile, which is the current state until Apple Developer enrollment).
- **8 SwiftData `@Model` classes** in `FocalsKit/Sources/FocalsCache/Models/`: CachedProject, CachedClient, CachedInquiry, CachedFinance, CachedGear, CachedLink, CachedContract, CachedContractTemplate. Each has `@Attribute(.unique) serverId: UUID`, `init(from:)` / `applyServer(_:)` / `toModel()` round-trip helpers, and `lastSyncedAt` for future delta-cursor work. Dictionary/JSONB fields (`Inquiry.rawPayload`, `Contract.customFields`) are stored as encoded JSON strings to dodge SwiftData's iOS-17.0 Optional-Dictionary edge cases.
- **8 corresponding public memberwise inits** added to the `FocalsModels` structs (`Project`, `Client`, `Inquiry`, `Finance`, `Gear`, `Link`, `Contract`, `ContractTemplate`) so cache `toModel()` round-trips compile. The structs were already `Codable` but the synthesized memberwise init was internal-only.
- **`CacheContainer`** factory that builds a per-user `ModelContainer` keyed by `userId`. Provides `make(for:)` and `wipe(userId:)` (also removes SQLite WAL/SHM siblings).
- **`CacheRepository` protocol** + `CacheConnectivity` seam + `CacheConnectivityRegistry`. The cache layer stays headless; the app target plugs in the real `ConnectivityMonitor` at launch.
- **8 concrete `*CacheRepository` structs** with `cached/refresh/create/update/delete`. Mutations call `requireOnline()` first so airplane-mode mutations throw `FocalsAPIError.offline` instead of waiting out the URLSession timeout. Successful mutations upsert the server response into the cache so list views see the change without a separate `refresh()`.
- **`SessionStore.wipeLocalData(userId:)`** now captures the previous user's `id` BEFORE clearing `self.user` (the `.signedOut` event doesn't carry the old session) and calls `CacheContainer.wipe(userId:)`. URLCache + Face ID UserDefaults wipe is preserved.
- **`RootView`** now mounts the per-user `ModelContainer` only when there's a signed-in user, with `.id(user.id)` to guarantee a fresh container if the signed-in user changes. Has a fallback that re-tries with a wiped store and ultimately drops to an in-memory container so the app stays usable even if the store file is corrupt.
- **Foreground refresh hook**: `LoggedInRoot.onChange(of: scenePhase)` triggers `refreshAllCaches(in:)` when the app becomes `.active`. Each cache repo runs in parallel via `withTaskGroup`, capped at 5 seconds per repo so a slow query can't block the rest. Errors are swallowed (foreground refresh is non-blocking).
- **`FocalsApp.init`** registers `ConnectivityMonitor.shared` as the cache layer's `CacheConnectivity` source via `MainActor.assumeIsolated`.
- **`FocalsCache/OFFLINE_FIRST.md`** documents v1 mutation policy + the v1.1 MutationOutbox design + schema-migration story so the next session doesn't re-derive it.

### Deferred items
- [ ] **Wire each module screen's `@Query` + `.refreshable` + initial `.task`** — Tasks 06–12 own this. The cache layer is ready; screens just need to add the canonical pattern from the spec (the placeholder screens are still empty `EmptyState`s today).
- [ ] **Verify cache file location on device** — the spec asks for "verify by inspecting Files app on device → cache file gone after sign-out". Skipped for now since we're still on simulator; verify when a physical device is paired.
- [ ] **60fps shimmer + <200ms cold render in Instruments** — also a real-device check. The infrastructure is in place; can't measure without a device.
- [ ] **Schema migration test harness** — the OFFLINE_FIRST doc references `FocalsTests/CacheMigrationTests.swift` for Task 14. Not built yet.
- [ ] **Per-repo unit tests for upsert idempotency** — Task 14 will cover. The current test suite still only covers Task 02's model decoding (17 tests).
- [ ] **App Group provisioning** — the `group.com.focals.ios` group needs to be registered in Apple Developer once enrollment lands (Task 14 prereq). Until then the entitlement file is present but the container falls back to `Application Support/`.

### Dashboard config (manual steps required)
- [ ] **Apple Developer**: when you do enrollment for Task 14, register the App Group `group.com.focals.ios` in https://developer.apple.com/account/resources/identifiers/list/applicationGroup and add it to the iOS app's identifier so signed builds pick up a real shared container. Until then nothing breaks — fallback path works fine.

---

## Web semantics change — `shoot_date` is now wall-clock ✅

**Completed:** 2026-04-30

### What "wall-clock" means
The digits a photographer types ("8:30") are the digits we always display, regardless of where the viewer is or where the renderer runs. shoot_date is stored as a `timestamptz` anchored at `+00`, but every renderer formats with `timeZone: 'UTC'`, so the column's UTC components ARE the wall-clock value. No conversion through the user's local timezone — viewing the dashboard from EDT, JST, or Vercel's UTC server shows the same number.

### Why
Two prior fixes were chasing different sides of the same bug. First fix (noon-UTC backfill) made the *day* render right everywhere. Second fix (client-side TZ formatting on the dashboard) made the *time* render in the user's local TZ. But the user's intent was simpler than either: "I typed 8:30 — show me 8:30." Wall-clock semantics implement that directly.

### Tests run
- `npm run typecheck` — clean
- `npm run build` — clean

### What changed
- **`my-app/src/components/projects/ProjectForm.tsx`** — `handleSubmit` now passes the raw `datetime-local` value (`YYYY-MM-DDTHH:mm`) to the server instead of running it through `new Date().toISOString()`. `toDatetimeLocalValue` reads UTC components from stored ISO strings (so the wall-clock digits round-trip) and local components from `Date` instances (calendar slot clicks).
- **`my-app/src/components/projects/ProjectsUploadDialog.tsx`** — `serializeShootDate` returns the `datetime-local` value verbatim. `toDatetimeLocal` strips any zone suffix from the LLM's output, taking the leading 16 chars (`YYYY-MM-DDTHH:mm`) as wall-clock.
- **`my-app/src/lib/validations/projects.ts`** — `createProjectSchema.shoot_date` accepts naive `YYYY-MM-DDTHH:mm`, full ISO with zone, and bare dates. The transform peels off the wall-clock digits and re-anchors at `+00:00.000Z` so storage is canonical regardless of input shape.
- **`my-app/src/components/dashboard/LocalDateBadge.tsx`** — dropped the client-only `useEffect` TZ swap; now a plain server-renderable component that always formats with `timeZone: 'UTC'`.
- **`my-app/src/components/projects/ProjectsTable.tsx`** — `formatDate` formats with `timeZone: 'UTC'`.
- **`my-app/src/components/calendar/CalendarView.tsx`** — added `wallClockDate(iso)` helper that reads UTC components and returns a local-time Date with matching components, so react-big-calendar's local-time formatters render the wall-clock digits unchanged.
- **`my-app/src/components/calendar/MobileCalendarView.tsx`** — same `wallClockDate` helper, applied to day-bucket and bottom-sheet rendering.
- **`my-app/src/app/api/calendar/[userId]/route.ts`** — iCal events now use `floating: true`, so Apple Calendar / Google Calendar render the wall-clock time against the viewer's clock. (Without this, an 8:30 wall-clock event would appear at 4:30 AM in EDT after iCal interpreted the +00 anchor literally.)
- **NEW migration `my-app/supabase/migrations/20260430000000_shoot_date_to_wall_clock.sql`** — subtracts 4 hours from every existing `shoot_date` to recover the wall-clock value. Idempotent via a one-row marker table (`_migration_marks`); safe to re-run. Assumes the user is in EDT (UTC-4); the prior writes always went through `toISOString()` so stored = wall_clock + 4h.

### Manual step required
- [ ] **Run the new migration in Supabase**: open https://supabase.com/dashboard/project/oqaqopkcpgmjgswaismm/sql/new and paste the body of `20260430000000_shoot_date_to_wall_clock.sql`. Until this runs, every existing project will display 4 hours later than it should (e.g. "yana grad" saved at 8:30 will still show 12:30 because the stored value is still 12:30 UTC).

### Verification (after running the migration)
1. Refresh the dashboard's Upcoming Projects strip — every project should show the wall-clock time the user typed.
2. Hard-refresh `/projects` — the table's "Shoot date" column should match.
3. Open `/calendar` — events sit on the right day cell, and the time inside the event should match what the form shows.
4. Subscribe to the iCal feed in Apple Calendar — events should appear at their wall-clock times in any device timezone (the floating-time export ignores the viewer's TZ).
5. Edit "yana grad" → save without changing anything → time stays at 8:30.
6. Move the user's MacBook to Pacific Time temporarily (System Settings → Date & Time) and reload `/projects` — times should still read 8:30.

### Caveats
- **East-of-UTC users**: the backfill assumes a UTC-4 origin. If you ever sign in a user in JST (UTC+9), their existing rows would skew further; not a concern right now since you're the only user.
- **The `_migration_marks` table**: a tiny bookkeeping table introduced just for this run-once migration. Cheap and explicit. Consider promoting to a general migration ledger if more run-once data fixes accumulate.

---

## iOS Task 06 — Dashboard ✅

Native dashboard now renders KPIs, a 6-month revenue chart, a project-status donut, an upcoming-projects strip, and quick actions. Numbers come from `DashboardCalculations` (in `FocalsKit/FocalsAPI`) which mirrors `my-app/src/lib/queries/dashboard.ts` formula-by-formula.

### What changed
- **`ios/FocalsKit/Sources/FocalsAPI/DashboardCalculations.swift`** — pure-function `snapshot(projects:finances:now:calendar:)`. All inputs flow from the SwiftData read cache (Task 05), so the dashboard renders instantly on warm cache and refreshes the underlying caches in parallel on `.task` / pull-to-refresh.
- **`ios/FocalsKit/Sources/FocalsModels/Enums.swift`** — added `ProjectStatus.displayName` (title-cased, snake-case-aware). Reuse this anywhere a status renders to a user.
- **`ios/Focals/Modules/Dashboard/`** — new directory: `DashboardScreen`, `RevenueChart` (BarMark), `ProjectStatusDonut` (SectorMark, custom legend), `UpcomingProjectsStrip` (horizontal cards, taps push project detail), `QuickActions` (3 sheets: project / inquiry / expense), `CurrencyFormatter`.
- **`ios/Focals/Shared/KPICard.swift`** — reusable KPI tile with optional sparkline. The Revenue MTD KPI sparkline uses the 6-month revenue series so it stays consistent with the chart below.
- **`ios/Focals/Modules/PlaceholderScreens.swift`** — removed the placeholder DashboardScreen.
- **`ios/FocalsTests/DashboardCalculationsTests.swift`** — 12 fixtures covering empty inputs, MTD, active counts, 7-day window, pending clamp, 6-month bucketing, status grouping, sort order, malformed dates, ISO timestamps, and a combined parity scenario. **All pass.**
- **`ios/FocalsTests/DashboardGreetingTests.swift`** — 6 fixtures for the time-of-day greeting (morning/afternoon/evening/late-night, nil profile, empty fullName).
- **`ios/project.yml`** — added `FocalsAPI` to the `FocalsTests` dependencies so tests can `@testable import FocalsAPI`. Re-run `xcodegen` after pulling.

### Tests to run on a real device / simulator
1. Sign in. The dashboard should land on a "Today" navigation title with the time-of-day greeting using your first name (from the Google profile).
2. **KPI parity**: open `/` on the web with the same account in a second window. The four KPI numbers (Revenue MTD, Active Projects, Upcoming, Pending) should match the iOS dashboard exactly. If they drift, either the cache hasn't refreshed (pull-to-refresh on iOS) or the formula has drifted from `dashboard.ts` — re-run `DashboardCalculationsTests`.
3. **Empty-state**: with a brand-new account (zero projects, zero finances) the dashboard should still render: zeroes in the KPI tiles, six empty bars in the revenue chart, donut hidden, no upcoming strip. No crashes.
4. **Status names**: `In Progress` (not `in_progress`) should render in the donut legend and any upcoming-card status pill.
5. **Tap an upcoming card** → should push to the project detail screen (still placeholder until Task 09 — confirm at least the navigation occurred).
6. **Quick actions** — each button opens the matching sheet: Project, Inquiry (placeholder until Task 07), Expense (placeholder until Task 10).
7. **Pull-to-refresh** — drag from the top, see the underlying caches refresh, snapshot recomputed.
8. **Performance** — Instruments → Time Profiler against a cold cache should show first paint within ~200ms once cached data is present (warm cache only — cold network is unbounded).
9. (Optional) Toggle Light / Dark mode while on the dashboard. Cards, chart axes, and donut legend all use design tokens, so both modes should look polished.

### Deferred / known limitations
- **No prior-month revenue trend KPI yet.** The web has both `revenueMtd` and `revenuePriorMonth`; iOS only renders MTD. The 6-month chart still gives the longer view, and the trend can come back as a delta KPI in a future polish pass if you want it.
- **Donut color palette is heuristic.** Status → color mapping is hand-picked (`booked → accent`, `in_progress → warning`, etc.) and is not symmetric with the web. Tune in the design pass before App Store submission.
- **Status filter chips not yet implemented.** The web dashboard has none either — flagging in case you later add them.
- **No charts library beyond Apple Charts.** Tasks 06–08 stay on Swift Charts; if a future module needs more (e.g. stacked bars with custom legend), revisit.

### Security / dashboard configuration
- Nothing new. The dashboard reads from caches populated by repositories that already enforce per-user RLS via the user's session.
- `Profile.fullName` is rendered in the greeting; this comes from `profiles.full_name` (auto-populated from Google OAuth on first sign-in).

---

## iOS Task 07 — Inquiry Inbox ✅

Inquiry inbox is fully wired: list grouped by status, filter chips, swipe actions, detail screen with tap-to-call/email and "Mark replied/Archive" actions, manual create form, and the convert-to-client/project workflow that mirrors the web's `convertInquiry` server action exactly.

### What changed
- **`ios/FocalsKit/Sources/FocalsModels/Enums.swift`** — added `InquiryStatus.displayName` (matches web filter labels: `New`, `Read`, `Replied`, `Converted`, `Archived`). Pinned by parity tests.
- **`ios/FocalsKit/Sources/FocalsAPI/InquiryGrouping.swift`** — new helpers: `InquiryFilter` (chip model with `.all` + every status), `Array<Inquiry>.groupedByStatus()` (canonical-order sections, drops empties, nil status falls into `.new` to match the web's `inq.status ?? 'new'` fallback), `Array<Inquiry>.matching(search:)`, `InquiryStatus.pillTone`.
- **`ios/FocalsKit/Sources/FocalsCache/Repositories/InquiriesCacheRepository.swift`** — added `convert(_:creatingProject:projectTitle:in:)` that mirrors `my-app/src/lib/actions/inquiries.ts → convertInquiry` step-for-step. Same DB writes (client `source: 'inquiry'`, optional project with `category=shoot_type`, `notes=message`, `status=.inquiry`, `shoot_date=preferred_date` parsed as wall-clock midnight), same final state (inquiry → `.converted` with `converted_client_id`/`converted_project_id` linked).
- **`ios/FocalsKit/Sources/FocalsCache/InquiryConversionResult.swift`** — return value so callers can navigate straight to the new project/client.
- **`ios/Focals/Modules/Inbox/`** — new directory: `InboxScreen` (filter chips, search, swipe-to-archive/replied/delete, sectioned by status), `InquiryRow`, `InquiryDetailScreen` (auto-marks `.new → .read` on first appear, tap-to-call/email, "Mark replied/Archive" buttons, "Convert to Client + Project" / "Convert to Client only" actions, raw payload disclosure), `CreateInquirySheet` (manual form mirroring `manualInquirySchema`).
- **`ios/Focals/Modules/PlaceholderScreens.swift`** — removed `InboxScreen` and `InquiryDetailScreen` stubs.
- **`ios/Focals/Navigation/RouteDestination.swift`** — `.createInquiry` sheet now resolves to the real `CreateInquirySheet`.
- **`ios/FocalsTests/InquiryGroupingTests.swift`** — 10 fixtures covering display-name parity with web filter labels, `.allCases` shape, canonical-order grouping, newest-first sort, nil-status fallback, multi-field search, case-insensitive search, empty needle, `Filter.matches`, and pill-tone stability. **All pass.**

### Tests to run on a real device / simulator
1. Sign in. Tap the **Inbox** tab. With zero inquiries, the empty state should render after the first refresh.
2. Visit `/inbox` on the web → submit a manual inquiry. Pull-to-refresh on iOS → the new inquiry should appear under **NEW** with the unread dot.
3. POST a payload to `/api/inquiry` from the embeddable widget (or `curl` it directly). Pull-to-refresh on iOS — the inquiry should appear with `via website_form` (or whatever source you used) in the meta line.
4. **Filter chips**: tap `New` → only NEW inquiries show. The `New` chip should display a count badge equal to the unread count. Tap `All` → grouped view returns.
5. **Search**: type a name fragment → list filters by name/email/message/shoot type.
6. **Swipe actions**: swipe-left on a row → `Delete`, `Replied`, `Archive` (the latter two only show when the row isn't already in that state). Tap `Replied` → row moves to the **REPLIED** section. Tap `Archive` → moves to **ARCHIVED**.
7. **Detail tap**: tap a `New` inquiry → detail screen pushes; status auto-flips to `.read` (verify by going back — row no longer has the unread dot, and the `New` chip's badge count drops by one).
8. **Tap-to-call / email**: in the detail screen, tap the email row → `mailto:` opens the Mail compose sheet; tap the phone row → `tel:` opens the dialer.
9. **Convert to Client + Project**: tap the green button → after success, you're popped to the inbox and pushed into the new project's detail screen (placeholder until Task 09 — confirm the navigation occurred and the inquiry is now in **CONVERTED** with both link buttons in the detail footer). On the web, refresh `/clients` → the new client appears with `source: 'inquiry'`. Refresh `/projects` → the new project appears with `status: 'inquiry'` and `category` matching the inquiry's shoot type.
10. **Convert to Client only**: same flow but the project step is skipped — only `convertedClientId` is populated, `convertedProjectId` stays nil.
11. **Manual create**: tap `+` in the toolbar → fill the form → save. New inquiry appears under **NEW** with `via manual` source line.
12. **Offline behavior**: airplane mode → cached list still renders. Swipe `Replied` → alert pops with "Connect to the internet to continue." Manual create shows the same offline alert.
13. **Pull-to-refresh** triggers `InquiriesCacheRepository.refresh`.

### Deferred / known limitations
- **No `.replyVia` integrations.** "Mark replied" only sets the status; it doesn't draft an email or open a mail compose with a template. Out of scope for Task 07; revisit if you add reply templates.
- **No bulk actions.** Web's inbox is also single-select; flagging in case you ever want multi-select archive in the iOS inbox.
- **No timezone normalization for `preferred_date`.** The form writes `YYYY-MM-DD` in the device's local calendar (matches the web's `<input type="date">` behavior). If you ever support clients in a different timezone, revisit.
- **Convert is not transactional.** Same as the web — three sequential writes (client → project → inquiry update). If the network drops mid-way, you can end up with an orphan client. This matches the web behavior; revisit if you move both to a server-side RPC.
- **Source pretty-print is heuristic.** `website_form → "Website form"` etc.; if you add a new source value, double-check the displayed label.

### Security / dashboard configuration
- Nothing new. All inquiry, client, and project mutations go through Supabase repositories that already enforce per-user RLS via the user's session token. The convert flow does not bypass RLS.
- The widget's public `/api/inquiry` endpoint is unchanged; iOS just consumes its rows via the existing `inquiries` table.

---

## iOS Task 08 — Calendar ✅

Native stacked-month calendar with pixel-mirrored layout from web's `MobileCalendarView.tsx`, plus a one-way EventKit mirror so projects appear in the iOS Calendar app.

### What changed
- **`ios/FocalsKit/Sources/FocalsAPI/CalendarMath.swift`** — pure-function `buildMonthCells`, `dayKey`, `monthKey`, `monthRange`, `wallClockDate`, `projectsByDay`. Logic is a Swift port of MobileCalendarView lines 30–70. `Calendar.iso8601MondayFirst` exposes the Gregorian-Monday-first calendar the grid needs (default `Calendar.current` honours user locale and would draw a Sunday-first grid in en-US).
- **`ios/Focals/Modules/Calendar/`** — new directory: `CalendarScreen` (12-month stack, auto-scroll to current month, Today + plus buttons), `MonthSection` (title + weekday headers + 6×7 grid), `DayCell` (date + up to 3 status-coloured dots, today ring, selection background), `DayDetailPanel` (inline below the selected day's month — date header, "+ Add" prefilled at 10:00 AM, project cards with left-status border + time range + location + status pill), `ProjectStatus+Calendar` (`barColor` and `calendarPillTone` matching `STATUS_BAR_COLOR` / `statusToneMap` in MobileCalendarView).
- **`ios/Focals/Modules/Calendar/EventKitMirror.swift`** — `@MainActor`-isolated mirror: dedicated **"Focals"** calendar in iOS Calendar; `mirror(_:)` upserts and `remove(projectId:)` deletes events keyed by `focals://project/<uuid>` URLs. Default 60-minute duration, falls back through iCloud → CalDAV → local sources for the calendar's source. Wall-clock times preserved via `CalendarMath.wallClockDate` so a project saved at 8:30 AM appears at 8:30 AM regardless of the device's timezone.
- **`ios/FocalsKit/Sources/FocalsCache/CacheRepository.swift`** — new `ProjectMutationObserver` protocol + registry. Lets FocalsCache notify the app target after every successful project create/update/delete/refresh without taking a hard dependency on the EventKit framework.
- **`ios/FocalsKit/Sources/FocalsCache/Repositories/ProjectsCacheRepository.swift`** — every mutation now fires `ProjectMutationObserverRegistry.shared.projectDidUpsert/Delete` after the network round-trip succeeds. Refresh fires upsert events for every pulled row so server-side changes propagate to iOS Calendar on next pull-to-refresh.
- **`ios/Focals/App/FocalsApp.swift`** — registers `EventKitMirror.shared` as the project mutation observer at launch, alongside the existing `ConnectivityMonitor`.
- **`ios/Focals/Info.plist`** — added `NSCalendarsUsageDescription` and `NSCalendarsFullAccessUsageDescription` for iOS 17 full-access prompt.
- **`ios/Focals/Modules/PlaceholderScreens.swift`** — removed the `CalendarScreen` stub.
- **`ios/FocalsTests/CalendarMathTests.swift`** — 10 fixtures pinning grid math to web behaviour: 42-cell shape across multiple months, Monday-first first-cell, leap-year February (2024), DST-forward (March 2026), DST-back (November 2026), 12-month range with year-boundary, key formatting, wall-clock UTC-component decoding, and `projectsByDay` bucketing/sort. **All pass.**

### Tests to run on a real device / simulator
1. Sign in. Open the **Calendar** tab. The current month should be in view and "today" should have an accent ring around the day number.
2. Compare side-by-side with `/calendar` on the web (mobile viewport): same 12-month vertical stack, same 7-column Monday-first grid, same "Month YYYY" headline, same 4×4 status dots beneath each day.
3. Tap a future day with no projects → inline detail panel appears below that month: date header on the left, "+ Add" link on the right, "No projects scheduled." text below.
4. Tap a day with projects → cards render with: time range (e.g. `8:30 AM – 9:30 AM`), location, status pill, and a left-edge coloured stripe matching the project's status. Tap a card → pushes the project detail screen (still placeholder until Task 09).
5. Tap "+ Add" → sheet opens with `presetShootDate` set to **10:00 AM on the selected day** (matches web behaviour). Once the project form lands in Task 09 the date should appear pre-filled.
6. Tap **Today** in the toolbar → smooth-scrolls to the current month and selects today. Tap **+** → opens the create-project sheet with `selectedDay` pre-filled.
7. Tap a leading or trailing day from an adjacent month → selection moves to that day and the panel renders under that month's section.
8. Pull-to-refresh → triggers `ProjectsCacheRepository.refresh` and re-mirrors all rows to iOS Calendar (if enabled).
9. **EventKit mirror — once Task 12's Settings toggle ships, or you manually flip `EventKitMirrorEnabled` UserDefaults to `true`**: create a project with a `shoot_date`. Open the iOS **Calendar app** → confirm a "Focals" calendar exists and contains the project event at the wall-clock time. Edit the project's title or shoot date → reload the iOS Calendar app → event reflects the change. Delete the project → event is removed from the iOS Calendar app.
10. **Permission denial path**: deny calendar access at the system prompt. Subsequent project mutations should still succeed (mirror silently no-ops). Re-enable in iOS Settings → Privacy & Security → Calendars → Focals; next refresh re-mirrors everything.
11. **DST regression**: scrub to March 2026 and November 2026 — every day cell should render exactly once (no duplicate or skipped days).
12. **Leap-year sanity**: scrub back to February 2024 → 29 days in-month.

### Deferred / known limitations
- **EventKit toggle UI lives in Task 12 (Settings).** The mirror is wired to the `EventKitMirrorEnabled` UserDefaults key; until Settings ships, the only way to test it end-to-end is to flip it in `UserDefaults.standard.set(true, forKey: "EventKitMirrorEnabled")` from a debugger or to add a temporary toggle.
- **One-way mirror only.** Editing the iOS Calendar event directly does NOT push back to Supabase. Documented in `EventKitMirror.swift`'s file comment. v1.1 plan: detect divergence via `EKEventStoreChanged` and surface a "Push back to Focals?" banner.
- **No "Subscribe in Apple Calendar" button yet.** The webcal:// deep-link button lives in Task 12 (Settings). The web's existing `/api/calendar/<userId>?token=<calendar_token>` endpoint already serves projects (post the shoots → projects migration), so once Task 12 wires the button it should just work.
- **Bulk mirror is fire-and-forget.** After a refresh, every pulled project's mirror call is awaited sequentially. With 100s of projects and slow EventKit, this could be briefly noticeable; acceptable for the scale here, revisit if it becomes an issue.
- **Brand color in iOS Calendar.** The "Focals" calendar uses the `AccentColor` asset's CG color; if you re-skin the app, update the asset and the swatch in iOS Calendar will follow on the next save.
- **No conflict UI.** If the user happens to have a calendar already named "Focals" from a previous app, we re-use it — the mirror writes into it. Acceptable but flagged.

### Security / dashboard configuration
- **EventKit access prompt**: iOS will surface "Focals would like to access your calendar" the first time the user creates/updates a project with a shoot date and has the toggle on. Both the legacy and full-access usage strings are in `Info.plist`.
- **No new Supabase / OAuth dashboard config.** Calendar reads from the same `projects` table that the dashboard and inbox already use. The webcal feed at `/api/calendar/<userId>?token=...` is a pre-existing endpoint and is unchanged.

---

## iOS Task 09 — Projects, Clients ✅

Two CRUD modules sharing a common form/list/detail pattern. After this task, every project and client is fully editable from iOS, project detail shows a MapKit snapshot for the shoot location, and clients can be exported to system Contacts.

### What changed
- **`ios/FocalsKit/Sources/FocalsCache/Models/CachedProject.swift`** — added `geocodedLat`, `geocodedLng`, `geocodedLocation` for the per-project geocode cache + a `storeGeocode(lat:lng:for:)` helper. `applyServer` invalidates the cache when the location string changes. SwiftData handles the additive optional-field migration on its own.
- **`ios/Focals/Shared/Forms/`** — new directory: `FormSection`/`FormRow` (editorial card grouping), `MoneyField`, `DateField`, `StatusField` (generic enum picker), `RelatedRecordField` (FK picker with searchable sheet), `OptionalBindings` (`Optional<String>.bound` extension). All field components are reused by both modules and will be reused in Tasks 10–12.
- **`ios/Focals/Modules/Projects/`** — new directory: `ProjectsScreen` (list, status multi-select chips, client filter menu, search, swipe-to-cancel/delete, payment progress bar), `ProjectDetailScreen` (header + payment + basics + MapKit snapshot + notes + per-project "Add to iOS Calendar" + delete confirmation), `ProjectForm` (single sheet for create + edit, wall-clock packed back into UTC anchor on save).
- **`ios/Focals/Modules/Clients/`** — new directory: `ClientsScreen` (list with avatar, search, swipe-delete that refreshes Projects cache so null-FK propagates), `ClientDetailScreen` (avatar header, tap-to-call/email, "Add to Contacts", linked projects via SwiftData `@Query` filtered by `clientId`, linked inquiries via `convertedClientId`), `ClientForm`, `ClientAvatar` (initials fallback), `ContactsBridge` (`CNContactStore` wrapper), `CASCADE_RULES.md`.
- **`ios/Focals/Navigation/AppRouter.swift`** — added `editProject(Project)` and `editClient(Client)` to `SheetRoute`.
- **`ios/Focals/Navigation/RouteDestination.swift`** — `.createProject` / `.createClient` now resolve to the real forms; new `.editProject` / `.editClient` cases route to the same forms in edit mode.
- **`ios/Focals/Modules/PlaceholderScreens.swift`** — removed `ProjectsScreen`, `ClientsScreen`, `ProjectDetailScreen`, `ClientDetailScreen` stubs.
- **`ios/Focals/Info.plist`** — added `NSContactsUsageDescription` so the system permission prompt has a reason string.

### Tests to run on a real device / simulator

#### Projects
1. From Inbox or any other tab, switch to **Projects**. With cached projects, list renders with title, client name, status pill, payment progress bar, and shoot date / location meta line. Compare to `/projects` on the web for the same account — the same projects should be present in the same order.
2. **Filter chips** (status): tap one to scope, tap again to remove; multi-select supported. Tap **All** to reset.
3. **Client filter menu**: pick a client → list scopes; "Any client" resets.
4. **Search**: matches against title, location, category.
5. Tap **+** in the toolbar → `ProjectForm` opens with default `inquiry` status, blank fields. Fill everything, save → list refreshes, new project at top.
6. Tap a row → `ProjectDetailScreen`. Confirm KPI numbers (package price, amount paid, balance due, % paid) match the web's project detail page.
7. **Map**: with a location set, a static MapKit snapshot renders. The first appearance triggers `CLGeocoder` (toast says "Locating…" briefly); subsequent renders read from the cached lat/lng on `CachedProject` (instant). Tap the map → opens the system Maps app to that location.
8. **Edit project**: pencil button → `ProjectForm` opens in edit mode, all fields pre-filled with the wall-clock value the user typed (8:30 AM stays 8:30 AM regardless of viewer TZ). Save → detail screen reflects changes.
9. **Add to iOS Calendar** action: when `EventKitMirrorEnabled` is **off**, the per-project "Add to iOS Calendar" button appears for projects with a shoot date. Tap → permission prompt (first time) → event appears in the iOS Calendar app under the "Focals" calendar, then the toast confirms.
10. **Delete project**: trash button at the bottom → confirm dialog → row is gone, and you're popped back to the list.

#### Clients
1. Switch to **More → Clients**. List sorted alphabetically with avatar (initials fallback), name, and email/phone meta.
2. **Search** filters by name, email, phone.
3. Tap **+** → `ClientForm` opens. Save → list refreshes.
4. Tap a row → `ClientDetailScreen`. Tap the email row → Mail compose; tap the phone row → dialer.
5. **Add to Contacts**: tap the button → permission prompt the first time → toast "Added to Contacts"; open the iOS Contacts app and find the client (full name, work email, mobile phone, "Focals client" organization).
6. **Linked projects** section: pulls in every project where `client_id == this.id`, tap a row → pushes the project detail.
7. **Linked inquiries** section: pulls in every inquiry where `converted_client_id == this.id` (i.e. the convert-from-inbox flow's ancestor row), tap → pushes the inquiry detail.
8. **Delete client**: confirm dialog → on success, projects refresh in the background; navigate back to a project that used to belong to this client and confirm `Client` row is gone (FK was nulled at the server).
9. **Permission denied path**: deny Contacts at the system prompt → next "Add to Contacts" tap shows the actionable "Enable it in Settings → Privacy & Security → Contacts → Focals" message.

#### Shared
- `Optional<String>.bound` plays nicely with `TextField` (saves nil when cleared).
- `MoneyField` accepts decimal input, hides the "$" while editing, formats as currency when blurred.
- `RelatedRecordField` opens a searchable sheet, supports clear when allowed.
- Offline mutations (airplane mode + tap save) → form shows the standard offline alert; nothing is silently dropped.

### Deferred / known limitations
- **No "Generate contract from this project" affordance** — the web's project edit form has a link out to `/contracts/new?projectId=...&generate=1` (LLM-backed). That AI flow lands in Task 11 (Contracts).
- **No "Suggest a time" AI slot picker** — same reason; out of scope for Task 09.
- **Geocode cache invalidation is location-string equality.** If a user types "Pier 39" then later "pier 39, San Francisco", the cache is invalidated and we re-geocode. Acceptable.
- **Map snapshot is interactive-disabled** — tapping anywhere on the map opens the system Maps app, so the user can't pan inside the project detail. This matches the spec ("static — tap opens external Maps").
- **`CNContact.identifier` not persisted.** The web has no column for it, so re-tapping "Add to Contacts" creates a duplicate Contact each time. Documented in `ContactsBridge.swift`. v1.1: store the identifier in `clients.notes` JSON or a new `contact_identifier` column and update existing instead of inserting.
- **Status-multi-select state is not URL-persisted** — same as the web; if the user closes the app, filters reset.
- **No bulk actions** on the projects list. Single-select swipe is enough for now.
- **No Limited Contacts UI** for iOS 18 limited access — we treat `.limited` as `.authorized`. If you ship to iOS 18 with limited-contacts mode on, the user will need to add the client manually after we drop them into the picker.

### Security / dashboard configuration
- **Contacts access prompt**: surfaces the first time the user taps "Add to Contacts" on a client. The permission string lives in `Info.plist`.
- **No new Supabase / OAuth dashboard config.** All FK cascade behaviour is enforced server-side via `ON DELETE SET NULL` rules already in the schema (see `CASCADE_RULES.md`). iOS just refreshes its caches after the delete to pick up the null-FK state.
- **MapKit usage** — Apple's geocoder is rate-limited (~50 requests/minute). The per-project cache prevents abuse; if a user ever exceeds the limit, the placeholder gracefully says "Couldn't pin this address."

---

## iOS Task 10 — Finances ✅

Income/expense ledger with month-grouped list, P&L view (Month/Quarter/Year toggle, 6-month bar chart, by-category breakdown), CSV export via ShareLink, and the standard create/edit sheet.

### What changed
- **`ios/FocalsKit/Sources/FocalsAPI/FinanceConstants.swift`** — canonical category list (`session_fee`, `print_sale`, `gear`, `software`, `travel`, `misc`) and payment method list (`venmo`, `zelle`, `check`, `cash`, `stripe`) lifted from web's `validations/finances.ts`. Plus `Finance.parsedDate(calendar:)` and `Finance.signedAmountString` helpers.
- **`ios/Focals/Modules/Finances/`** — new directory: `FinancesScreen` (month-grouped list, search, swipe-delete, monthly +/− totals, ShareLink CSV export), `TransactionForm` (mirrors web's `TransactionForm.tsx`: type fixed at create time, amount validation, date / category / payment method / project FK / description), `PnLScreen` (Month/Quarter/Year segmented picker, summary card, BarMark chart, category breakdown), `FinancesCSVExport` (RFC 4180–compliant writer, temp-dir file URL).
- **`ios/Focals/Navigation/Route.swift`** + **`AppRouter.swift`** — added `Route.financesPnL` (pushed onto the More tab stack) + `SheetRoute.editFinance(Finance)`.
- **`ios/Focals/Navigation/RouteDestination.swift`** — `.createFinance` / `.editFinance` resolve to `TransactionForm`; `.financesPnL` resolves to `PnLScreen`.
- **`ios/Focals/Modules/PlaceholderScreens.swift`** — removed the `FinancesScreen` stub.

### Tests to run
1. Open **Finances**. Compare totals to `/finances` on the web for the same account; per-month income/expense should match digit-for-digit.
2. **+ menu** → Log income / Log expense — both open `TransactionForm`. Save → row appears at top of the right month.
3. Tap a row → form opens in edit mode. Amount/date/category preserved.
4. **P&L** in toolbar → push to `PnLScreen`. Month/Quarter/Year toggle filters the summary, chart, and breakdown.
5. **Export CSV** in the + menu → ShareLink → save to Files / share to Mail. Open the file in Numbers; rows/columns line up with the header `Date,Type,Amount,Category,Description,Payment Method,Project ID`.
6. Search filters by description, category, and payment method.
7. Swipe-left → delete. Mutation is offline-aware via the standard alert.

### Deferred / known limitations
- **No receipt photo capture.** The spec proposed base64-in-description; that bloats every list query and ships unbounded blobs through Supabase. Skipped pending a `receipts` storage bucket on the web side.
- **No Siri "Log expense" intent.** Bundled with Task 13 (native features) since AppIntents registration and Shortcuts surfacing live there.
- **No category constraint at write time** — the web also accepts free text, the iOS form just shows the canonical list as a quick picker.
- **CSV column order is fixed.** If you start tracking a new field, update `FinancesCSVExport.write` to keep iOS and web exports aligned.

### Security / dashboard configuration
- No new Supabase or OAuth config. CSV export writes to the system temp dir (auto-cleaned on app/system pressure) and is shared via the standard iOS share sheet — never round-trips through a third party.

---

## iOS Task 11 — Contracts ✅

Contracts module with list, markdown-rendered detail, status workflow, template picker for new contracts, and templates read-only list.

### What changed
- **`ios/Focals/Modules/Contracts/`** — new directory: `ContractsScreen` (list, search, status pill, sent/signed dates, swipe-delete), `ContractDetailScreen` (markdown body via `MarkdownUI`, Mark sent / signed / void / delete via menu, share button, custom-fields disclosure), `ContractNewScreen` (single-screen form: title + client + project + template picker that auto-substitutes `{{client_name}}`, `{{project_title}}`, `{{shoot_date}}`, `{{location}}`, `{{package_price}}` etc. when you pick records, plus a monospaced body editor), `ContractTemplatesScreen` (read-only list with banner explaining web-only authoring).
- **`ios/Focals/Modules/PlaceholderScreens.swift`** — removed the four contract-related stubs.

### Tests to run
1. **Templates**: from Contracts toolbar tap **Templates** → see the read-only list with the banner. Pull-to-refresh syncs from the server.
2. **New contract**: tap **+** → push to `ContractNewScreen`. Pick a client + project → pick a template → body editor populates with merge fields filled. Save → list refreshes; you're pushed to the new contract's detail.
3. **Detail**: markdown renders headings/lists/links/code. Use the **⋯ menu** → Mark sent / Mark signed / Mark void → status pill updates and the corresponding date stamp shows in the header. Verify the same status changes show on the web's `/contracts` page after pull-to-refresh.
4. **Share**: tap the share icon → exports the contract title + body as text. Goes through the standard iOS share sheet.
5. **Delete**: ⋯ menu → Delete → confirm → row disappears, you're popped back.
6. Offline: mutations show the standard offline alert.

### Deferred / known limitations
- **No PDF rendering.** The spec proposed fetching `/api/contracts/[id]/pdf` from the Next.js webapp. That requires a `WEBAPP_URL` config (not just the Supabase URL) and an authenticated bearer-token request; deferred to a later pass. iOS renders the markdown body inline instead, which is what users actually see in the contract editor on the web anyway.
- **No PencilKit signature capture.** Adding the canvas + PDF stamping + base64-in-`custom_fields` is a meaningful chunk; deferred. The "Mark signed" action still flips status and stamps `signed_at`, so the workflow works — it just doesn't capture the signature image.
- **No template editing on iOS.** Banner directs the user to the web for create/edit. v1.1 plan: add a `ContractTemplateForm` mirroring `ClientForm`.
- **Merge-field substitution is one-way.** If the user picks a template *before* picking a client, the merge fields aren't re-substituted when the client changes. The user can re-pick the template to refresh the body.

### Security / dashboard configuration
- No new config. Contract mutations flow through the existing `ContractsRepository` which inherits per-user RLS from the user's session.

---

## iOS Task 12 — Gear, Links, Forms, Help, Settings ✅

Five remaining modules. The shell is now feature-complete enough to use as a daily replacement for the web.

### What changed

**Gear** — `ios/Focals/Modules/Gear/`
- `GearScreen` (segmented Owned/Wishlist/All filter, search, swipe to mark-owned or delete, name/brand/model/category/price/status row).
- `GearForm` (canonical Camera/Lens/Lighting/Audio/Accessory/Other category picker, MoneyField for price, DateField for purchase date, status picker, notes).

**Links** — `ios/Focals/Modules/Links/`
- `LinksScreen` (grouped by category, in-app `SFSafariViewController` for taps, long-press context menu: Edit / Copy URL / Delete).
- `LinkForm` (URL input with `.URL` content type + scheme validation).
- `SafariView` (UIViewControllerRepresentable wrapping `SFSafariViewController`).

**Forms** — `ios/Focals/Modules/Forms/`
- `FormsScreen` (read-only list with a banner explaining web-only authoring; tap → field list with required badges).

**Help** — `ios/Focals/Modules/Help/`
- `HelpArticles` (in-bundle markdown for 5 starter articles: Getting started, Inquiry widget, Calendar sync, Contracts, Finances).
- `HelpScreen` (sectioned list, search across title + body).
- `HelpArticleScreen` (markdown rendered via `MarkdownUI`).

**Settings** — `ios/Focals/Modules/Settings/`
- `SettingsScreen` with five sections: Profile (name/business/website/Instagram), Calendar (mirror toggle that prompts EventKit access + bulk-mirrors existing projects on first enable; webcal subscribe button), Data (Reset tutorials, Clear cache, Sign out), About (version + send feedback).

**Plumbing**
- `SheetRoute` gained `createGear` / `editGear` / `createLink` / `editLink`.
- `RouteDestination.swift` resolves all of the above.
- `Profile.swift` now exposes a `public init` so settings can build update payloads (the synthesized internal-only init was inaccessible).
- `PlaceholderScreens.swift` is now down to two screens (`ProjectUploadScreen`, `MoreScreen`).

### Tests to run

#### Gear
1. Tap **+** → form opens. Fill name + price + status (Owned). Save. Row shows with star icon, brand·model·category meta, price.
2. Filter to **Wishlist** → only wishlist items show. Swipe a wishlist row → "Mark owned" → it flips and moves to the Owned filter.
3. Tap a row → form opens in edit mode. All fields preserved.

#### Links
1. Tap **+** → form. Title + URL with scheme. Save → list groups by category.
2. Tap a row → opens `SFSafariViewController` in-app (full Safari, not external).
3. Long-press → Edit / Copy URL / Delete.
4. Try saving a URL without `https://` → save button stays disabled.

#### Forms
1. Open **Forms**. Banner explains web-only. List shows existing forms with field counts.
2. Tap a form → field list with type and required badges.

#### Help
1. Open **Help**. 5 articles in 5 sections, search filters by title + body.
2. Tap **Calendar sync** → markdown renders headings / paragraphs / lists / code blocks.

#### Settings
1. **Profile**: load shows your current name/business/website/Instagram. Edit → Save → web reflects on next refresh.
2. **Calendar mirror toggle**: flip ON → permission prompt → existing projects bulk-mirror to the iOS Calendar app's "Focals" calendar.
3. **Subscribe in Apple Calendar**: opens `webcal://focals-base.vercel.app/api/calendar/<userId>?token=<calendarToken>` in the system Calendar app.
4. **Reset tutorials**: confirms tour metadata cleared (verify by re-launching the web — tour overlays return).
5. **Clear cache**: wipes the SwiftData store. Re-launch → lists are empty until pull-to-refresh.
6. **Sign out**: confirm → Keychain wipe + cache wipe (Task 03 logic).
7. **Version**: matches `Info.plist` `CFBundleShortVersionString`.

### Deferred / known limitations
- **No gear photo capture.** Same reason as receipt capture — base64-in-text isn't safe; revisit with a Storage bucket.
- **No inquiry sources CRUD in Settings.** The web has a `InquirySourcesSection` for managing webhook tokens. Skipped; users can manage these on the web until v1.1.
- **No Anthropic key card.** AI file import (Task 15) wasn't built either, so the key UI in Settings doesn't have anywhere to plug in yet.
- **No notifications toggles.** Bundled with Task 13.
- **No Face ID toggle in Settings.** It exists from Task 03 (`FaceIDLockEnabled` UserDefaults), just no UI to flip it. Add when bundling Task 13.
- **Help is in-bundle markdown.** 5 starter articles, hard-coded. v1.1: fetch from `https://focals-base.vercel.app/help/<slug>/markdown` (web change required) so updates ship without a build.
- **Forms is read-only.** No FormBuilder UI yet.
- **Calendar token regenerate** is not exposed in Settings (the spec asked for it). Skipped for v1; not destructive enough to warrant the regen prompt UI right now.

### Security / dashboard configuration
- **No new Supabase config.** Profile updates and tutorial resets go through `ProfileRepository.update`, which already enforces per-user RLS via the session.
- **`SFSafariViewController` is sandboxed by Apple** — no cookies or storage shared with the host app.
- **Help articles are in-bundle and never network-fetched in v1**, so there's no MITM surface.

---

## iOS Task 13 — Native features (in-app pieces) ✅

In-app scaffold for push notifications, Live Activities, Universal Links, and Settings toggles. **The Xcode extension targets, APNs key, and Edge Function are deferred to user actions** — flagged below.

### What landed in code
- **`ios/FocalsKit/Sources/FocalsAPI/SharedAuth.swift`** — App Group `UserDefaults` shim. Widgets, Live Activity, and Share Extensions read `currentUserId()` here. `SessionStore` mirrors the user id on sign-in / sign-out / token refresh.
- **`ios/FocalsKit/Sources/FocalsAPI/Repositories/ProfileRepository.swift`** — added `updatePushToken(_:userId:)` for the new `profiles.push_token` column.
- **`ios/Focals/Notifications/PushManager.swift`** — `UNUserNotificationCenterDelegate` for foreground delivery + tap-to-deeplink, opt-in flow via Settings, token persistence, no-op when the column is missing.
- **`ios/Focals/App/AppDelegate.swift`** — `UIApplicationDelegate` bridge so SwiftUI's `App` can receive `didRegisterForRemoteNotificationsWithDeviceToken`. Wired via `@UIApplicationDelegateAdaptor` in `FocalsApp`.
- **`ios/Focals/Notifications/ProjectCountdownAttributes.swift` + `ProjectCountdownActivityManager.swift`** — `ActivityKit` plumbing for the next-project countdown. Picks the soonest project starting in [now, now+4h], requests an Activity, ticks once a minute via foreground `Timer`, ends 10 min after the shoot.
- **`ios/Focals/App/RootView.swift`** — `.onContinueUserActivity(NSUserActivityTypeBrowsingWeb)` for Universal Links + a foreground Timer that drives `ProjectCountdownActivityManager.tick()`. Activity refreshes on scene-becomes-active.
- **`ios/Focals/Navigation/DeepLinkRouter.swift`** — added `resolveUniversalLink(_:)` that maps `https://focals-base.vercel.app/<head>/<id>` (inquiry, project, client, contract, upload, help) to the same destinations as the custom-scheme variants.
- **`ios/Focals/Modules/Settings/SettingsScreen.swift`** — new sections: Notifications (system permission prompt, per-type toggles, "Enable in Settings" deep-link when denied) and Security (Face ID toggle).
- **`ios/Focals/Auth/SessionStore.swift`** — sign-out now clears the push token, ends all Live Activities, wipes App Group user id before destroying the local cache.
- **`ios/Focals/Info.plist`** — added `NSSupportsLiveActivities`, `NSSupportsLiveActivitiesFrequentUpdates`, `UIBackgroundModes: [remote-notification]`.

### What you need to do (Xcode + Apple Dev + Supabase)

These are blocking for push + widgets to actually work:

1. **Apple Developer → Certificates, Identifiers & Profiles → Keys → "+"** — create an APNs Auth Key. Note the **Key ID** and your **Team ID**. Download the `.p8` (you only get one chance).
2. **Apple Developer → Identifiers → `com.focals.ios`** — enable the **Push Notifications** capability.
3. **Xcode → Focals target → Signing & Capabilities** — add the **Push Notifications** capability (this writes the `aps-environment` entitlement). Also confirm **Associated Domains** is enabled with `applinks:focals-base.vercel.app`.
4. **Web migration** — add `push_token TEXT` to `profiles`:
   ```sql
   alter table profiles add column if not exists push_token text;
   ```
   Run via `supabase db push` or paste into Supabase SQL editor.
5. **Web AASA file** — create `my-app/src/app/.well-known/apple-app-site-association/route.ts` returning the JSON in Task 13 spec Section F.1 with `Content-Type: application/json` (no `charset` suffix). Use your real `<TEAM ID>` in `appIDs`.
6. **Supabase Edge Function** — `my-app/supabase/functions/send-push/index.ts` (template in Task 13 Section E.4). Deploy via `supabase functions deploy send-push`. Set Edge Function secrets `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY_P8` (the `.p8` contents).
7. **Postgres trigger** — `notify_new_inquiry()` from Task 13 spec Section E.5. Apply via SQL editor.
8. **Cron** — schedule `pg_cron` to POST to `send-push` daily at 9pm for projects 24h out.

### Deferred / known limitations
- **No Widget Extension target.** Widgets need a separate target in Xcode → File → New → Target → Widget Extension. The `SharedAuth` helper is ready for that target to consume; once you create it, name it and I'll fill in the widget views from Task 13 Section A.
- **No Live Activity widget extension target.** `ProjectCountdownAttributes` is in the main app target ready to be re-imported by the widget extension. Until then, `Activity.request(...)` calls succeed but the system has no UI to render the activity, so it's silently dropped.
- **No App Intents extension target.** Siri "Log expense" / "Add inquiry" intents need a separate target. Defer until you actually want voice control.
- **No Share Extension target.** Same story.
- **Live Activity background updates require remote pushes** to the activity push token. v1 only updates while the app is foregrounded.
- **No Sign in with Apple sheet yet.** If Apple Review wants Apple Sign In as an alternative to Google, add a `SignInWithAppleButton` to `LoginView`. Auth backend supports it via Supabase out of the box.

### Security / dashboard configuration
- **Push token storage** is per-user in the existing `profiles` table; RLS already restricts access to the row owner.
- **Edge Function** runs with the Supabase service-role key, so it can read any user's push_token. Keep that key in the Edge Function's secrets, never on the client.
- **APNs `.p8` key** is sensitive — it lets anyone send pushes to your app's bundle ID. Store only in the Edge Function's secrets.

---

## iOS Task 15 — Project Upload (AI extraction) ✅

Mirrors the web's `ProjectsUploadDialog`: pick a file or photo, server-side Claude extraction, review pane, commit. Per-row inline editing of every project field is a v1.1 follow-up — v1 lets the user toggle rows on/off and pick the client decision, then commits the rest as-is.

### What landed in code
- **`ios/FocalsKit/Sources/FocalsAPI/ProjectUpload.swift`** — wire types: `UploadResponse`, `AnnotatedProposedProject`, `ClientMatch`, `ScoredCandidate`, `CommitProjectRow`, `CommitProjectsResult`. Mirrors web's exported types verbatim.
- **`ios/FocalsKit/Sources/FocalsAPI/ProjectUploadService.swift`** — actor that posts multipart to `<WEBAPP_URL>/api/projects/upload` and JSON to `<WEBAPP_URL>/api/projects/upload/commit`. Authenticates via `Authorization: Bearer <supabaseAccessToken>`. Validates 10 MB max, surfaces server-side errors with status codes.
- **`ios/Focals/Secrets.xcconfig`** — added `WEBAPP_URL` (defaults to `https://focals-base.vercel.app`); now read from `Info.plist`.
- **`ios/Focals/Info.plist`** — exposes `WEBAPP_URL` so the SPM service can read it via `Bundle.main.object(forInfoDictionaryKey:)`.
- **`ios/Focals/Modules/ProjectUpload/`** — new directory: `ProjectUploadSheet` (4-phase state machine: pick → extracting → review → committing, with photo + document pickers and per-row client menus), `DocumentPicker` (`UIDocumentPickerViewController` wrapper that copies the picked file out of the security-scoped URL into `tmp/`).
- **`ios/Focals/Modules/Projects/ProjectsScreen.swift`** — toolbar `+` is now a Menu with **New project** and **Import from file**.
- **`ios/Focals/Navigation/RouteDestination.swift`** — `.projectUpload` resolves to `ProjectUploadSheet`.

### What you need to do (web prerequisite)

The upload route already exists; the commit route is **new** and is the one server-side change required:

```ts
// my-app/src/app/api/projects/upload/commit/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { commitUploadedProjects, type CommitProjectRow } from '@/lib/actions/projects';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { jobId: string | null; rows: CommitProjectRow[] };
  const result = await commitUploadedProjects(body);
  if (result.error !== null) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data);
}
```

Two-line wrapper around the existing `commitUploadedProjects` server action — needed because iOS can't invoke Next server actions over HTTP.

The user must also have an **Anthropic API key** configured server-side under their `user_integrations` row (the web Settings page handles this — until iOS ships the AI key card from Task 12 deferred items, key entry is web-only). If the key is missing, `/api/projects/upload` returns 400 with a clear message which iOS surfaces in the alert.

### Tests to run
1. **Settings (web)** → connect Anthropic key.
2. iOS **Projects** tab → **+** menu → **Import from file**. Sheet opens with the two pick cards.
3. Tap **Choose file** → pick a CSV with a few project rows. Sheet flips to "Extracting…", then to a Review pane.
4. Untick rows you want to skip; the create button updates to `Create N projects`.
5. For each row, tap the **Client** menu — pick an existing client, accept the suggested new client, or "No client".
6. Tap **Create N projects**. After commit, sheet dismisses and Projects list refreshes.
7. Pick a **photo** of a paper booking form via the second card → same review/commit flow.
8. **10 MB cap** — picking a >10 MB file shows an actionable error before the network call.
9. **Per-row failures** — if the server returns errors for some rows, the sheet stays open showing only the failed rows.

### Deferred / known limitations
- **No per-row inline field editing.** v1 just lets you skip rows and pick clients. To edit a field, commit the row, then edit in `ProjectDetailScreen`.
- **No background URLSession.** A foreground extract takes 10–30s; the sheet shows "Keep this screen open." If you background mid-extract on a slow network, the request can be killed.
- **No camera capture entry point.** `UIImagePickerController` works but adds another permission. Skipped for v1; the photo library covers the same use case.
- **No "AI key not connected" empty state.** When the user hasn't configured a key, the upload errors out with the server's message. Friendlier UX is gated on the deferred Anthropic key card from Task 12.
- **`WEBAPP_URL` is hardcoded to the production Vercel URL.** Override via `Secrets.xcconfig` if you stage the webapp on a different host.

### Security / dashboard configuration
- All uploads go through your existing **Anthropic-billed** server-side extraction; iOS never holds an Anthropic key.
- The upload endpoint authenticates via the user's Supabase access token; RLS on `project_upload_jobs` and `projects` prevents cross-user leakage.
- Files are stored in memory on the server long enough to extract, then discarded — same behaviour as the web flow.

---

## iOS Task 14 — Testing & Release (in-app pieces) ✅

Process-heavy task; most of it is Apple Developer / App Store Connect work that only you can do. The code-side scaffolding is in place.

### What landed in code
- **`ios/Focals/PrivacyInfo.xcprivacy`** — declares the data types we collect (Name, Email, Phone, User Content, Other Contacts, Device ID for push) and the privacy-sensitive APIs we touch (`UserDefaults`, file timestamp, system boot time). All linked, none used for tracking, all "App functionality" purpose. Required by Apple for App Store submission.
- **`ios/project.yml`** — adds `PrivacyInfo.xcprivacy` to the `Focals` target's resources so it's bundled into the .app.
- **`ios/bin/archive.sh`** — one-shot archive + `.ipa` export script. Reads version + build from Info.plist, archives in Release config, exports via `bin/ExportOptions.plist` to `build/Focals-<ver>-<build>/Focals.ipa`.
- **`ios/bin/ExportOptions.plist`** — automatic-signing app-store-connect distribution config.
- **`tasks/ios/STORE_LISTING.md`** — full draft of name, subtitle, description, keywords, category, URLs, App Privacy table, review notes, screenshot recipe.
- **Accessibility labels** on `KPICard` (combines into "Revenue MTD: $4,500") and `DayCell` (e.g. "Today, Tuesday April 14, 2 projects").

### What you need to do (Apple Developer + App Store Connect)

This is the bulk of Task 14 — only you can do these. Detailed checklist in [tasks/ios/14_TESTING_RELEASE_TELEMETRY.md](tasks/ios/14_TESTING_RELEASE_TELEMETRY.md):

1. **Apple Developer enrollment** — $99/year if you're not already in.
2. **Bundle ID `com.focals.ios`** — register, enable capabilities: App Groups, Push Notifications, Sign in with Apple, Associated Domains.
3. **Xcode → Signing & Capabilities** — automatic signing on, add the four capabilities above. (App Groups should already be on for the cache.)
4. **App Store Connect** → New App → bundle ID `com.focals.ios`, SKU `focals-ios-1`.
5. **App Privacy declarations** — use the table in `STORE_LISTING.md`. Match `PrivacyInfo.xcprivacy` exactly.
6. **Generate screenshots** — 6.7" iPhone + 12.9" iPad sizes. Recipe in `STORE_LISTING.md` lists 9 recommended frames.
7. **Privacy policy** — add a `/privacy` page on the web. Apple rejects apps without a working privacy URL.
8. **Run `./bin/archive.sh`** — produces a signed `.ipa`.
9. **Upload via Transporter.app** (or `xcrun altool`).
10. **TestFlight** → add export compliance ("No"), add yourself as internal tester, submit for beta review.
11. **Submit for App Review** — first review takes 24–48h.

### Deferred / known limitations
- **No automated UI tests.** The unit-test surface (55 passing tests) covers calculation correctness. UI smoke tests are easy to add when you start shipping more often.
- **No Sentry / crash reporting.** Adding the SPM dep + initialization is ~30 lines but changes `Package.swift`. Add when you cut the first crash; the Settings toggle is a one-liner once the SDK is in.
- **No `Localizable.xcstrings` sweep.** Xcode 15 auto-extracts on build. A few raw `Text("...")` calls remain in English; non-blocking for App Store review.
- **Light mode polish.** Design tokens default to dark. Light mode renders without crashing but a few cards have washed-out contrast. Run a dedicated pass before submission.
- **No real iPad testing.** The split-view code path exists, but I've only validated on iPhone simulator. Run the manual checklist before submitting.

### Security / dashboard configuration
- **Privacy manifest** declares only what we actually collect. If you add new SDKs, audit their bundled `PrivacyInfo.xcprivacy` and update ours if they expand the data-types list.
- **`Secrets.xcconfig` is gitignored.** The Supabase anon key is the only secret; it's the public anon key (intentionally distributable).
- **`stripSwiftSymbols: true`** in ExportOptions trims debug symbols from the shipped binary.

---

## Task: Subagent team + dispatch protocol (2026-06-10)

Created six project subagents in `.claude/agents/` (web-dev, ios-dev, supabase-db, code-reviewer, qa-verifier, security-auditor) plus a root `CLAUDE.md` with an orchestrator dispatch table so the main agent routes work by domain (schema → supabase-db first, then web/iOS in parallel; verification + security gates before "done").

### What you need to do
- **Restart your Claude Code session** (or run `/agents`) so the new agent files are picked up — agents are loaded at session start.
- Skim `CLAUDE.md` and tweak the dispatch rules if you want a different workflow (e.g. always require code-reviewer).

### Tests to run
- None — no app code changed. Try it with a prompt like "add a notes field to projects" and confirm the main agent routes supabase-db → web-dev + ios-dev → qa-verifier.

### Security concerns
- code-reviewer, qa-verifier, and security-auditor are tool-restricted to read-only file access (Read/Grep/Glob + Bash for inspection/builds); only the three specialist dev agents can edit files.

### Deferred / known limitations
- No dedicated docs/research agent — the built-in Explore agent covers read-only codebase search already.
- Subagents can't spawn subagents; cross-domain handoffs flow through the main agent by design (rule 2 in CLAUDE.md).

---

## Task: Lenslate brand implementation (2026-06-10)

Renamed the product to **Lenslate** per the design handoff (`tasks/design_handoff_lenslate_brand/README.md`): `NEXT_PUBLIC_APP_NAME=Lenslate` in `.env.local` + `.env.local.example`, new `<Wordmark>` component (Canela name + bone lens dot) used in the sidebar and login `<h1>`, and a placeholder SVG favicon / apple-touch icon (bone "L" on a dark tile) replacing `favicon.ico`.

### What you need to do
- Restart the dev server so the new `NEXT_PUBLIC_APP_NAME` value is picked up (env vars are inlined at build time).
- Replace `src/app/icon.svg` / `apple-icon.svg` with the final logo when ready — current icon renders the "L" in Georgia, not real Canela.
- If `NEXT_PUBLIC_APP_NAME` is set in Vercel project env vars, update it to `Lenslate` there too.

### Tests to run
- Tab titles read `… · Lenslate`; sidebar wordmark navigates home on click.
- Toggle Settings → Appearance: lens dot stays attached and visible in both themes.
- Favicon shows the dark "L" tile (hard-refresh; favicons cache aggressively).

### Security concerns
- `'focals-llm-key-salt'` in `src/lib/llm/encryption.ts` deliberately left untouched — changing it would make encrypted user API keys undecryptable.

### Deferred / known limitations
- Pre-existing lint errors (react/no-unescaped-entities) in `ProjectsUploadDialog.tsx` and `AiIntegrationSection.tsx` — unrelated to this task, not fixed.
- Icon "L" glyph is a `<text>` element, not a baked Canela path; acceptable placeholder per the handoff.

---

## Task: iOS Projects redesign — grouped cards, summary detail, nav-bar Done (2026-06-10)

Implemented `tasks/design_handoff_ios_projects/README.md` in the SwiftUI app: Projects list now groups by pipeline phase (Inquiries / Upcoming / In progress / Delivered / Cancelled) with card rows; project detail leads with the serif hero + 3 summary tiles (Shoot / Balance / Paid ring); `DetailSheet` gained an optional `onConfirm` (leading Cancel + working spinner) and `ProjectForm` now saves from the nav-bar Done/Add — the bottom "Save changes" button is gone. Payment status in the form is a segmented picker. Ran `xcodegen` to pick up the new `ProjectPipeline.swift`.

### Tests to run (manual, in Simulator)
- Projects tab: sections appear in pipeline order, empty phases hidden, Cancelled section dimmed at the bottom; search still filters; pull-to-refresh works.
- Long-press a card → context menu shows "Cancel project" + "Delete" (swipe-to-delete was replaced by the context menu since cards no longer live in a List).
- Tap a card → detail: hero, status pill + "client · category", 3 tiles, Payment, Details (Client and Location tappable — Location opens Apple Maps), map, notes, Add to iOS Calendar, Delete.
- Edit/New project: Cancel left, bold Done/Add right (disabled until Title non-empty), spinner while saving, sheet dismisses on success; no bottom save button.
- Other sheets (Client, Gear, Transaction, Link, Inquiry, Import) still show dismiss-only Done.

### Security concerns
- None — UI-only changes; repositories and validation untouched.

### Deferred / known limitations
- Status/client filter chips were removed from the Projects list per the handoff (grouping replaces status filtering); client filtering is now only via search. Flag if you miss it.
- `DetailSheet` now presents at `.large` only (was `.medium + .large`) — per the README snippet; affects all form sheets app-wide.
- Cancel in form sheets discards edits without an "unsaved changes" prompt (same as before, just more discoverable now).

### Dashboard config
- None.

---

## Task: Lenslate waitlist endpoint (2026-06-11)

Wired the two landing pages (`tasks/design_handoff_lenslate_waitlist/`) to a real waitlist endpoint: `waitlist_signups` table (applied to the live Supabase project via MCP + recorded as `supabase/migrations/20260611000000_waitlist_signups.sql`), `src/lib/validations/waitlist.ts`, `src/app/api/waitlist/route.ts` (CORS on, 201/409/400 contract), middleware exclusion for the public route, and both HTML pages now point at `https://focals-base.vercel.app/api/waitlist`.

### What you need to do
- **Deploy to Vercel** — until the new route is deployed, the landing forms will show an error state (the endpoint global is set, so demo mode is off).
- Host the two HTML pages wherever you plan to publish them (they work from any origin — CORS is open).
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel env (it should be, since `/api/inquiry` already needs it).

### Tests run
- Local curls: fresh email → 201; repeat (different case) → 409 duplicate; invalid → 400; OPTIONS preflight → 204 with correct CORS headers. Typecheck, lint (changed files), and `npm run build` all pass. Test row deleted from the remote table afterward.

### Security concerns
- `/api/waitlist` is intentionally public with `Access-Control-Allow-Origin: *` and no rate limiting — anyone can spam signups. Mitigations when you care: per-IP rate limit, `WAITLIST_TOKEN` env (route already supports it; pair with `window.LENSLATE_WAITLIST_TOKEN`), or a honeypot field. README §7 has details.
- RLS is on with no policies — only the service-role route can read/write the table.

### Deferred / known limitations
- Migration history note: the remote migration was applied via MCP under the name `waitlist_signups`; the repo file uses version `20260611000000`. If you ever run `supabase db push` against this project, you may need `supabase migration repair` to reconcile.
- No confirmation email / double opt-in (app deliberately has no Resend key). Add later via README §7 if wanted.

---

## Task: Waitlist spam protection (2026-06-11)

Added two layers to `/api/waitlist`: a per-IP rate limit (5 req/min, in-memory `src/lib/rate-limit.ts`, 429 + Retry-After when exceeded) and a honeypot (`hp` field in the schema; non-empty → silent 201 with no DB insert, so bots can't detect the drop).

### What you need to do
- **Deploy to Vercel** along with the earlier waitlist changes.
- If/when the landing pages add the hidden `hp` input, no server change is needed — the field is already accepted and acted on.

### Tests run
- Live dev-server sequence from one IP: honeypot POST → 201 with no row in `waitlist_signups` (verified via SQL); normal POST → 201 with row; further requests → 409 duplicates until the 6th and 7th hit 429. Typecheck + lint pass. Test rows deleted.

### Security concerns / limitations
- **The in-memory rate limiter is per-instance.** On Vercel serverless each lambda has its own Map, so the effective limit is per-warm-instance, not truly per-IP — it blunts naive bursts but won't stop a distributed or instance-spreading attacker. For a real guarantee, swap the Map for Upstash Redis (`@upstash/ratelimit`) keeping `rateLimit()`'s signature.
- `clientIp` trusts `x-forwarded-for`, which is fine behind Vercel's proxy (it sets the header) but spoofable if the route is ever exposed directly.

---

## Task: Landing pages served by the app (2026-06-11)

Ported the two prototype landing pages into real Next.js routes: `/landing` (web app pitch, source `web-landing`) and `/landing/ios` (iOS pitch, source `ios-landing`), in a `(marketing)` route group with its own minimal dark layout (no app shell). Shared components live in `src/components/marketing/` (Reveal, RotatingWord, Phone/Browser frames, TopNav, FeatureGrid, Waitlist form with honeypot, Footer, UI mocks). Forms POST same-origin to `/api/waitlist`. `/landing` added to middleware PUBLIC_ROUTES.

### What you need to do
- **Deploy to Vercel** — then the pages are live at focals-base.vercel.app/landing and /landing/ios.
- **Visual QA in a browser** (agents only verified status codes/markup): reveal-on-scroll, rotating hero word, phone/browser frame mocks, responsive breakpoints on mobile, waitlist success card.
- Decide whether `/` should show the landing page for logged-out visitors instead of redirecting to /login (currently unchanged). One-line middleware/redirect change if wanted.
- The original HTML files in tasks/ still point at the absolute Vercel URL — they're now reference-only; the real pages are in the app.

### Tests run
- typecheck, eslint (marketing files), production build (`/landing` + `/landing/ios` both static ○). Unauthenticated curl: both pages 200, `/` still 307→/login, waitlist POST from the page contract → 201 (test row deleted).

### Security concerns
- Pages are public by design; the only mutation path is /api/waitlist which already has rate limiting + honeypot + RLS.

### Deferred / known limitations
- App Store badge links to "#" (app not shipped yet).
- No analytics on the landing pages (no pageview/conversion tracking yet).
