# Task 09 — Projects, Clients

## Goal

Build two CRUD modules sharing a common list/detail/form pattern. After this task, every project and client is fully editable from iOS, clients link to/from system Contacts (with permission), and project detail shows the shoot location on a MapKit snapshot.

These two modules are the heaviest hitter for daily use. They share enough patterns that doing them together prevents two rounds of "what should the form layout look like?" debate.

> **Background**: there used to be a third module (Shoots) on the web. The shoots concept has been removed — `projects.shoot_date` (timestamptz) IS the calendar event, so the project detail screen subsumes everything that used to live in shoots. The MapKit snapshot moves here. See web migration `20260429000000_drop_shoots_and_auto_finance_income.sql`.

References:
- [my-app/src/app/(dashboard)/projects/](../../my-app/src/app/(dashboard)/projects/)
- [my-app/src/app/(dashboard)/clients/](../../my-app/src/app/(dashboard)/clients/)

---

## Step 1 — Shared form components

Build these once in `ios/Focals/Shared/Forms/`. All three modules consume them.

```swift
// MoneyField.swift — locale-aware currency input
struct MoneyField: View {
    @Binding var value: Decimal?
    let label: String
    // Uses NumberFormatter with .currency style; auto-strips $ symbol on edit
}

// DateField.swift
struct DateField: View {
    @Binding var date: Date?
    let label: String
    let allowsClear: Bool
    // Wraps DatePicker with a "Clear" affordance when allowsClear
}

// StatusField.swift — generic over RawRepresentable enum
struct StatusField<S: RawRepresentable & CaseIterable & Hashable>: View where S.RawValue == String {
    @Binding var value: S
    let label: String
    // Renders as a Menu with a chevron
}

// RelatedRecordField.swift — picker for foreign-key selection
struct RelatedRecordField<T: Identifiable & Hashable>: View where T.ID == UUID {
    @Binding var selectedId: UUID?
    let label: String
    let options: [T]                        // typically passed from a @Query in parent
    let display: (T) -> String
    let allowsClear: Bool
    // Tappable row that opens a sheet with searchable list
}

// FormSection.swift — visual grouping with header + cardStyle
```

These components match the editorial aesthetic; no system grouped-table styling.

## Step 2 — Projects module

### `ProjectsScreen` (list)

```
┌──────────────────────────────────────────┐
│ ← Projects                    [Filter][⊕]│
│ ──────────────────────────────────────── │
│ Sarah J · Wedding         BOOKED         │
│ ━━━━━━━━━━━━━━━━━━━━━━━ 50% paid        │  ← payment progress bar
│ ──────────────────────────────────────── │
│ Mike R · Portrait         IN_PROGRESS    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% paid   │
└──────────────────────────────────────────┘
```

- `@Query(sort: \CachedProject.updatedAt, order: .reverse)` — cached list
- Filter bar at top: status (multi-select), payment status, client (foreign-key picker)
- Tap row → `.projectDetail(id)` push
- Toolbar `+` → `presentedSheet = .createProject`
- Swipe right: archive (status → archived). Swipe left: delete (with confirm)

### `ProjectDetailScreen`

- Header: title, status pill, payment progress bar
- Sections:
  - **Basics**: client (link → ClientDetail), category, location, shoot date & time
  - **Payment**: package price, amount paid, payment status, balance due (computed)
  - **Map**: if `location` is set, render a static MapKit snapshot (geocoded once and cached on `CachedProject`). Tap to open the system Maps app.
  - **Linked records**: contracts (Task 11), finances (Task 10)
  - **Notes**: multi-line text
- Action row: **Add to iOS Calendar** — calls `EventKitMirror.shared.mirror(...)` from Task 08. (Behind the EventKit toggle — if the toggle is on globally, the project is auto-mirrored on save and this button is hidden.)
- Toolbar: edit (opens form sheet), delete

### `ProjectForm` (create + edit)

Single sheet, switching mode based on `editingProject: Project?` parameter:

```swift
struct ProjectForm: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @State private var draft: Project        // initialized from editingProject or new
    @Query private var clients: [CachedClient]

    var body: some View {
        Form {
            FormSection(header: "Basics") {
                TextField("Title", text: $draft.title)
                RelatedRecordField(
                    selectedId: $draft.clientId,
                    label: "Client",
                    options: clients.map { $0.toModel() },
                    display: { $0.fullName },
                    allowsClear: true
                )
                StatusField(value: $draft.status, label: "Status")
                TextField("Category", text: $draft.category.bound)
                TextField("Location", text: $draft.location.bound)
                DateField(date: $draft.shootDate, label: "Shoot date", allowsClear: true)
            }
            FormSection(header: "Payment") {
                MoneyField(value: $draft.packagePrice, label: "Package price")
                MoneyField(value: $draft.amountPaid, label: "Amount paid")
                StatusField(value: $draft.paymentStatus, label: "Payment status")
            }
            FormSection(header: "Notes") {
                TextEditor(text: $draft.notes.bound)
                    .frame(minHeight: 120)
            }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Save") { Task { await save() } }
            }
        }
    }
}
```

