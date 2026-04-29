# Task 12 — Gear, Links, Forms, Help, Settings

## Goal

Build the five remaining low-complexity modules in one task. None of them justify their own task file; together they round out the parity surface so iOS can replace the web for daily operations.

References:
- [my-app/src/app/(dashboard)/gear/](../../my-app/src/app/(dashboard)/gear/)
- [my-app/src/app/(dashboard)/links/](../../my-app/src/app/(dashboard)/links/)
- [my-app/src/app/(dashboard)/forms/](../../my-app/src/app/(dashboard)/forms/)
- [my-app/src/app/(dashboard)/help/](../../my-app/src/app/(dashboard)/help/)
- [my-app/src/app/(dashboard)/settings/](../../my-app/src/app/(dashboard)/settings/)

---

## Module 1 — Gear

### `GearScreen` (list)

```
┌──────────────────────────────────────────┐
│ ← Gear              [Owned/Wishlist] [+] │
│ ──────────────────────────────────────── │
│ ★ Sony A7 IV          $2,400 · Owned     │
│ ★ 24-70mm GM          $2,200 · Owned     │
│ ☆ Profoto B10            — · Wishlist    │
└──────────────────────────────────────────┘
```

- Segmented filter: Owned / Wishlist / All
- Tap row → edit form
- Swipe-left to delete
- Toolbar `+` opens create form

### `GearForm`

Fields:
- Name (TextField)
- Brand (TextField)
- Model (TextField)
- Category (picker: Camera, Lens, Lighting, Audio, Accessory, Other — match web)
- Status (StatusField: owned / wishlist / sold / lost)
- Serial number (TextField)
- Purchase date (DateField, optional)
- Purchase price (MoneyField, optional)
- Photo (PhotosPicker — same base64 pattern as receipts in Task 10)
- Notes (TextEditor)

Quick action on owned items: tap a wishlist item's "Mark owned" button → flips status, prompts purchase price + date.

---

## Module 2 — Links

### `LinksScreen` (list)

```
┌──────────────────────────────────────────┐
│ ← Links                              [+] │
│ ──────────────────────────────────────── │
│ Inspiration      Editorial photo ref     │
│   bedimagine.com                          │
│ ──────────────────────────────────────── │
│ Tools            Color grading guide     │
│   helmut.io/...                           │
└──────────────────────────────────────────┘
```

- Group by `category`
- Tap row → opens URL in `SFSafariViewController` (in-app browser, full Safari features)
- Long-press → context menu: Edit, Copy URL, Delete

```swift
import SafariServices

struct LinksScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedLink.createdAt, order: .reverse) private var cached: [CachedLink]
    @State private var presentedURL: URL?

    var body: some View {
        List {
            ForEach(grouped, id: \.0) { category, links in
                Section(category) {
                    ForEach(links) { link in
                        Button {
                            if let url = URL(string: link.url) { presentedURL = url }
                        } label: {
                            VStack(alignment: .leading) {
                                Text(link.title).font(.tokens.medium(15))
                                Text(link.url).font(.tokens.body(12)).foregroundStyle(.tokens.textTertiary).lineLimit(1)
                            }
                        }
                        .contextMenu {
                            Button("Edit") { /* open form */ }
                            Button("Copy URL") { UIPasteboard.general.string = link.url }
                            Button("Delete", role: .destructive) { /* confirm */ }
                        }
                    }
                }
            }
        }
        .sheet(item: $presentedURL) { url in
            SafariView(url: url)
        }
        .navigationTitle("Links")
    }
}

struct SafariView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }
    func updateUIViewController(_ vc: SFSafariViewController, context: Context) {}
}
```

### `LinkForm`

