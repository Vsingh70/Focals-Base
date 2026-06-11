import Foundation
import FocalsModels

/// Aggregate snapshot rendered by the dashboard. All numbers must match the
/// web `/` for the same account — the formulas mirror
/// `my-app/src/lib/queries/dashboard.ts` exactly. See the unit-test suite for
/// fixture coverage that pins the parity.
public struct DashboardSnapshot: Sendable, Equatable {
    public let revenueMTD: Decimal
    public let activeProjects: Int
    public let upcomingProjects: Int
    /// Sum of `package_price - amount_paid`, clamped at zero, across projects
    /// whose status is not `cancelled` and whose payment_status is not `paid`.
    public let pendingRevenue: Decimal
    /// 6 entries, oldest → newest. Each tuple is (firstOfMonth, monthlyIncome).
    public let revenueByMonth: [DashboardMonthRevenue]
    /// Counts grouped by status. nil-status rows are dropped (legacy data).
    public let projectStatusBreakdown: [DashboardStatusCount]
    /// Projects with a shoot_date in [now, now+7d], sorted ascending.
    public let nextSevenDaysProjects: [Project]

    public init(
        revenueMTD: Decimal,
        activeProjects: Int,
        upcomingProjects: Int,
        pendingRevenue: Decimal,
        revenueByMonth: [DashboardMonthRevenue],
        projectStatusBreakdown: [DashboardStatusCount],
        nextSevenDaysProjects: [Project]
    ) {
        self.revenueMTD = revenueMTD
        self.activeProjects = activeProjects
        self.upcomingProjects = upcomingProjects
        self.pendingRevenue = pendingRevenue
        self.revenueByMonth = revenueByMonth
        self.projectStatusBreakdown = projectStatusBreakdown
        self.nextSevenDaysProjects = nextSevenDaysProjects
    }
}

public struct DashboardMonthRevenue: Sendable, Equatable, Identifiable {
    public let monthStart: Date
    public let income: Decimal

    public var id: Date { monthStart }

    public init(monthStart: Date, income: Decimal) {
        self.monthStart = monthStart
        self.income = income
    }
}

public struct DashboardStatusCount: Sendable, Equatable, Identifiable {
    public let status: ProjectStatus
    public let count: Int

    public var id: ProjectStatus { status }

    public init(status: ProjectStatus, count: Int) {
        self.status = status
        self.count = count
    }
}

public enum DashboardCalculations {
    /// Active project statuses — must match the web's `activeStatuses` list.
    public static let activeStatuses: Set<ProjectStatus> = [
        .inquiry, .booked, .inProgress, .editing,
    ]

    /// Upcoming horizon = 7 days. Used by both the KPI count and the strip.
    public static let upcomingHorizon: TimeInterval = 7 * 24 * 60 * 60

