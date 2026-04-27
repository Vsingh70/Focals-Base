# Task 08 — Calendar

## Goal

Build the iOS-style stacked-month calendar with **pixel parity** to the web's [MobileCalendarView.tsx](../../my-app/src/components/calendar/MobileCalendarView.tsx), plus EventKit two-way mirror so shoots flow into the user's iOS Calendar. After this task, opening Calendar shows the same scrollable month grid as the mobile web, tapping a day reveals that day's shoots, creating/updating shoots can mirror to iOS Calendar, and users can subscribe to the existing iCal feed for read-only sync.

The MobileCalendarView is the **mandatory visual reference** — every dimension, color, font, and animation should match. Side-by-side screenshots are the acceptance test.

---

## Layout

```
┌──────────────────────────────────────────┐
│ ← Calendar                    [Today][⊕] │
│ ──────────────────────────────────────── │
│ ◤  February 2026                        │
│ M  T  W  T  F  S  S                     │
│       1  2  3  4  5                     │
│ 6  7  8  9  10 11 12                    │
│ 13 14 15 16 17 18 19  ← tapped day      │
│ ┌──────────────────────────────────────┐│
│ │ Feb 17 — 2 shoots                    ││  ← inline detail panel
│ │ • 09:00 Sarah J Wedding • Studio A   ││
│ │ • 14:00 Mike R Portrait • Outdoor    ││
│ └──────────────────────────────────────┘│
│ 20 21 22 23 24 25 26                    │
│ 27 28                                   │
│ ◤  March 2026                           │
│ M  T  W  T  F  S  S                     │
│ ...                                     │
└──────────────────────────────────────────┘
```

12-month window: 2 past + current + 9 forward (matching web). Auto-scroll to current month on first appearance. Up to 3 colored bars per day under the day number (one per shoot, color = status tone).

---

## Step 1 — Calendar math helpers

Port the helpers from `MobileCalendarView.tsx` lines 30–60 verbatim. Create `ios/Focals/Modules/Calendar/CalendarMath.swift`:

```swift
import Foundation

public enum CalendarMath {
    public static let monthsBack = 2
    public static let monthsForward = 9
    public static let weekdayHeaders = ["M", "T", "W", "T", "F", "S", "S"]

    /// Returns 6×7 = 42 day cells for a given month, including leading days from
    /// the previous month and trailing days from the next month so the grid always
    /// fills exactly 6 rows. Week starts on Monday.
    public static func buildMonthCells(year: Int, month: Int) -> [Date] {
        var components = DateComponents(year: year, month: month, day: 1)
        let cal = Calendar(identifier: .gregorian)
        guard let firstOfMonth = cal.date(from: components) else { return [] }
        // JS getDay: Sun=0; Apple weekday: Sun=1. Apple's "weekday-1" → 0..6 Sun-Sat.
        // Want Monday-start, so shift: Mon=0, Sun=6.
        let weekday = cal.component(.weekday, from: firstOfMonth) // 1=Sun, 2=Mon, ... 7=Sat
        let offset = (weekday + 5) % 7                            // Mon=0, Sun=6
        components.day = 1 - offset
        guard let start = cal.date(from: components) else { return [] }
        return (0..<42).compactMap { i in
            cal.date(byAdding: .day, value: i, to: start)
        }
    }

    public static func dayKey(_ date: Date) -> String {
        let cal = Calendar(identifier: .gregorian)
        let y = cal.component(.year, from: date)
        let m = cal.component(.month, from: date)
        let d = cal.component(.day, from: date)
        return String(format: "%04d-%02d-%02d", y, m, d)
    }

    public static func monthKey(_ date: Date) -> String {
        let cal = Calendar(identifier: .gregorian)
        return String(format: "%04d-%02d", cal.component(.year, from: date), cal.component(.month, from: date))
    }

    public static func monthRange(now: Date = .now) -> [(year: Int, month: Int)] {
        let cal = Calendar(identifier: .gregorian)
        let nowYear = cal.component(.year, from: now)
        let nowMonth = cal.component(.month, from: now)
        return (-monthsBack...monthsForward).map { offset -> (Int, Int) in
            var c = DateComponents(year: nowYear, month: nowMonth)
            c.month! += offset
            let date = cal.date(from: c)!
            return (cal.component(.year, from: date), cal.component(.month, from: date))
        }
    }
}
```

