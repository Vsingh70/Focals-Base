# Task 07 — Inquiry Inbox

## Goal

Build the inquiry inbox: status-grouped list with swipe actions, detail sheet, manual create flow, filter bar, and the convert-to-client/project workflow that mirrors the web's `convertInquiry` server action. After this task, every inquiry hitting `/api/inquiry` from the embeddable widget shows up here on iOS.

Reference: [my-app/src/app/(dashboard)/inbox/page.jsx](../../my-app/src/app/(dashboard)/inbox/page.jsx) and [my-app/src/lib/actions/inquiries.ts](../../my-app/src/lib/actions/inquiries.ts).

---

## Layout

```
┌──────────────────────────────────────────┐
│ ← Inbox                       [⊕] [⌕]    │
│ ──────────────────────────────────────── │
│ [All] [New] [Responding] [Quoted] …      │   ← filter chips
│ ──────────────────────────────────────── │
│ NEW                                       │   ← section by status
│  • Sarah J     wedding • 2d ago           │
│  • Mike R      portrait • yesterday       │
│ RESPONDING                                │
│  • Alex T      family • 4d ago            │
│ QUOTED                                    │
│  …                                        │
└──────────────────────────────────────────┘
```

Pull-to-refresh. Skeleton on first launch. Empty state when zero inquiries.

---

## Step 1 — `InquiryStatusGroup`

Helper for grouping cached inquiries by status, in the canonical order:

```swift
public enum InquiryStatusGroup: String, CaseIterable, Hashable {
    case new, responding, quoted, booked, lost
    public var label: String { rawValue.capitalized }
    public var tone: StatusPill.Tone {
        switch self {
        case .new:        return .accent
        case .responding: return .warning
        case .quoted:     return .accent
        case .booked:     return .success
        case .lost:       return .neutral
        }
    }
}

extension Array where Element == Inquiry {
    func grouped() -> [(InquiryStatusGroup, [Inquiry])] {
        InquiryStatusGroup.allCases.compactMap { group in
            let items = filter { $0.status.rawValue == group.rawValue }
                .sorted { $0.createdAt > $1.createdAt }
            return items.isEmpty ? nil : (group, items)
        }
    }
}
```

## Step 2 — `InboxScreen`

```swift
struct InboxScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedInquiry.createdAt, order: .reverse) private var cached: [CachedInquiry]

    @State private var filter: Filter = .all
    @State private var search = ""

    enum Filter: Hashable { case all, status(InquiryStatusGroup) }

    var body: some View {
        List {
            ForEach(filtered.grouped(), id: \.0) { group, inquiries in
                Section {
                    ForEach(inquiries) { inquiry in
                        InquiryRow(inquiry: inquiry)
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                swipeButtons(for: inquiry)
                            }
                            .onTapGesture {
                                Haptics.tap()
                                AppRouter.shared.navigate(to: .inquiryDetail(inquiry.id))
                            }
                    }
                } header: {
                    StatusPill(group.label, tone: group.tone)
                        .padding(.vertical, Spacing.xs)
                }
            }
        }
        .listStyle(.plain)
        .background(Color.tokens.bg)
        .searchable(text: $search, prompt: "Search inquiries")
        .toolbar {
            ToolbarItem(placement: .topBarLeading) { filterMenu }
            ToolbarItem(placement: .topBarTrailing) {
                Button(action: { AppRouter.shared.presentedSheet = .createInquiry }) {
                    Image(systemName: "plus")
                }
            }
        }
        .refreshable {
            try? await InquiriesCacheRepository.shared.refresh(in: context)
        }
        .navigationTitle("Inbox")
        .overlay {
            if cached.isEmpty {
                EmptyState(
                    symbol: "tray",
                    title: "No inquiries yet",
                    body: "Inquiries from your widget, email, and Zapier will appear here."
                )
            }
        }
    }

    private var filtered: [Inquiry] {
        cached.map { $0.toModel() }.filter { inquiry in
            let matchesFilter: Bool
            switch filter {
            case .all: matchesFilter = true
            case .status(let g): matchesFilter = inquiry.status.rawValue == g.rawValue
            }
            let matchesSearch = search.isEmpty ||
                inquiry.name.localizedCaseInsensitiveContains(search) ||
                (inquiry.email ?? "").localizedCaseInsensitiveContains(search) ||
                (inquiry.message ?? "").localizedCaseInsensitiveContains(search)
            return matchesFilter && matchesSearch
        }
    }
}
```

## Step 3 — `InquiryRow`

```swift
struct InquiryRow: View {
    let inquiry: Inquiry
    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            HStack {
                Text(inquiry.name)
                    .font(.tokens.medium(15))
                    .foregroundStyle(.tokens.textPrimary)
                Spacer()
                Text(relativeDate(inquiry.createdAt))
                    .font(.tokens.body(12))
                    .foregroundStyle(.tokens.textTertiary)
            }
            HStack(spacing: Spacing.xs) {
                if let type = inquiry.shootType {
                    Text(type)
                        .font(.tokens.body(12))
                        .foregroundStyle(.tokens.textSecondary)
                }
                if let source = inquiry.source {
                    Text("via \(source)")
                        .font(.tokens.body(12))
                        .foregroundStyle(.tokens.textTertiary)
                }
            }
            if let message = inquiry.message {
                Text(message)
                    .font(.tokens.body(13))
                    .foregroundStyle(.tokens.textSecondary)
                    .lineLimit(2)
            }
        }
        .padding(.vertical, Spacing.xs)
    }
}
```