    public static func snapshot(
        projects: [Project],
        finances: [Finance],
        now: Date = .now,
        calendar: Calendar = .current
    ) -> DashboardSnapshot {
        let monthStart = calendar.startOfMonth(for: now)
        let sevenDaysOut = now.addingTimeInterval(upcomingHorizon)

        // 1) Revenue MTD — sum income whose date string parses to ≥ monthStart.
        // Mirrors the web's `gte('date', monthStart)` + sumByType filter.
        let revenueMTD = sumIncome(
            in: finances,
            from: monthStart,
            calendar: calendar
        )

        // 2) Active projects.
        let activeProjects = projects.reduce(into: 0) { acc, project in
            if let status = project.status, activeStatuses.contains(status) {
                acc += 1
            }
        }

        // 3) Upcoming projects (count) — shoot_date in [now, now+7d].
        let upcomingProjectsList = projects
            .filter { project in
                guard let shootDate = project.shootDate else { return false }
                return shootDate >= now && shootDate <= sevenDaysOut
            }
            .sorted { ($0.shootDate ?? .distantFuture) < ($1.shootDate ?? .distantFuture) }

        // 4) Pending payments — sum max(0, package_price - amount_paid)
        //    where status != cancelled AND payment_status != paid.
        let pendingRevenue = projects.reduce(Decimal.zero) { acc, project in
            guard project.status != .cancelled else { return acc }
            guard project.paymentStatus != .paid else { return acc }
            let total = Decimal(project.packagePrice ?? 0)
            let paid = Decimal(project.amountPaid ?? 0)
            let remaining = total - paid
            return remaining > 0 ? acc + remaining : acc
        }

        // 5) Revenue by month — last 6 months, oldest → newest, income only.
        let revenueByMonth = bucketMonthlyIncome(
            finances: finances,
            now: now,
            calendar: calendar
        )

        // 6) Project status breakdown — group counts by enum value.
        var statusCounts: [ProjectStatus: Int] = [:]
        for project in projects {
            guard let status = project.status else { continue }
            statusCounts[status, default: 0] += 1
        }
        let projectStatusBreakdown = ProjectStatus.allCases.compactMap { status -> DashboardStatusCount? in
            guard let count = statusCounts[status] else { return nil }
            return DashboardStatusCount(status: status, count: count)
        }

        return DashboardSnapshot(
            revenueMTD: revenueMTD,
            activeProjects: activeProjects,
            upcomingProjects: upcomingProjectsList.count,
            pendingRevenue: pendingRevenue,
            revenueByMonth: revenueByMonth,
            projectStatusBreakdown: projectStatusBreakdown,
            nextSevenDaysProjects: upcomingProjectsList
        )
    }

    // MARK: - Helpers

    private static func sumIncome(
        in finances: [Finance],
        from cutoff: Date,
        calendar: Calendar
    ) -> Decimal {
        finances.reduce(Decimal.zero) { acc, finance in
            guard finance.type == .income else { return acc }
            guard let financeDate = parseFinanceDate(finance.date, calendar: calendar) else {
                return acc
            }
            return financeDate >= cutoff ? acc + Decimal(finance.amount) : acc
        }
    }

    private static func bucketMonthlyIncome(
        finances: [Finance],
        now: Date,
        calendar: Calendar
    ) -> [DashboardMonthRevenue] {
        // Build six empty buckets keyed by startOfMonth so months with no
        // finance rows still render as zero — matches the web's pre-seeded map.
        var buckets: [Date: Decimal] = [:]
        var orderedMonths: [Date] = []
        let thisMonth = calendar.startOfMonth(for: now)
        for offset in stride(from: 5, through: 0, by: -1) {
            guard let monthStart = calendar.date(byAdding: .month, value: -offset, to: thisMonth) else {
                continue
            }
            let normalized = calendar.startOfMonth(for: monthStart)
            buckets[normalized] = .zero
            orderedMonths.append(normalized)
        }

        guard let earliest = orderedMonths.first else { return [] }

        for finance in finances where finance.type == .income {
            guard let financeDate = parseFinanceDate(finance.date, calendar: calendar) else {
                continue
            }
            guard financeDate >= earliest else { continue }
            let monthStart = calendar.startOfMonth(for: financeDate)
            guard buckets[monthStart] != nil else { continue }
            buckets[monthStart, default: .zero] += Decimal(finance.amount)
        }

        return orderedMonths.map { DashboardMonthRevenue(monthStart: $0, income: buckets[$0] ?? .zero) }
    }

    /// Finance.date is a wall-clock `YYYY-MM-DD` string in the web schema.
    /// Anchor it at midnight in the supplied calendar's timezone so month
    /// bucketing matches what the user would see on the web.
    static func parseFinanceDate(_ raw: String, calendar: Calendar) -> Date? {
        let trimmed = raw.prefix(10)
        let parts = trimmed.split(separator: "-")
        guard parts.count == 3,
              let year = Int(parts[0]),
              let month = Int(parts[1]),
              let day = Int(parts[2])
        else { return nil }

        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        return calendar.date(from: components)
    }
}

private extension Calendar {
    /// First instant of the month containing `date`, in this calendar's TZ.
    func startOfMonth(for date: Date) -> Date {
        let components = dateComponents([.year, .month], from: date)
        return self.date(from: components) ?? date
    }
}
