import Foundation
import FocalsModels

/// Pure-function math powering the iOS calendar grid. Mirrors the helpers in
/// `my-app/src/components/calendar/MobileCalendarView.tsx` (lines 30–70 + the
/// month-range generator). Any change here should be reflected on the web,
/// otherwise the two apps will disagree on what "today" or a "day key" mean.
public enum CalendarMath {
    public static let monthsBack = 2
    public static let monthsForward = 9
    /// Monday-first weekday headers, matching the web's `WEEKDAY_HEADERS`.
    public static let weekdayHeaders = ["M", "T", "W", "T", "F", "S", "S"]

    /// 6×7 = 42 cells starting from the Monday on/before the first of the
    /// given month. Calendar parameter is injected for testing across DST.
    public static func buildMonthCells(
        year: Int,
        month: Int,
        calendar: Calendar = .iso8601MondayFirst
    ) -> [Date] {
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = 1
        guard let firstOfMonth = calendar.date(from: components) else { return [] }

        // Mirror the web: `(getDay() + 6) % 7` shifts Sunday-first into
        // Monday-first. Calendar.weekday: Sun=1 … Sat=7, so apply the same
        // shift once we subtract one to align with the JS `getDay()`.
        let weekday = calendar.component(.weekday, from: firstOfMonth) // Sun=1 … Sat=7
        let jsDay = weekday - 1                                        // Sun=0 … Sat=6
        let offset = (jsDay + 6) % 7                                   // Mon=0 … Sun=6

        guard let start = calendar.date(byAdding: .day, value: -offset, to: firstOfMonth) else {
            return []
        }
        return (0..<42).compactMap { calendar.date(byAdding: .day, value: $0, to: start) }
    }

    /// "YYYY-MM-DD" key in the supplied calendar's timezone. Used to bucket
    /// projects into day cells; matches the web's `dayKey()` digit-for-digit.
    public static func dayKey(_ date: Date, calendar: Calendar = .current) -> String {
        let comps = calendar.dateComponents([.year, .month, .day], from: date)
        return String(
            format: "%04d-%02d-%02d",
            comps.year ?? 0,
            comps.month ?? 0,
            comps.day ?? 0
        )
    }

    /// "YYYY-MM" key — used to address the rendered month section.
    public static func monthKey(year: Int, month: Int) -> String {
        String(format: "%04d-%02d", year, month)
    }

    public static func monthKey(_ date: Date, calendar: Calendar = .current) -> String {
        let comps = calendar.dateComponents([.year, .month], from: date)
        return monthKey(year: comps.year ?? 0, month: comps.month ?? 0)
    }

    /// 12-month window: `monthsBack` past + current + `monthsForward` future,
    /// oldest → newest. Same shape as the web's `months` memo.
    public static func monthRange(
        now: Date = .now,
        calendar: Calendar = .current
    ) -> [(year: Int, month: Int)] {
        let baseComps = calendar.dateComponents([.year, .month], from: now)
        guard let base = calendar.date(from: baseComps) else { return [] }
        return (-monthsBack...monthsForward).compactMap { offset in
            guard let d = calendar.date(byAdding: .month, value: offset, to: base) else {
                return nil
            }
            let comps = calendar.dateComponents([.year, .month], from: d)
            return (year: comps.year ?? 0, month: comps.month ?? 0)
        }
    }

    /// The web stores `shoot_date` as a timestamptz whose UTC components carry
    /// the wall-clock the user typed (see `wallClockDate()` in MobileCalendarView).
    /// To render the same 8:30 AM badge on iOS regardless of viewer timezone we
    /// rebuild the Date from its UTC components anchored in `targetCalendar`.
    /// Returns nil for non-finite inputs.
    public static func wallClockDate(
        from utcAnchored: Date,
        targetCalendar: Calendar = .current
    ) -> Date? {
        var utcCalendar = Calendar(identifier: .gregorian)
        utcCalendar.timeZone = TimeZone(identifier: "UTC")!
        let comps = utcCalendar.dateComponents(
            [.year, .month, .day, .hour, .minute, .second],
            from: utcAnchored
        )
        return targetCalendar.date(from: comps)
    }

    /// Bucket projects by local-day key, matching the web's `projectsByDay`.
    /// Each bucket is sorted by shoot time ascending. Projects without a
    /// `shootDate` are skipped.
    public static func projectsByDay(
        _ projects: [Project],
        calendar: Calendar = .current
    ) -> [String: [Project]] {
        var map: [String: [Project]] = [:]
        for project in projects {
            guard let raw = project.shootDate,
                  let wallClock = wallClockDate(from: raw, targetCalendar: calendar)
            else { continue }
            let key = dayKey(wallClock, calendar: calendar)
            map[key, default: []].append(project)
        }
        for key in map.keys {
            map[key]?.sort { lhs, rhs in
                (lhs.shootDate ?? .distantPast) < (rhs.shootDate ?? .distantPast)
            }
        }
        return map
    }
}

public extension Calendar {
    /// Gregorian calendar with Monday as the first weekday — matches the
    /// MobileCalendarView's `(getDay() + 6) % 7` Monday-shift. The default
    /// `Calendar.current` honours user locale (e.g. Sunday-first in en-US),
    /// which is wrong for our grid.
    static var iso8601MondayFirst: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.firstWeekday = 2 // Monday
        return calendar
    }
}