## Step 4 — Swipe actions

```swift
@ViewBuilder
private func swipeButtons(for inquiry: Inquiry) -> some View {
    Button {
        Haptics.medium()
        Task { try? await markStatus(inquiry, .responding) }
    } label: {
        Label("Mark replied", systemImage: "envelope.open")
    }.tint(.tokens.warning)

    Button(role: .destructive) {
        Task { try? await delete(inquiry) }
    } label: {
        Label("Delete", systemImage: "trash")
    }
}
```

`markStatus` calls `InquiriesCacheRepository.shared.update(...)`. Handle offline with the standard `FocalsAPIError.offline` toast pattern from Task 04.

## Step 5 — Detail sheet

`InquiryDetailScreen` shown via `routeDestination(.inquiryDetail(id))` (pushed onto the Inbox tab's stack). Layout:

- Name + status pill at top
- Contact: email, phone (with tap-to-call/email)
- Shoot type, preferred date, message body
- Source line (`via website` etc.)
- Source meta JSON pretty-printed under a `DisclosureGroup("Raw payload")`
- Action row: **Convert to Client / Project**, **Mark contacted**, **Delete**

```swift
struct InquiryDetailScreen: View {
    let id: UUID
    @Environment(\.modelContext) private var context
    @State private var inquiry: Inquiry?
    @State private var converting = false

    var body: some View {
        ScrollView {
            // ... content
            Button {
                Task { await convert() }
            } label: {
                Label("Convert to Client + Project", systemImage: "person.fill.badge.plus")
                    .frame(maxWidth: .infinity, minHeight: 50)
            }
            .buttonStyle(.borderedProminent)
            .tint(.tokens.accent)
            .disabled(converting)
        }
        .navigationTitle("Inquiry")
    }

    private func convert() async {
        converting = true
        defer { converting = false }
        guard let inquiry else { return }
        do {
            try await InquiriesCacheRepository.shared.convert(
                inquiry,
                creatingProject: true,
                in: context
            )
            Haptics.success()
            AppRouter.shared.navigate(toPop: 1)
        } catch {
            Haptics.error()
            // surface error toast
        }
    }
}
```

## Step 6 — `convert` in `InquiriesCacheRepository`

```swift
public func convert(_ inquiry: Inquiry, creatingProject: Bool, in context: ModelContext) async throws {
    if ConnectivityMonitor.shared.isOffline { throw FocalsAPIError.offline }

    // 1. Create client
    let client = Client(
        id: UUID(),
        userId: inquiry.userId,
        fullName: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        notes: nil,
        source: inquiry.source,
        createdAt: .now,
        updatedAt: .now
    )
    let savedClient = try await ClientsCacheRepository.shared.create(client, in: context)

    // 2. Optionally create project
    var projectId: UUID? = nil
    if creatingProject {
        let project = Project(
            id: UUID(),
            userId: inquiry.userId,
            clientId: savedClient.id,
            title: "\(inquiry.shootType ?? "New") for \(savedClient.fullName)",
            status: .lead,
            paymentStatus: .unpaid,
            shootDate: inquiry.preferredDate,
            // ... rest
        )
        let savedProject = try await ProjectsCacheRepository.shared.create(project, in: context)
        projectId = savedProject.id
    }

    // 3. Update inquiry: status booked + foreign keys
    var updated = inquiry
    updated.status = .booked
    updated.convertedClientId = savedClient.id
    updated.convertedProjectId = projectId
    _ = try await InquiriesCacheRepository.shared.update(updated, in: context)
}
```

This mirrors the web's [convertInquiry server action](../../my-app/src/lib/actions/inquiries.ts) — same DB writes, same final state.

## Step 7 — Manual create form

`CreateInquirySheet`. Fields match the public `/api/inquiry` body shape:
- Name (required)
- Email
- Phone
- Shoot type (picker with same options as web's widget)
- Preferred date (date picker, optional)
- Message (multi-line text editor)
- Source (defaults to "manual" — read-only)

On save: `InquiriesCacheRepository.shared.create(...)`. The server-side trigger that auto-fires the inbox notification (Task 13) will see this row.

---

## Acceptance Criteria

- [ ] Inbox shows all inquiries grouped by status in canonical order (new → responding → quoted → booked → lost)
- [ ] Filter chips switch to a single-status view; "All" returns to grouped
- [ ] Search filters by name, email, message content
- [ ] Swipe-left on a row reveals "Mark replied" + "Delete"
- [ ] Tap a row → detail screen with full body
- [ ] "Convert" creates client + project + updates inquiry to booked atomically (verified in DB after the call)
- [ ] After convert, navigating to `/clients` (Task 09) shows the new client; `/projects` shows the new project
- [ ] Manual create form round-trips to DB
- [ ] Offline: list renders cached data; create shows offline error toast
- [ ] Pull-to-refresh fires `InquiriesCacheRepository.refresh`
- [ ] Empty state when no inquiries
- [ ] Inquiry inserted via `/api/inquiry` from the web widget shows up after pull-to-refresh

## Depends on

- 04 (Shell, sheet infrastructure)
- 05 (`InquiriesCacheRepository`, `ClientsCacheRepository`, `ProjectsCacheRepository`)