Test against the web's behavior with at least 5 fixture months including DST transitions and February of a leap year.

## Step 2 — Status → color tone

Match `STATUS_BAR_COLOR` in MobileCalendarView.tsx:

```swift
extension ShootStatus {
    var barColor: Color {
        switch self {
        case .scheduled:   return .tokens.accent
        case .completed:   return .tokens.success
        case .cancelled:   return .tokens.danger
        case .rescheduled: return .tokens.warning
        }
    }
    var pillTone: StatusPill.Tone {
        switch self {
        case .scheduled:   return .accent
        case .completed:   return .success
        case .cancelled:   return .danger
        case .rescheduled: return .warning
        }
    }
}
```

## Step 3 — Day cell view

```swift
struct DayCell: View {
    let date: Date
    let isInMonth: Bool
    let isToday: Bool
    let isSelected: Bool
    let shoots: [Shoot]              // shoots on this day, max 3 bars rendered

    var body: some View {
        VStack(spacing: 2) {
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.tokens.medium(13))
                .foregroundStyle(numberColor)
                .padding(4)
                .background(isToday ? Color.tokens.accent : .clear)
                .clipShape(Circle())
            VStack(spacing: 2) {
                ForEach(shoots.prefix(3)) { shoot in
                    Capsule()
                        .fill(shoot.status.barColor)
                        .frame(height: 3)
                }
            }
            .frame(maxWidth: .infinity)
            Spacer(minLength: 0)
        }
        .frame(height: 56)
        .frame(maxWidth: .infinity)
        .background(isSelected ? Color.tokens.bgTertiary : .clear)
        .clipShape(RoundedRectangle(cornerRadius: Radius.sm))
        .contentShape(Rectangle())
    }

    private var numberColor: Color {
        if isToday { return .tokens.bg }                  // contrast on accent fill
        if !isInMonth { return .tokens.textTertiary.opacity(0.4) }
        return .tokens.textPrimary
    }
}
```

## Step 4 — Month section

```swift
struct MonthSection: View {
    let year: Int
    let month: Int
    let shootsByDay: [String: [Shoot]]   // key: dayKey(date)
    @Binding var selectedDay: Date?

    private var monthName: String {
        var c = DateComponents(year: year, month: month, day: 1)
        let date = Calendar.current.date(from: c)!
        return date.formatted(.dateTime.month(.wide).year())
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(monthName)
                .font(.tokens.display(20))
                .foregroundStyle(.tokens.textPrimary)
                .padding(.horizontal, Spacing.md)
                .padding(.top, Spacing.lg)

            HStack(spacing: 0) {
                ForEach(CalendarMath.weekdayHeaders, id: \.self) { wd in
                    Text(wd)
                        .font(.tokens.body(11))
                        .foregroundStyle(.tokens.textTertiary)
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, Spacing.sm)

            let cells = CalendarMath.buildMonthCells(year: year, month: month)
            LazyVGrid(columns: Array(repeating: .init(.flexible(), spacing: 0), count: 7), spacing: 0) {
                ForEach(cells, id: \.self) { date in
                    DayCell(
                        date: date,
                        isInMonth: Calendar.current.component(.month, from: date) == month,
                        isToday: Calendar.current.isDateInToday(date),
                        isSelected: selectedDay.map { Calendar.current.isDate($0, inSameDayAs: date) } ?? false,
                        shoots: shootsByDay[CalendarMath.dayKey(date)] ?? []
                    )
                    .onTapGesture {
                        Haptics.tap()
                        selectedDay = date
                    }
                }
            }
            .padding(.horizontal, Spacing.sm)
        }
    }
}
```

## Step 5 — Inline day detail panel

Web puts the detail panel **inline below the tapped row's week**. iOS replicates: when `selectedDay` is set, render a panel below the section it belongs to with that day's shoots. Keep selection sticky as the user scrolls; clicking a day in another month moves the selection.