- Title
- URL (TextField with `.textContentType(.URL)`, validate as `URL(string:)` non-nil)
- Category (TextField — free-form, web doesn't constrain)
- Notes

---

## Module 3 — Forms

**Read-only in v1.** Creation is web-only. The list shows existing forms with their fields so the user can reference them on iOS.

### `FormsScreen`

```
┌──────────────────────────────────────────┐
│ ← Forms                                  │
│ ──────────────────────────────────────── │
│ ⓘ Form creation is web-only. Manage      │
│   your forms at focals-base.vercel.app   │
│ ──────────────────────────────────────── │
│ Wedding Inquiry                           │
│   8 fields · last edited Apr 12          │
│ ──────────────────────────────────────── │
│ Portrait Booking                          │
│   5 fields · last edited Mar 28          │
└──────────────────────────────────────────┘
```

Tap row → detail showing the field list (name, type, required) and an "Open in browser" button that deep-links to `https://focals-base.vercel.app/forms/[id]`.

---

## Module 4 — Help

### `HelpScreen` (index)

```
┌──────────────────────────────────────────┐
│ ← Help                  [⌕ Search]        │
│ ──────────────────────────────────────── │
│ GETTING STARTED                          │
│   • Setting up your account               │
│   • Connecting Google Calendar            │
│ INQUIRIES                                │
│   • Embedding the inquiry widget          │
│   • Connecting Resend / Zapier            │
│ ...                                       │
└──────────────────────────────────────────┘
```

Articles are fetched from `https://focals-base.vercel.app/help/[slug]` as raw markdown. Need to add a tiny endpoint to web that exposes the markdown source — or scrape the rendered HTML and convert. Cleaner option: add `app/help/[slug]/markdown/route.ts` to `my-app` that returns the raw md, then iOS fetches it.

### `HelpArticleScreen`

```swift
import MarkdownUI

struct HelpArticleScreen: View {
    let slug: String
    @State private var markdown: String?

    var body: some View {
        ScrollView {
            if let markdown {
                Markdown(markdown)
                    .padding(Spacing.md)
            } else {
                ProgressView()
            }
        }
        .navigationTitle(title)
        .task {
            let url = URL(string: "https://focals-base.vercel.app/help/\(slug)/markdown")!
            let (data, _) = try! await URLSession.shared.data(from: url)
            markdown = String(data: data, encoding: .utf8)
        }
    }
}
```

Cache fetched markdown in `URLCache` (default config) so repeat visits are instant.

**Web change required**: Add `my-app/src/app/(dashboard)/help/[slug]/markdown/route.ts` that returns the raw markdown for the article. Document this in USER_TODO.md as a one-line web change. Alternative: bundle the markdown files into the iOS app's resources for offline access — preferred for v1, syncs whenever a new app version ships.

---

## Module 5 — Settings

This is the kitchen-sink screen. Sections:

### Profile

- Avatar (Kingfisher from Google CDN)
- Full name (editable TextField)
- Business name
- Instagram handle
- Website URL

Save button at bottom; calls `ProfileRepository.shared.update(...)`.

### Calendar

- **Subscribe in Apple Calendar** button (Task 08 — opens `webcal://` URL)
- **Mirror projects to iOS Calendar** toggle (EventKitMirror — Task 08). Each project with `shoot_date` becomes one event in the dedicated `[APP_NAME]` calendar.
- **Calendar feed token** — read-only display with "Regenerate" button. Calls server action via `ProfileRepository.shared.regenerateCalendarToken()`. Confirm prompt: "Regenerating invalidates the existing iCal subscription URL. Continue?"

### Inquiry sources

- List of `inquiry_sources` with status, type, label
- Per-row: copy webhook URL, regenerate token, deactivate
- "Add new source" button — sheet matching web settings → InquirySourcesSection

### AI file import (Task 15)

- Heading: **AI file import**
- Status pill: "Connected" (green) / "Not connected" (neutral)
- If not connected: button "Add Anthropic API key" → opens a sheet with a password-style input + Save. Validates the key via Anthropic's `/v1/models` before storing.
- If connected: shows masked key (`sk-ant-…XYZ`), last-used date, "Replace" + "Disconnect" buttons.
- Backed by the same `user_integrations` table the web reads. Stored encrypted at rest server-side; never round-tripped to iOS in plaintext.
- Tooltip: "Used only to extract project data from files you upload. Never used for anything else."

### Notifications (Task 13 detail)

- Toggle: New inquiry alerts
- Toggle: Project reminders (24h before `shoot_date`)
- Toggle: Live Activity for next upcoming project

### Security

- Toggle: Require Face ID to open the app (Task 03)

### Data

- Tutorial reset (re-show all in-app tour overlays — equivalent to web's `resetTours()`)
- Clear cache (wipes SwiftData store, forces full refresh on next foreground)
- Sign out (Task 03 logic)

### About

- Version + build number from Info.plist
- Send feedback (mailto:)
- Privacy policy (link)
- Terms (link)

### Settings layout pattern

```swift
struct SettingsScreen: View {
    var body: some View {
        Form {
            Section("Profile") { ProfileSection() }
            Section("Calendar") { CalendarSettingsSection() }
            Section("Inquiry sources") { InquirySourcesSection() }
            Section("Notifications") { NotificationsSection() }
            Section("Security") { SecuritySection() }
            Section("Data") {
                Button("Reset tutorials") { Task { await resetTours() } }
                Button("Clear cache", role: .destructive) { /* confirm */ }
                Button("Sign out", role: .destructive) { /* confirm */ }
            }
            Section("About") {
                LabeledContent("Version", value: appVersion)
                Link("Send feedback", destination: URL(string: "mailto:hello@[APP_NAME].app")!)
            }
        }
        .navigationTitle("Settings")
    }
}
```

Use `Form` with the system grouped style here only — settings is the one place where it's actually appropriate. Style overrides via `.scrollContentBackground(.hidden).background(Color.tokens.bg)` to keep the editorial feel.

---

## Acceptance Criteria

### Gear
- [ ] List filters by Owned/Wishlist
- [ ] Photo capture works (camera + library)
- [ ] "Mark owned" flips wishlist → owned with prompted purchase price/date
- [ ] CRUD round-trips to DB

### Links
- [ ] Grouped by category
- [ ] Tap opens `SFSafariViewController` in-app
- [ ] Long-press: edit, copy URL, delete
- [ ] URL validation prevents saving invalid URLs

### Forms
- [ ] Banner explains creation is web-only
- [ ] List + detail render existing forms with field metadata
- [ ] "Open in browser" deep-links correctly

### Help
- [ ] Index lists articles grouped by section
- [ ] Article view renders Markdown correctly (lists, headers, links, code blocks)
- [ ] Markdown source comes from `https://focals-base.vercel.app/help/[slug]/markdown` OR bundled resources (whichever the user picks)
- [ ] Search filters by title

### Settings
- [ ] Profile edits round-trip via `ProfileRepository.update`
- [ ] Calendar token regenerate works (verify by reading new token in DB)
- [ ] Inquiry sources CRUD parity with web settings
- [ ] EventKit mirror toggle integrates with Task 08 — flipping ON prompts permission, mirrors existing projects; flipping OFF deletes mirrored events
- [ ] AI file import card: validates a pasted Anthropic key, stores it encrypted via the same server endpoint the web uses, displays a masked hint (`sk-ant-…XYZ`), and supports Replace/Disconnect
- [ ] Face ID toggle takes effect on next cold start (Task 03)
- [ ] Reset tutorials clears tutorial_progress JSONB (round-trips via `ProfileRepository`)
- [ ] Clear cache wipes SwiftData store (verify by re-launching → cache empty)
- [ ] Sign out matches Task 03 behavior — full wipe
- [ ] Version label matches Info.plist `CFBundleShortVersionString`
- [ ] Send feedback opens Mail composer

## Depends on

- 04 (Shell, sheet infrastructure)
- 05 (Cache repos for `gear`, `links`, `forms`, `inquiry_sources`)
- 03 (Face ID toggle, sign out)
- 08 (EventKit mirror toggle, calendar subscription)
- For the optional "fetch markdown from web" path: a small route added to `my-app/` (document in USER_TODO.md)
