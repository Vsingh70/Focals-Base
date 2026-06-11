# Handoff: iOS Projects redesign (Lenslate)

> **For Claude Code.** Implements a redesign of the **Projects** module in the SwiftUI app at `ios/Focals/Modules/Projects/`, plus a small change to the shared `DetailSheet`. The prototype in this folder is an **HTML design reference** — recreate it in SwiftUI using the app's existing `FocalsDesign` tokens and shared components, not by porting HTML/CSS. Work top-to-bottom; everything you need is here.

---

## 1. What & why

Three changes, in priority order:

1. **Projects list → grouped "Cards" layout.** Today's list (`ProjectsScreen.swift`) is one flat, recency-sorted list with a cramped bolted-on filter row and dense rows (progress bar + % + date + location crammed together). Redesign it to **group by status pipeline** with clean **cards**.
2. **Project detail → scannable summary.** Today's detail (`ProjectDetailScreen.swift`) is a wall of form rows. Lead with a serif hero + a 3-tile summary (Shoot / Balance / Paid), then grouped sections.
3. **Edit/New form: "Save changes" → nav-bar "Done".** Today `ProjectForm.swift` has a big bottom **Save changes** button *and* `DetailSheet` shows a **Done** button that only dismisses. Consolidate: **Done performs the save**, add a leading **Cancel**, delete the bottom button. This is the native pattern and the user's explicit request.

The chosen list direction is **Cards** (the user compared three and picked it).

---

## 2. Design reference

Open **`iOS Projects.html`** in a browser. It's an interactive prototype (tap list → detail → edit). The **Tweaks** panel switches list layouts — **the target is "Cards."** Supporting files: `pdata.jsx` (data + status model + tokens), `patoms.jsx` (shared atoms), `plist.jsx` (the three list layouts — see `ListB`), `pdetail.jsx`, `pform.jsx`.

**Fidelity: High** for structure, spacing, and hierarchy. Use the **real** `FocalsDesign` tokens for color/spacing/radius/fonts — the HTML hardcodes their values but your SwiftUI must reference the tokens.

---

## 3. Tokens & components you already have

Reference these — don't introduce new colors or magic numbers.

- **Color:** `Color.tokens.{bg, bgSecondary, bgTertiary, border, borderSecondary, textPrimary, textSecondary, textTertiary, accent, success, warning, danger}` (`FocalsDesign/Color+Tokens.swift`).
- **Spacing:** `Spacing.{xs:4, sm:8, md:16, lg:24, xl:32}`. **Radius:** `Radius.{sm:4, md:8, lg:12}`.
- **Fonts:** `.tokens.body(_)` / `.tokens.medium(_)` / `.tokens.semibold(_)` (Inter); `.tokens.display(_)` (system **serif**, used by `editorialHeadline()`).
- **Components:** `StatusPill(_:tone:)`, `cardStyle()`, `editorialHeadline()`, `FormSection`, `FormRow`, `DateField`, `MoneyField`, `StatusField`, `RelatedRecordField`, `EmptyState`, `Haptics`, `DetailSheet`.
- **Status model** (`FocalsModels/Enums.swift`): `ProjectStatus = inquiry, booked, in_progress, editing, delivered, completed, cancelled`; `.displayName`. Pill tone via `ProjectStatus.calendarPillTone` (`ProjectStatus+Calendar.swift`), bar color via `.barColor`.

---

## 4. Status pipeline grouping (shared helper)

Add a grouping model both the list and (optionally) navigation can use. Create **`Modules/Projects/ProjectPipeline.swift`**:

```swift
import SwiftUI
import FocalsDesign
import FocalsModels

enum ProjectPhase: String, CaseIterable, Identifiable {
    case inquiry, upcoming, active, delivered, cancelled
    var id: String { rawValue }

    var title: String {
        switch self {
        case .inquiry:   return "Inquiries"
        case .upcoming:  return "Upcoming"
        case .active:    return "In progress"
        case .delivered: return "Delivered"
        case .cancelled: return "Cancelled"
        }
    }

    /// Colored tick beside the section header.
    var color: Color {
        switch self {
        case .inquiry:   return .tokens.textSecondary
        case .upcoming:  return .tokens.accent
        case .active:    return .tokens.warning
        case .delivered: return .tokens.success
        case .cancelled: return .tokens.danger
        }
    }

    static func of(_ status: ProjectStatus) -> ProjectPhase {
        switch status {
        case .inquiry:               return .inquiry
        case .booked:                return .upcoming
        case .inProgress, .editing:  return .active
        case .delivered, .completed: return .delivered
        case .cancelled:             return .cancelled
        }
    }
}
```