```swift
struct DayDetailPanel: View {
    let date: Date
    let shoots: [Shoot]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(date.formatted(.dateTime.weekday(.wide).month(.abbreviated).day()))
                .font(.tokens.medium(15))
                .foregroundStyle(.tokens.textPrimary)
            if shoots.isEmpty {
                Text("No shoots scheduled")
                    .font(.tokens.body(13))
                    .foregroundStyle(.tokens.textTertiary)
            } else {
                ForEach(shoots) { shoot in
                    Button {
                        AppRouter.shared.presentedSheet = .shootDetail(shoot)
                    } label: {
                        HStack(spacing: Spacing.sm) {
                            VStack(alignment: .leading) {
                                Text(timeString(shoot.scheduledAt))
                                    .font(.tokens.medium(13))
                                Text(shoot.title)
                                    .font(.tokens.body(13))
                                    .foregroundStyle(.tokens.textSecondary)
                            }
                            Spacer()
                            StatusPill(shoot.status.rawValue.capitalized, tone: shoot.status.pillTone)
                        }
                        .padding(Spacing.sm)
                        .background(Color.tokens.bg)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.sm))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(Spacing.md)
        .background(Color.tokens.bgSecondary)
        .clipShape(RoundedRectangle(cornerRadius: Radius.md))
        .padding(.horizontal, Spacing.md)
    }
}
```

## Step 6 — `CalendarScreen` with auto-scroll

```swift
struct CalendarScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedShoot.scheduledAt, order: .forward) private var cached: [CachedShoot]

    @State private var selectedDay: Date? = .now

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 0, pinnedViews: []) {
                    ForEach(CalendarMath.monthRange(), id: \.month) { ym in
                        MonthSection(
                            year: ym.year,
                            month: ym.month,
                            shootsByDay: shootsByDay(forMonth: ym),
                            selectedDay: $selectedDay
                        )
                        .id("\(ym.year)-\(ym.month)")
                        if shouldRenderDetail(forMonth: ym) {
                            DayDetailPanel(
                                date: selectedDay!,
                                shoots: shootsForDay(selectedDay!)
                            )
                        }
                    }
                }
                .padding(.bottom, Spacing.xxl)
            }
            .background(Color.tokens.bg)
            .navigationTitle("Calendar")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Today") {
                        let now = Date.now
                        selectedDay = now
                        let cal = Calendar.current
                        proxy.scrollTo("\(cal.component(.year, from: now))-\(cal.component(.month, from: now))", anchor: .top)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { AppRouter.shared.presentedSheet = .createShoot(presetDate: selectedDay) }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .task {
                try? await ShootsCacheRepository.shared.refresh(in: context)
                let cal = Calendar.current
                let now = Date.now
                proxy.scrollTo("\(cal.component(.year, from: now))-\(cal.component(.month, from: now))", anchor: .top)
            }
            .refreshable {
                try? await ShootsCacheRepository.shared.refresh(in: context)
            }
        }
    }
}
```

## Step 7 — EventKit mirror

Create `ios/Focals/Modules/Calendar/EventKitMirror.swift`:

```swift
import EventKit
import FocalsModels

@MainActor
public final class EventKitMirror {
    public static let shared = EventKitMirror()
    private let store = EKEventStore()

    public var isEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "EventKitMirrorEnabled") }
        set {
            UserDefaults.standard.set(newValue, forKey: "EventKitMirrorEnabled")
            if newValue {
                Task { try? await ensureCalendarExists() }
            }
        }
    }

    public func requestAccess() async throws {
        if #available(iOS 17.0, *) {
            try await store.requestFullAccessToEvents()
        } else {
            try await withCheckedThrowingContinuation { cont in
                store.requestAccess(to: .event) { granted, error in
                    if granted { cont.resume() }
                    else { cont.resume(throwing: error ?? FocalsAPIError.auth(message: "Calendar access denied")) }
                }
            }
        }
    }

    public func mirror(_ shoot: Shoot) async throws {
        guard isEnabled else { return }
        let calendar = try await ensureCalendarExists()

        let existing = findEvent(for: shoot, in: calendar)
        let event = existing ?? EKEvent(eventStore: store)
        event.calendar = calendar
        event.title = shoot.title
        event.startDate = shoot.scheduledAt
        event.endDate = shoot.scheduledAt.addingTimeInterval(TimeInterval(60 * (shoot.durationMinutes ?? 90)))
        event.location = shoot.location
        event.notes = shoot.notes
        // Stable identifier so we can update later
        event.url = URL(string: "focals://shoot/\(shoot.id.uuidString)")

        try store.save(event, span: .thisEvent)
    }

    public func remove(_ shoot: Shoot) async throws {
        guard isEnabled else { return }
        let calendar = try await ensureCalendarExists()
        if let event = findEvent(for: shoot, in: calendar) {
            try store.remove(event, span: .thisEvent)
        }
    }

    @discardableResult
    private func ensureCalendarExists() async throws -> EKCalendar {
        try await requestAccess()
        if let existing = store.calendars(for: .event).first(where: { $0.title == "[APP_NAME]" }) {
            return existing
        }
        let new = EKCalendar(for: .event, eventStore: store)
        new.title = "[APP_NAME]"
        new.cgColor = UIColor(named: "BrandAccent")?.cgColor
        new.source = store.defaultCalendarForNewEvents?.source
            ?? store.sources.first { $0.sourceType == .calDAV }
            ?? store.sources.first { $0.sourceType == .local }!
        try store.saveCalendar(new, commit: true)
        return new
    }

    private func findEvent(for shoot: Shoot, in calendar: EKCalendar) -> EKEvent? {
        let url = "focals://shoot/\(shoot.id.uuidString)"
        let predicate = store.predicateForEvents(
            withStart: shoot.scheduledAt.addingTimeInterval(-86400),
            end: shoot.scheduledAt.addingTimeInterval(86400),
            calendars: [calendar]
        )
        return store.events(matching: predicate).first(where: { $0.url?.absoluteString == url })
    }
}
```

