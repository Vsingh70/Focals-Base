import Testing
import Foundation
@testable import FocalsAPI
@testable import FocalsModels

/// Pins the calendar grid math to the web's `MobileCalendarView` helpers
/// (lines 30–70). When this drifts the iOS and web calendars will disagree
/// about which day a project lives in or which row it's drawn on.
struct CalendarMathTests {

    private static var calendar: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.firstWeekday = 2
        c.timeZone = TimeZone(identifier: "America/Los_Angeles")!
        return c
    }()

    private func date(year: Int, month: Int, day: Int = 1, hour: Int = 12) -> Date {
        var comps = DateComponents()
        comps.year = year
        comps.month = month
        comps.day = day
        comps.hour = hour
        comps.timeZone = Self.calendar.timeZone
        return Self.calendar.date(from: comps)!
    }

    // MARK: - 1. Grid produces exactly 42 cells

    @Test func buildMonthCellsAlwaysReturns42() {
        for (year, month) in [(2026, 2), (2026, 3), (2024, 2), (2025, 12), (2025, 1)] {
            let cells = CalendarMath.buildMonthCells(year: year, month: month, calendar: Self.calendar)
            #expect(cells.count == 42)
        }
    }

    // MARK: - 2. First cell is the Monday on/before the 1st

    @Test func firstCellIsMondayOnOrBeforeFirstOfMonth() {
        // Feb 2026: 1st is Sunday, so prior Monday is Jan 26.
        let cells = CalendarMath.buildMonthCells(year: 2026, month: 2, calendar: Self.calendar)
        let first = cells.first!
        let weekday = Self.calendar.component(.weekday, from: first) // Sun=1 … Sat=7
        #expect(weekday == 2) // Monday
        let comps = Self.calendar.dateComponents([.year, .month, .day], from: first)
        #expect(comps.year == 2026)
        #expect(comps.month == 1)
        #expect(comps.day == 26)
    }

    // MARK: - 3. February 2024 (leap year) — last day is Feb 29

    @Test func leapYearFebruaryIncludes29th() {
        let cells = CalendarMath.buildMonthCells(year: 2024, month: 2, calendar: Self.calendar)
        let inMonthDays = cells
            .filter { Self.calendar.component(.month, from: $0) == 2 }
            .map { Self.calendar.component(.day, from: $0) }
        #expect(inMonthDays.last == 29)
        #expect(inMonthDays.count == 29)
    }

    // MARK: - 4. DST forward (March 2026) — every cell is a distinct day

    @Test func dstForwardMonthHas42UniqueDayKeys() {
        // US DST 2026 starts Sunday March 8. The grid spans Feb 23 → Apr 5.
        let cells = CalendarMath.buildMonthCells(year: 2026, month: 3, calendar: Self.calendar)
        let keys = Set(cells.map { CalendarMath.dayKey($0, calendar: Self.calendar) })
        #expect(keys.count == 42)
        // The DST-affected day (March 8) is present.
        #expect(keys.contains("2026-03-08"))
    }

    // MARK: - 5. DST back (November 2026)

    @Test func dstBackMonthHas42UniqueDayKeys() {
        // US DST 2026 ends Sunday November 1.
        let cells = CalendarMath.buildMonthCells(year: 2026, month: 11, calendar: Self.calendar)
        let keys = Set(cells.map { CalendarMath.dayKey($0, calendar: Self.calendar) })
        #expect(keys.count == 42)
        #expect(keys.contains("2026-11-01"))
    }

    // MARK: - 6. monthRange shape (12 months, ordered)

    @Test func monthRangeHas12MonthsOldestFirst() {
        let now = date(year: 2026, month: 5, day: 15)
        let range = CalendarMath.monthRange(now: now, calendar: Self.calendar)
        #expect(range.count == 12)
        #expect(range.first?.year == 2026)
        #expect(range.first?.month == 3)  // 5 - 2
        #expect(range.last?.year == 2027)
        #expect(range.last?.month == 2)   // 5 + 9 = 14 → next year, Feb
    }

    // MARK: - 7. dayKey/monthKey shape

    @Test func keysAreZeroPaddedISOLike() {
        let d = date(year: 2026, month: 4, day: 5, hour: 12)
        #expect(CalendarMath.dayKey(d, calendar: Self.calendar) == "2026-04-05")
        #expect(CalendarMath.monthKey(year: 2026, month: 4) == "2026-04")
    }

    // MARK: - 8. wallClockDate decodes UTC components into local

    @Test func wallClockDateExtractsUtcDigits() {
        // The web stores wall-clock 8:30 AM Apr 15 2026 as the literal
        // "2026-04-15T08:30:00+00:00". Whatever the viewer's local TZ,
        // wallClockDate should return a Date whose components in
        // `targetCalendar` read 2026-04-15 08:30.
        let utcComps: [String: Int] = [
            "year": 2026, "month": 4, "day": 15, "hour": 8, "minute": 30,
        ]
        var utcComponents = DateComponents()
        utcComponents.year = utcComps["year"]
        utcComponents.month = utcComps["month"]
        utcComponents.day = utcComps["day"]
        utcComponents.hour = utcComps["hour"]
        utcComponents.minute = utcComps["minute"]
        utcComponents.timeZone = TimeZone(identifier: "UTC")!
        let utcAnchored = Calendar(identifier: .gregorian).date(from: utcComponents)!

        let wallClock = CalendarMath.wallClockDate(from: utcAnchored, targetCalendar: Self.calendar)!
        let localComps = Self.calendar.dateComponents([.year, .month, .day, .hour, .minute], from: wallClock)
        #expect(localComps.year == 2026)
        #expect(localComps.month == 4)
        #expect(localComps.day == 15)
        #expect(localComps.hour == 8)
        #expect(localComps.minute == 30)
    }

    // MARK: - 9. projectsByDay buckets and sorts

    @Test func projectsByDayBucketsByLocalDayAndSortsByTime() {
        // Two projects on Apr 15 (8:30 then 14:00), one on Apr 16.
        let p1 = makeProject(title: "Morning",   wallClock: ymdhm(2026, 4, 15, 8, 30))
        let p2 = makeProject(title: "Afternoon", wallClock: ymdhm(2026, 4, 15, 14, 0))
        let p3 = makeProject(title: "Tomorrow",  wallClock: ymdhm(2026, 4, 16, 9, 0))
        // Project without shoot date — must be skipped.
        let p4 = makeProject(title: "Unscheduled", wallClock: nil)

        let map = CalendarMath.projectsByDay([p2, p1, p3, p4], calendar: Self.calendar)
        #expect(map.count == 2)
        #expect(map["2026-04-15"]?.map(\.title) == ["Morning", "Afternoon"])
        #expect(map["2026-04-16"]?.map(\.title) == ["Tomorrow"])
    }

    // MARK: - 10. monthRange anchors on first-of-month

    @Test func monthRangeFirstOffsetIsCorrectAcrossYearBoundary() {
        let now = date(year: 2026, month: 1, day: 15)
        let range = CalendarMath.monthRange(now: now, calendar: Self.calendar)
        #expect(range.first?.year == 2025)
        #expect(range.first?.month == 11)
        #expect(range.last?.year == 2026)
        #expect(range.last?.month == 10)
    }

    // MARK: - Helpers

    private func ymdhm(_ y: Int, _ m: Int, _ d: Int, _ h: Int, _ min: Int) -> Date {
        var comps = DateComponents()
        comps.year = y; comps.month = m; comps.day = d
        comps.hour = h; comps.minute = min
        comps.timeZone = TimeZone(identifier: "UTC")!
        return Calendar(identifier: .gregorian).date(from: comps)!
    }

    private func makeProject(title: String, wallClock: Date?) -> Project {
        Project(
            id: UUID(),
            userId: UUID(),
            title: title,
            clientId: nil,
            category: nil,
            status: .booked,
            shootDate: wallClock,
            location: nil,
            packagePrice: nil,
            amountPaid: nil,
            paymentStatus: nil,
            notes: nil,
            createdAt: .now,
            updatedAt: .now
        )
    }
}