Group a filtered `[CachedProject]` by iterating `ProjectPhase.allCases` in order and selecting projects whose `ProjectPhase.of(status) == phase`; **skip empty phases**; render `.cancelled` last with reduced opacity.

---

## 5. Projects list — Cards (`ProjectsScreen.swift`)

Replace the `List` + `filterSection` with a `ScrollView` → `LazyVStack(spacing: Spacing.lg)` of grouped sections. Keep `.searchable` and the existing `+` toolbar `Menu` (New project / Import from file) unchanged. Keep swipe-to-delete behavior by attaching the existing context actions to a long-press/`contextMenu` (List swipe isn't available outside `List`; use a `contextMenu` with Delete + Cancel, or keep a `List` with `.listStyle(.plain)` and `listRowSeparator(.hidden)` + clear row backgrounds if you prefer swipe actions — either is acceptable, but the **cards + grouping** are the requirement).

**Section header** (`ProjectPhase`):
```swift
HStack(spacing: Spacing.sm) {
    RoundedRectangle(cornerRadius: 2)
        .fill(phase.color)
        .frame(width: 3, height: 13)
    Text(phase.title.uppercased())
        .font(.tokens.medium(12.5))
        .tracking(0.6)
        .foregroundStyle(Color.tokens.textSecondary)
    Text("\(items.count)")
        .font(.tokens.medium(12))
        .foregroundStyle(Color.tokens.textTertiary)
}
.padding(.top, Spacing.md)
.padding(.bottom, Spacing.xs + 1)
```

**Card** (one project — mirrors `ListB` in `plist.jsx`):
- Container: `padding(Spacing.md)`, `background(Color.tokens.bgSecondary)`, `RoundedRectangle(cornerRadius: 14)` border `Color.tokens.border` 0.5pt. `VStack(alignment:.leading, spacing: 9)`.
- **Row 1:** title `.tokens.semibold(16)` `textPrimary`, `lineLimit(1)`; spacer; `StatusPill(status.displayName, tone: status.calendarPillTone)`.
- **Row 2:** client name `.tokens.body(13)` `textSecondary` (or "—").
- **Payment (only if `packagePrice > 0`):** a 5pt rounded progress bar (track `bgTertiary`, fill `accent`, or `success` when `fraction >= 1`) over a row: left `"\(money(paid)) of \(money(price))"` `textSecondary 12`; right `fraction >= 1 ? "Paid in full" : "\(money(balance)) due"` in `success`/`warning`, `.tokens.medium(12)`.
- **Row 4 (meta):** `Label` pairs at `.tokens.body(12)` `textTertiary`: calendar + shoot date (`Mon, Jun 2 · 9:00 AM` style) when present; mappin + location (truncated) when present; if neither, a tag + category.
- Whole card is a `Button`/`NavigationLink` → `AppRouter.shared.navigate(to: .projectDetail(id))` with `Haptics.tap()`.
- `.cancelled` section: wrap its cards in `.opacity(0.6)`.

`money(_)` = `value.formatted(.currency(code: "USD").precision(.fractionLength(0)))`. `fraction` and `balance` exactly as in the current `ProjectListRow`.

Empty search → existing `EmptyState`.

---

## 6. Project detail (`ProjectDetailScreen.swift`)

Keep the toolbar **Edit** (pencil) → `AppRouter.shared.presentedSheet = .editProject(project)`, the delete confirmation dialog, the EventKit "Add to iOS Calendar" action, and the MapKit snapshot — all already correct. Restructure the scroll body to:

1. **Hero:** `Text(title).editorialHeadline()`, then an HStack of `StatusPill` + `"\(clientName ?? "No client") · \(category)"` `.tokens.body(14)` `textSecondary`.
2. **Summary tiles** — an `HStack(spacing: Spacing.sm)` of 3 equal tiles (`bgSecondary`, `border` 0.5pt, `cornerRadius 12`, `padding 12`), each a small uppercase label (`.tokens.medium(11)` `textTertiary`) over a value `.tokens.semibold(19)`:
   - **Shoot** — relative ("in 9d" / "Tomorrow" / past date), sub = short date or "Not scheduled".
   - **Balance** — `money(balance)`, colored `warning` if > 0 else `success`; sub "due"/"settled". "—" if no price.
   - **Paid** — a small ring (`Circle().trim(from:0,to:fraction).stroke(... accent/success, lineWidth 4)` rotated -90°, ~34pt) + `"\(Int(fraction*100))%"`.
3. **Payment** — keep the existing `FormSection("Payment")` rows (Package / Amount paid / Balance due colored / Status) + the progress bar.
4. **Details** — `FormSection("Details")`: Client (tappable → `clientDetail`, accent text + chevron), Category, Shoot date (full), Location (tappable → opens Maps, accent + chevron).
5. **Map** snapshot (existing `ProjectMapSnapshot`).
6. **Notes** (existing).
7. **Add to iOS Calendar** (existing, when shoot is in the future).
8. **Delete project** (existing destructive button).

Relative-date helper: compute from `CalendarMath.wallClockDate(from:)` vs `Date.now` (days difference → "Today"/"Tomorrow"/"in Nd"/short date).

---

## 7. ⭐ Save → Done (`DetailSheet.swift` + `ProjectForm.swift`)

**Step A — make `DetailSheet`'s Done actionable.** Extend it with an optional confirm action + a leading Cancel. This stays reusable for the app's other form sheets (Client, Gear, Transaction) that share the same pattern.

```swift
public struct DetailSheet<Content: View>: View {
    let title: String
    let confirmTitle: String
    let confirmDisabled: Bool
    let isWorking: Bool
    let onConfirm: (() -> Void)?      // nil → Done simply dismisses (legacy behavior)
    let content: () -> Content

    @Environment(\.dismiss) private var dismiss

    public init(
        title: String,
        confirmTitle: String = "Done",
        confirmDisabled: Bool = false,
        isWorking: Bool = false,
        onConfirm: (() -> Void)? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.title = title; self.confirmTitle = confirmTitle
        self.confirmDisabled = confirmDisabled; self.isWorking = isWorking
        self.onConfirm = onConfirm; self.content = content
    }

    public var body: some View {
        NavigationStack {
            content()
                .navigationTitle(title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    if onConfirm != nil {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("Cancel") { dismiss() }
                        }
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        if isWorking {
                            ProgressView()
                        } else if let onConfirm {
                            Button(confirmTitle, action: onConfirm)
                                .fontWeight(.semibold)
                                .disabled(confirmDisabled)
                        } else {
                            Button("Done") { dismiss() }   // unchanged for other callers
                        }
                    }
                }
        }
        .presentationDetents([.large])
        .presentationBackground(Color.tokens.bgSecondary)
        .presentationDragIndicator(.visible)
    }
}
```
(Existing call sites pass no `onConfirm`, so they keep today's dismiss-only Done — no migration needed.)

**Step B — `ProjectForm.swift`:** drive the save from `DetailSheet`'s Done and **delete the bottom button**.

- Wrap the form's content with the new params:
```swift
DetailSheet(
    title: isEdit ? "Edit project" : "New project",
    confirmTitle: isEdit ? "Done" : "Add",
    confirmDisabled: !isValid,
    isWorking: isSaving,
    onConfirm: { Task { await save() } }
) {
    ScrollView { … the field sections … }
        .background(Color.tokens.bg)
}
```
- **Remove** the entire trailing `Button { Task { await save() } } label: { … "Save changes" / "Create project" … }` block and its `.buttonStyle/.tint/.disabled`. The inline error `Text` can stay (or move it above the first section).
- `save()` is unchanged — it already validates, writes via `ProjectsCacheRepository`, fires `Haptics.success()`, and calls `dismiss()` on success.
- Keep the form sections as-is (`FormSection` Basics / Payment / Notes with `RelatedRecordField`, `StatusField`, `DateField`, `MoneyField`). Optional polish to match the prototype: render **Payment status** as a segmented `Picker(.segmented)` (Unpaid/Partial/Paid) instead of the menu-style `StatusField`.

**Acceptance:** opening Edit shows **Cancel** (left) and a bold **Done** (right, disabled until Title is non-empty); tapping Done saves, shows a spinner, then dismisses to the updated detail. There is **no** bottom save button.

---

## 8. Checklist

- [ ] `ProjectPhase` helper added; list groups by phase, empty phases hidden, Cancelled last at 0.6 opacity.
- [ ] List renders **cards** (status pill, client, payment bar + balance, date/location meta); `.searchable` and `+` menu intact; delete still reachable.
- [ ] Detail leads with serif hero + 3 summary tiles, then Payment / Details / Map / Notes / actions / delete.
- [ ] `DetailSheet` extended with `onConfirm`/`Cancel`; existing callers unaffected.
- [ ] `ProjectForm` saves via nav-bar **Done**; bottom "Save changes" button removed; Cancel present; Done disabled until valid; spinner while saving.
- [ ] Build + run; create, edit, delete, and search a project; verify haptics and navigation.

---

## 9. Files in this bundle
- `iOS Projects.html` — interactive design reference (set Tweaks → **Cards**).
- `pdata.jsx`, `patoms.jsx`, `plist.jsx`, `pdetail.jsx`, `pform.jsx` — reference source (Cards = `ListB` in `plist.jsx`).
- `ios-frame.jsx`, `tweaks-panel.jsx` — prototype scaffolding (ignore for the SwiftUI build).
- `README.md` — this plan.
