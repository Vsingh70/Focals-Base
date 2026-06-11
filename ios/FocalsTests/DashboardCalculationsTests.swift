import Testing
import Foundation
@testable import FocalsAPI
@testable import FocalsModels

/// Pins parity with the web `/` dashboard. Every fixture here has a hand-
/// computed expected value — if these break, web's `dashboard.ts` and the
/// iOS calculation have drifted, and the user will see different numbers
/// in the two places.
struct DashboardCalculationsTests {

    // MARK: - Fixture helpers

    private static var calendar: Calendar = {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "America/Los_Angeles")!
        return cal
    }()

    /// 2026-04-15 12:00 PT — comfortably mid-month so MTD windows are stable.
    private static var fixedNow: Date = {
        var components = DateComponents()
        components.year = 2026
        components.month = 4
        components.day = 15
        components.hour = 12
        components.minute = 0
        components.timeZone = calendar.timeZone
        return calendar.date(from: components)!
    }()

    private func project(
        title: String = "Job",
        status: ProjectStatus? = .booked,
        shootDate: Date? = nil,
        packagePrice: Double? = nil,
        amountPaid: Double? = nil,
        paymentStatus: PaymentStatus? = nil
    ) -> Project {
        Project(
            id: UUID(),
            userId: UUID(),
            title: title,
            clientId: nil,
            category: nil,
            status: status,
            shootDate: shootDate,
            location: nil,
            packagePrice: packagePrice,
            amountPaid: amountPaid,
            paymentStatus: paymentStatus,
            notes: nil,
            createdAt: Self.fixedNow,
            updatedAt: Self.fixedNow
        )
    }

    private func finance(
        type: FinanceType,
        amount: Double,
        date: String
    ) -> Finance {
        Finance(
            id: UUID(),
            userId: UUID(),
            type: type,
            amount: amount,
            date: date,
            category: nil,
            description: nil,
            paymentMethod: nil,
            projectId: nil,
            createdAt: Self.fixedNow
        )
    }

    private func snapshot(
        projects: [Project] = [],
        finances: [Finance] = [],
        now: Date = DashboardCalculationsTests.fixedNow
    ) -> DashboardSnapshot {
        DashboardCalculations.snapshot(
            projects: projects,
            finances: finances,
            now: now,
            calendar: Self.calendar
        )
    }

    // MARK: - 1. Empty inputs produce zeros, not crashes

    @Test func emptyInputsProduceZeros() {
        let s = snapshot()
        #expect(s.revenueMTD == 0)
        #expect(s.activeProjects == 0)
        #expect(s.upcomingProjects == 0)
        #expect(s.pendingRevenue == 0)
        #expect(s.revenueByMonth.count == 6)
        #expect(s.revenueByMonth.allSatisfy { $0.income == 0 })
        #expect(s.projectStatusBreakdown.isEmpty)
        #expect(s.nextSevenDaysProjects.isEmpty)
    }

    // MARK: - 2. Revenue MTD sums income from current month only

    @Test func revenueMTDSumsCurrentMonthIncomeOnly() {
        let finances: [Finance] = [
            finance(type: .income,  amount: 1500, date: "2026-04-02"), // in
            finance(type: .income,  amount: 250,  date: "2026-04-14"), // in
            finance(type: .expense, amount: 200,  date: "2026-04-10"), // expense — ignored
            finance(type: .income,  amount: 999,  date: "2026-03-28"), // prev month — ignored
        ]
        let s = snapshot(finances: finances)
        #expect(s.revenueMTD == 1750)
    }

    // MARK: - 3. Active projects count matches active-statuses set

    @Test func activeProjectsCountsCorrectStatuses() {
        let projects: [Project] = [
            project(status: .inquiry),
            project(status: .booked),
            project(status: .inProgress),
            project(status: .editing),
            project(status: .delivered),  // not active
            project(status: .completed),  // not active
            project(status: .cancelled),  // not active
            project(status: nil),         // legacy null — not active
        ]
        let s = snapshot(projects: projects)
        #expect(s.activeProjects == 4)
    }

    // MARK: - 4. Upcoming projects bounded by [now, now+7d]

    @Test func upcomingProjectsWithinSevenDayWindow() {
        let now = Self.fixedNow
        let projects: [Project] = [
            project(title: "Today",       shootDate: now.addingTimeInterval(60 * 60)),         // +1h
            project(title: "Day 6",       shootDate: now.addingTimeInterval(6 * 24 * 60 * 60)),
            project(title: "Day 7 -1m",   shootDate: now.addingTimeInterval(7 * 24 * 60 * 60 - 60)),
            project(title: "Day 8",       shootDate: now.addingTimeInterval(8 * 24 * 60 * 60)),  // out
            project(title: "Yesterday",   shootDate: now.addingTimeInterval(-24 * 60 * 60)),     // past — out
            project(title: "Null shoot",  shootDate: nil),                                       // out
        ]
        let s = snapshot(projects: projects, now: now)
        #expect(s.upcomingProjects == 3)
        #expect(s.nextSevenDaysProjects.map(\.title) == ["Today", "Day 6", "Day 7 -1m"])
    }

    // MARK: - 5. Pending revenue clamps negatives, skips paid + cancelled

    @Test func pendingRevenueExcludesPaidAndCancelled() {
        let projects: [Project] = [
            project(packagePrice: 1000, amountPaid: 200,  paymentStatus: .partial),  // 800
            project(packagePrice: 500,  amountPaid: 0,    paymentStatus: .unpaid),   // 500
            project(packagePrice: 800,  amountPaid: 800,  paymentStatus: .paid),     // skipped
            project(status: .cancelled,
                    packagePrice: 600,  amountPaid: 0,    paymentStatus: .unpaid),   // skipped
            project(packagePrice: 100,  amountPaid: 200,  paymentStatus: .partial),  // negative — clamped
            project(packagePrice: nil,  amountPaid: nil,  paymentStatus: .unpaid),   // 0
        ]
        let s = snapshot(projects: projects)
        #expect(s.pendingRevenue == 1300)
    }

    // MARK: - 6. Revenue series buckets six months oldest → newest

    @Test func revenueByMonthBucketsSixMonths() {
        // Now = April 2026. Six buckets: 2025-11 → 2026-04.
        let finances: [Finance] = [
            finance(type: .income,  amount: 100, date: "2025-11-15"),
            finance(type: .income,  amount: 200, date: "2026-01-05"),
            finance(type: .income,  amount: 50,  date: "2026-01-20"),
            finance(type: .income,  amount: 400, date: "2026-04-02"),
            finance(type: .expense, amount: 999, date: "2026-04-02"),  // expense ignored
            finance(type: .income,  amount: 999, date: "2025-08-01"),  // out of window
        ]
        let s = snapshot(finances: finances)
        #expect(s.revenueByMonth.count == 6)
        let incomes = s.revenueByMonth.map(\.income)
        // Oldest first → newest: Nov, Dec, Jan, Feb, Mar, Apr.
        #expect(incomes == [100, 0, 250, 0, 0, 400])

        // Months are in chronological order.
        for (lhs, rhs) in zip(s.revenueByMonth, s.revenueByMonth.dropFirst()) {
            #expect(lhs.monthStart < rhs.monthStart)
        }
    }

    // MARK: - 7. Status breakdown counts

    @Test func projectStatusBreakdownGroupsCorrectly() {
        let projects: [Project] = [
            project(status: .booked),
            project(status: .booked),
            project(status: .booked),
            project(status: .inProgress),
            project(status: .delivered),
            project(status: nil),  // legacy null — dropped
        ]
        let s = snapshot(projects: projects)
        let asDict = Dictionary(uniqueKeysWithValues: s.projectStatusBreakdown.map { ($0.status, $0.count) })
        #expect(asDict[.booked] == 3)
        #expect(asDict[.inProgress] == 1)
        #expect(asDict[.delivered] == 1)
        #expect(asDict[.inquiry] == nil)
    }

    // MARK: - 8. Upcoming list is sorted ascending by shoot_date

    @Test func upcomingProjectsAreSortedAscending() {
        let now = Self.fixedNow
        let projects: [Project] = [
            project(title: "C", shootDate: now.addingTimeInterval(5 * 24 * 60 * 60)),
            project(title: "A", shootDate: now.addingTimeInterval(1 * 24 * 60 * 60)),
            project(title: "B", shootDate: now.addingTimeInterval(3 * 24 * 60 * 60)),
        ]
        let s = snapshot(projects: projects, now: now)
        #expect(s.nextSevenDaysProjects.map(\.title) == ["A", "B", "C"])
    }

    // MARK: - 9. Malformed finance dates are ignored, not fatal

    @Test func malformedFinanceDateIsIgnored() {
        let finances: [Finance] = [
            finance(type: .income, amount: 100, date: "not-a-date"),
            finance(type: .income, amount: 250, date: "2026-04-10"),
        ]
        let s = snapshot(finances: finances)
        #expect(s.revenueMTD == 250)
    }

    // MARK: - 10. ISO timestamp finance.date (with time) is bucketed correctly

    @Test func financeDateAcceptsIsoTimestamp() {
        let finances: [Finance] = [
            // First-day-of-month timestamps are still in that month.
            finance(type: .income, amount: 333, date: "2026-04-01T10:30:00Z"),
            // Last-day-of-prior-month timestamp is out of MTD.
            finance(type: .income, amount: 444, date: "2026-03-31T23:59:59Z"),
        ]
        let s = snapshot(finances: finances)
        #expect(s.revenueMTD == 333)
        let april = s.revenueByMonth.last!
        #expect(april.income == 333)
        let march = s.revenueByMonth[s.revenueByMonth.count - 2]
        #expect(march.income == 444)
    }

    // MARK: - 11. Combined-fixture parity check

    @Test func combinedFixtureMatchesExpected() {
        let now = Self.fixedNow
        let projects: [Project] = [
            project(title: "Wedding A", status: .booked,
                    shootDate: now.addingTimeInterval(2 * 24 * 60 * 60),
                    packagePrice: 3500, amountPaid: 1000, paymentStatus: .partial),
            project(title: "Engagement B", status: .inquiry,
                    shootDate: now.addingTimeInterval(6 * 24 * 60 * 60),
                    packagePrice: 800, amountPaid: 0, paymentStatus: .unpaid),
            project(title: "Family C", status: .inProgress,
                    shootDate: now.addingTimeInterval(20 * 24 * 60 * 60),
                    packagePrice: 1200, amountPaid: 600, paymentStatus: .partial),
            project(title: "Done D", status: .completed,
                    shootDate: now.addingTimeInterval(-30 * 24 * 60 * 60),
                    packagePrice: 2000, amountPaid: 2000, paymentStatus: .paid),
            project(title: "Cancelled E", status: .cancelled,
                    shootDate: nil,
                    packagePrice: 500, amountPaid: 0, paymentStatus: .unpaid),
        ]
        let finances: [Finance] = [
            finance(type: .income,  amount: 1000, date: "2026-04-05"),
            finance(type: .income,  amount: 600,  date: "2026-04-12"),
            finance(type: .expense, amount: 200,  date: "2026-04-08"),
            finance(type: .income,  amount: 2000, date: "2026-03-20"),
            finance(type: .income,  amount: 1500, date: "2025-12-15"),
        ]
        let s = snapshot(projects: projects, finances: finances, now: now)

        #expect(s.revenueMTD == 1600)                  // 1000 + 600
        #expect(s.activeProjects == 3)                 // booked, inquiry, in_progress
        #expect(s.upcomingProjects == 2)               // A and B (within 7 days)
        #expect(s.nextSevenDaysProjects.map(\.title) == ["Wedding A", "Engagement B"])
        // Pending: A 2500, B 800, C 600 (D paid, E cancelled).
        #expect(s.pendingRevenue == 3900)
        // Revenue series: Nov 0, Dec 1500, Jan 0, Feb 0, Mar 2000, Apr 1600.
        #expect(s.revenueByMonth.map(\.income) == [0, 1500, 0, 0, 2000, 1600])
        let breakdown = Dictionary(uniqueKeysWithValues:
            s.projectStatusBreakdown.map { ($0.status, $0.count) })
        #expect(breakdown[.booked] == 1)
        #expect(breakdown[.inquiry] == 1)
        #expect(breakdown[.inProgress] == 1)
        #expect(breakdown[.completed] == 1)
        #expect(breakdown[.cancelled] == 1)
    }

    // MARK: - 12. Finance date string parses to month-anchor in given calendar

    @Test func parseFinanceDateProducesMonthAnchorInCalendar() {
        let raw = "2026-04-15"
        let parsed = DashboardCalculations.parseFinanceDate(raw, calendar: Self.calendar)
        #expect(parsed != nil)
        let comps = Self.calendar.dateComponents([.year, .month, .day], from: parsed!)
        #expect(comps.year == 2026)
        #expect(comps.month == 4)
        #expect(comps.day == 15)
    }
}
