# Task 06 — Dashboard

## Goal

Build the native dashboard with KPI cards, revenue chart, project status donut, upcoming projects strip, and quick actions. Numbers must match the web `/` for the same account exactly. After this task, opening the app to a signed-in state shows a real, useful dashboard.

Reference: [my-app/src/app/(dashboard)/page.jsx](../../my-app/src/app/(dashboard)/page.jsx).

---

## Layout

```
┌──────────────────────────────────────────┐
│ Greeting: "Good morning, Alex"           │
├──────────────────────────────────────────┤
│ KPI Row (2×2 grid on iPhone, 4×1 on iPad)│
│  Revenue MTD │ Active Projects           │
│  Upcoming    │ Pending $                 │
├──────────────────────────────────────────┤
│ Revenue Chart (6 months, BarMark)        │
├──────────────────────────────────────────┤
│ Project Status Donut (SectorMark)        │
├──────────────────────────────────────────┤
│ Upcoming Projects (next 7 days, hScroll) │
├──────────────────────────────────────────┤
│ Quick Actions                            │
│  [+ Project] [+ Inquiry] [+ Expense]     │
└──────────────────────────────────────────┘
```

Pull-to-refresh on the outer ScrollView. Skeleton loading on first launch.

---

## Step 1 — `DashboardCalculations`

Extract aggregate calculations into `ios/FocalsKit/Sources/FocalsAPI/DashboardCalculations.swift` with **unit tests**. The numbers must match the web — the only safe way is shared formulas that have a tested fixture.

```swift
import Foundation
import FocalsModels

public struct DashboardSnapshot: Sendable {
    public let revenueMTD: Decimal
    public let activeProjects: Int
    public let upcomingProjects: Int
    public let pendingRevenue: Decimal           // package_price - amount_paid for projects in payment_status != paid
    public let revenueByMonth: [(Date, Decimal)] // last 6 months
    public let projectStatusBreakdown: [(ProjectStatus, Int)]
    public let nextSevenDaysProjects: [Project]
}

public enum DashboardCalculations {
    public static func snapshot(
        projects: [Project],
        finances: [Finance],
        now: Date = .now
    ) -> DashboardSnapshot {
        // 1) Revenue MTD: sum finances where type == income AND date in current month.
        //    NOTE: the web's sync_project_income trigger auto-creates an income row
        //    for every project with amount_paid > 0, so this single query covers
        //    both manually-logged income and project payments.
        // 2) Active projects: count where status in [inquiry, booked, in_progress, editing]
        // 3) Upcoming projects: count where shoot_date BETWEEN now AND now + 7 days
        // 4) Pending $: sum (package_price - amount_paid) where payment_status in [unpaid, partial]
        // 5) Revenue by month: 6 months back, grouped by Calendar.startOfMonth
        // 6) Project status breakdown: count grouped by status
        // 7) Next 7 days projects: shoot_date filtered + sorted ascending
        // ... formulas mirror my-app/src/lib/queries/dashboard.ts exactly
    }
}
```

Test with at least 10 fixture cases under `FocalsTests/DashboardCalculationsTests.swift`. Compare against web by:
1. Logging in to web
2. Reading the rendered KPI numbers
3. Dumping the same account's data via SQL
4. Asserting the iOS calculation produces identical numbers

## Step 2 — `KPICard` view

Reusable component in `ios/Focals/Shared/KPICard.swift`:

