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