Hook into `ShootsCacheRepository.create/update/delete` so every successful mutation also fires `EventKitMirror.shared.mirror(saved)` (or `remove` on delete) when the toggle is on.

Add an `Info.plist` key:

```xml
<key>NSCalendarsUsageDescription</key>
<string>[APP_NAME] mirrors your scheduled shoots to a dedicated calendar so they show up in the iOS Calendar app.</string>
```

(In iOS 17+, also `NSCalendarsFullAccessUsageDescription` if using `requestFullAccessToEvents`.)

## Step 8 — iCal subscription helper

In Settings (Task 12), expose a "Subscribe in Apple Calendar" button that deep-links to:

```
webcal://focals-base.vercel.app/api/calendar/<userId>?token=<calendar_token>
```

Tapping the link from the system Calendar app prompts the user to add a read-only subscription. This is the lowest-friction way to get shoots into the system calendar without the EventKit mirror.

```swift
Button("Subscribe in Apple Calendar") {
    let url = profile.calendarFeedURL.replacingOccurrences(of: "https://", with: "webcal://")
    UIApplication.shared.open(URL(string: url)!)
}
```

The Settings UI offers both: webcal subscription (read-only, server-driven) **and** EventKit mirror (read-write, app-driven). Document the difference.

## Step 9 — Conflict policy

Document in `EventKitMirror.swift`:

> EventKit is a one-way mirror in v1. Truth lives in Supabase. If the user edits the iOS Calendar event directly, those changes are NOT pushed back. v1.1 plan: detect divergence in `EKEventStoreChanged` notifications and surface a "Push back to [APP_NAME]?" banner.

---

## Acceptance Criteria

- [ ] Visual parity with `MobileCalendarView.tsx` verified by side-by-side screenshots on iPhone 15 simulator at the same DPI
- [ ] 12 months render: 2 past + current + 9 forward
- [ ] Auto-scrolls to current month on first appearance and on "Today" button
- [ ] Day with shoots renders up to 3 colored bars matching status tones
- [ ] Tapping a day shows the inline detail panel below that month section
- [ ] Tapping a shoot in the panel opens the shoot detail sheet (`AppRouter.shared.presentedSheet = .shootDetail(...)`)
- [ ] "+" button creates a shoot pre-populated with `selectedDay`
- [ ] Toggling EventKit mirror in Settings + creating a shoot creates an event in a "[APP_NAME]" calendar visible in the iOS Calendar app
- [ ] Updating that shoot updates the EventKit event (verified by checking startDate/title in iOS Calendar)
- [ ] Deleting the shoot removes the EventKit event
- [ ] EventKit permission denial shows actionable "Open Settings" message
- [ ] "Subscribe in Apple Calendar" button (Settings) deep-links to the webcal:// URL
- [ ] DST and leap-year transitions render correctly (test February in a leap year, end of March/October)

## Depends on

- 04 (Shell, sheet infrastructure)
- 05 (`ShootsCacheRepository`)