```swift
import SwiftUI
import Charts
import FocalsDesign

public struct KPICard: View {
    let label: String
    let value: String
    let trend: [Double]?           // sparkline data
    let trendColor: Color

    public init(label: String, value: String, trend: [Double]? = nil, trendColor: Color = .tokens.accent) {
        self.label = label
        self.value = value
        self.trend = trend
        self.trendColor = trendColor
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(.tokens.body(11))
                .textCase(.uppercase)
                .tracking(0.7)
                .foregroundStyle(.tokens.textTertiary)
            Text(value)
                .font(.tokens.display(28))
                .foregroundStyle(.tokens.textPrimary)
            if let trend, trend.count > 1 {
                Chart(Array(trend.enumerated()), id: \.offset) { idx, value in
                    LineMark(
                        x: .value("Index", idx),
                        y: .value("Value", value)
                    )
                    .foregroundStyle(trendColor)
                    .interpolationMethod(.monotone)
                }
                .chartYAxis(.hidden)
                .chartXAxis(.hidden)
                .frame(height: 28)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
    }
}
```

## Step 3 — Revenue chart

```swift
struct RevenueChart: View {
    let data: [(Date, Decimal)]
    var body: some View {
        Chart(data, id: \.0) { date, amount in
            BarMark(
                x: .value("Month", date, unit: .month),
                y: .value("Revenue", NSDecimalNumber(decimal: amount).doubleValue)
            )
            .foregroundStyle(Color.tokens.accent.gradient)
            .cornerRadius(Radius.sm)
        }
        .chartXAxis {
            AxisMarks(values: .stride(by: .month)) { value in
                AxisValueLabel(format: .dateTime.month(.abbreviated))
                    .foregroundStyle(.tokens.textTertiary)
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading) { _ in
                AxisGridLine().foregroundStyle(.tokens.border)
                AxisValueLabel().foregroundStyle(.tokens.textTertiary)
            }
        }
        .frame(height: 180)
        .padding(.vertical, Spacing.md)
        .cardStyle()
    }
}
```

## Step 4 — Project status donut

```swift
struct ProjectStatusDonut: View {
    let breakdown: [(ProjectStatus, Int)]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Projects by status")
                .font(.tokens.medium(13))
                .foregroundStyle(.tokens.textSecondary)
            HStack {
                Chart(breakdown, id: \.0) { status, count in
                    SectorMark(
                        angle: .value("Count", count),
                        innerRadius: .ratio(0.6),
                        angularInset: 2
                    )
                    .foregroundStyle(by: .value("Status", status.rawValue))
                    .cornerRadius(2)
                }
                .chartLegend(.hidden)
                .frame(width: 120, height: 120)
                Spacer()
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    ForEach(breakdown, id: \.0) { status, count in
                        HStack {
                            Circle().fill(color(for: status)).frame(width: 8, height: 8)
                            Text(status.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                                .font(.tokens.body(13))
                                .foregroundStyle(.tokens.textSecondary)
                            Spacer()
                            Text("\(count)").font(.tokens.medium(13))
                        }
                    }
                }
            }
        }
        .cardStyle()
    }
    private func color(for status: ProjectStatus) -> Color { /* map status to brand colors */ }
}
```

## Step 5 — Upcoming projects strip

Horizontal scroll, one card per project (filtered to `shoot_date` in the next 7 days). Tap → push the project detail screen.

```swift
struct UpcomingProjectsStrip: View {
    let projects: [Project]
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.sm) {
                ForEach(projects) { project in
                    UpcomingProjectCard(project: project)
                        .onTapGesture {
                            Haptics.tap()
                            AppRouter.shared.navigate(to: .projectDetail(project.id))
                        }
                }
            }
            .padding(.horizontal, Spacing.md)
        }
    }
}
```

`UpcomingProjectCard`: 200×100, big day number, weekday, title, location pill.

## Step 6 — Quick actions

```swift
struct QuickActions: View {
    var body: some View {
        HStack(spacing: Spacing.sm) {
            QuickActionButton(symbol: "folder.badge.plus", label: "Project") {
                AppRouter.shared.presentedSheet = .createProject
            }
            QuickActionButton(symbol: "envelope.badge", label: "Inquiry") {
                AppRouter.shared.presentedSheet = .createInquiry
            }
            QuickActionButton(symbol: "minus.circle", label: "Expense") {
                AppRouter.shared.presentedSheet = .createFinance(preselectedType: .expense)
            }
        }
    }
}
```