`Optional<String>.bound` is a tiny extension that surfaces an Optional as a non-optional binding for `TextField`/`TextEditor`. Standard SwiftUI pattern.

## Step 3 — Clients module

### `ClientsScreen` (list)

- Avatar (Kingfisher), full name, email/phone
- Searchable by name
- Sort: alphabetical by `fullName`
- Tap row → `.clientDetail(id)`

### `ClientDetailScreen`

- Header: avatar, name, email, phone (each tap-to-call/email/copy)
- Action: **Link to Contact** — opens system Contacts picker, stores the contact identifier in `notes` JSONB or a new `notes` field. Or: **Add to Contacts** if not yet linked
- Sections:
  - **Linked projects** (`@Query` filtered by `clientId`)
  - **Linked inquiries** (where `convertedClientId == this.id`)
- Toolbar: edit, delete (with confirm)

### Contacts integration

Create `ios/Focals/Modules/Clients/ContactsBridge.swift`:

```swift
import Contacts
import ContactsUI

@MainActor
public final class ContactsBridge: NSObject {
    public static let shared = ContactsBridge()
    private let store = CNContactStore()

    public func requestAccess() async -> Bool {
        if #available(iOS 18.0, *) {
            // iOS 18 has limited access; ignore for v1
        }
        return await withCheckedContinuation { cont in
            store.requestAccess(for: .contacts) { granted, _ in
                cont.resume(returning: granted)
            }
        }
    }

    public func upsertContact(from client: Client) async throws -> String {
        guard await requestAccess() else { throw FocalsAPIError.auth(message: "Contacts access denied") }
        let contact = CNMutableContact()
        let parts = client.fullName.split(separator: " ", maxSplits: 1).map(String.init)
        contact.givenName = parts.first ?? client.fullName
        contact.familyName = parts.dropFirst().first ?? ""
        if let email = client.email {
            contact.emailAddresses = [.init(label: CNLabelWork, value: email as NSString)]
        }
        if let phone = client.phone {
            contact.phoneNumbers = [.init(label: CNLabelPhoneNumberMobile, value: CNPhoneNumber(stringValue: phone))]
        }
        let request = CNSaveRequest()
        request.add(contact, toContainerWithIdentifier: nil)
        try store.execute(request)
        return contact.identifier
    }
}
```

`Info.plist`:
```xml
<key>NSContactsUsageDescription</key>
<string>[APP_NAME] saves your clients to system Contacts so you can reach them from any app.</string>
```

## Step 4 — MapKit snapshot on Project Detail

Render a static `Map` if `project.location` is set:

```swift
Map {
    Marker(project.location ?? "", coordinate: geocoded)
}
.frame(height: 180)
.cardStyle()
.disabled(true)              // static — tap opens external Maps
.onTapGesture { openInMaps() }
```

Geocode `location` once with `CLGeocoder().geocodeAddressString(_:)` and cache the resulting lat/lng on `CachedProject` so subsequent renders don't re-hit the geocoder rate limit.

## Step 5 — Cascade rules documentation

Web's behavior (from server actions): deleting a client **nulls out** `client_id` on linked projects — does NOT cascade-delete. Match this on iOS by:
1. Sending `DELETE /clients/:id` to Supabase as normal — Postgres FK rules handle the nulling.
2. After successful delete, refresh `ProjectsCacheRepository` to pick up the FK change.

Document in `ios/Focals/Modules/Clients/CASCADE_RULES.md`.

---

## Acceptance Criteria

### Projects
- [ ] List shows all projects sorted by updatedAt desc, with status pill + payment progress bar
- [ ] Filter by status (multi-select) works
- [ ] Filter by client (single-select) works
- [ ] Tap row → detail; detail shows linked contracts, finances, and a MapKit snapshot if location set
- [ ] Create / edit form round-trips to DB with all fields including shoot date & time
- [ ] Delete with confirm; after delete, list refreshes
- [ ] Numbers (package price, amount paid, balance) match web display exactly
- [ ] "Add to iOS Calendar" on a project calls `EventKitMirror.mirror` (Task 08)
- [ ] Map is geocoded once and the result is cached on `CachedProject`
- [ ] Tapping the map opens the system Maps app to that location

### Clients
- [ ] List shows avatar, name, contact info; searchable by name
- [ ] Tap row → detail with linked projects and inquiries
- [ ] Tap email opens Mail app; tap phone opens dialer
- [ ] "Add to Contacts" creates a system Contact with all fields populated, after permission grant
- [ ] Permission denied → actionable "Open Settings" message
- [ ] Delete client nulls FK on linked projects (verified by re-querying after delete)

### Shared
- [ ] Form components (`MoneyField`, `DateField`, `StatusField`, `RelatedRecordField`) render consistently across both modules
- [ ] Offline mutations show error toast; create button disabled while offline (or shows immediate error)
- [ ] CASCADE_RULES.md exists

## Depends on

- 04 (Shell, AppRouter)
- 05 (Cache repos)
- 08 (EventKitMirror — for Project detail "Add to iOS Calendar" action)