## Step 7 — `DashboardScreen`

```swift
struct DashboardScreen: View {
    @Environment(\.modelContext) private var context
    @State private var snapshot: DashboardSnapshot?
    @State private var isRefreshing = false

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.md) {
                if let s = snapshot {
                    kpiGrid(s)
                    RevenueChart(data: s.revenueByMonth)
                    ProjectStatusDonut(breakdown: s.projectStatusBreakdown)
                    if !s.nextSevenDaysProjects.isEmpty {
                        sectionHeader("Upcoming")
                        UpcomingProjectsStrip(projects: s.nextSevenDaysProjects)
                    }
                    sectionHeader("Quick actions")
                    QuickActions()
                } else {
                    SkeletonList(count: 4)
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.md)
        }
        .background(Color.tokens.bg)
        .navigationTitle("Today")
        .refreshable { await refresh() }
        .task { await refresh() }
    }

    private func refresh() async {
        isRefreshing = true
        defer { isRefreshing = false }
        // Refresh underlying caches in parallel
        async let r1: () = ProjectsCacheRepository.shared.refresh(in: context)
        async let r2: () = FinancesCacheRepository.shared.refresh(in: context)
        _ = try? await (r1, r2)

        // Recompute snapshot
        let projects = (try? ProjectsCacheRepository.shared.cached(in: context)) ?? []
        let finances = (try? FinancesCacheRepository.shared.cached(in: context)) ?? []
        snapshot = DashboardCalculations.snapshot(projects: projects, finances: finances)
    }

    @ViewBuilder
    private func kpiGrid(_ s: DashboardSnapshot) -> some View {
        LazyVGrid(columns: [.init(.flexible()), .init(.flexible())], spacing: Spacing.sm) {
            KPICard(label: "Revenue MTD", value: s.revenueMTD.currencyString, trend: s.revenueByMonth.map { Double(truncating: $0.1 as NSDecimalNumber) })
            KPICard(label: "Active Projects", value: "\(s.activeProjects)")
            KPICard(label: "Upcoming Projects", value: "\(s.upcomingProjects)")
            KPICard(label: "Pending", value: s.pendingRevenue.currencyString, trendColor: .tokens.warning)
        }
    }
}
```

## Step 8 — Greeting

Top of the dashboard, time-of-day aware:

```swift
private var greeting: String {
    let hour = Calendar.current.component(.hour, from: .now)
    let firstName = SessionStore.shared.profile?.fullName?.split(separator: " ").first.map(String.init) ?? ""
    let phase: String
    switch hour {
    case 0..<5:   phase = "Working late"
    case 5..<12:  phase = "Good morning"
    case 12..<17: phase = "Good afternoon"
    case 17..<22: phase = "Good evening"
    default:      phase = "Working late"
    }
    return firstName.isEmpty ? phase : "\(phase), \(firstName)"
}
```

---

## Acceptance Criteria

- [ ] Dashboard loads cached data within 200ms (verified with Instruments → Time Profiler)
- [ ] All four KPI numbers match web `/` for the same account, on a fixture with at least 5 projects (some with shoot_date in the next 7 days) and 10 finance rows
- [ ] Revenue chart shows last 6 months grouped by month
- [ ] Project status donut shows correct counts with legend
- [ ] Upcoming projects strip horizontally scrolls and tap pushes the project detail screen
- [ ] Quick actions open the right create sheet (verified by tap → sheet appears)
- [ ] Pull-to-refresh fires `refresh()` and updates the snapshot
- [ ] Empty account: dashboard shows the layout with zeroes/empty states, doesn't crash
- [ ] `DashboardCalculationsTests` passes 10+ fixture cases
- [ ] Greeting changes based on hour (verified with mocked `now` in tests)

## Depends on

- 04 (Shell, AppRouter, sheet infrastructure)
- 05 (Cache repos for projects, finances)
