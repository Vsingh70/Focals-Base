import SwiftUI
import FocalsAPI
import FocalsDesign
import FocalsModels

struct MonthSection: View {
    let year: Int
    let month: Int
    let isCurrent: Bool
    let todayKey: String
    let selectedDayKey: String?
    let projectsByDay: [String: [Project]]
    let onDayTap: (Date) -> Void

    private static let calendar = Calendar.iso8601MondayFirst

    private var monthLabel: String {
        var comps = DateComponents()
        comps.year = year
        comps.month = month
        comps.day = 1
        guard let date = Self.calendar.date(from: comps) else { return "" }
        let formatter = DateFormatter()
        formatter.dateFormat = "LLLL yyyy"
        return formatter.string(from: date)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(monthLabel)
                .font(.tokens.display(20))
                .foregroundStyle(isCurrent ? Color.tokens.accent : Color.tokens.textPrimary)
                .padding(.leading, 4)

            HStack(spacing: 0) {
                ForEach(Array(CalendarMath.weekdayHeaders.enumerated()), id: \.offset) { _, label in
                    Text(label)
                        .font(.tokens.medium(10))
                        .tracking(0.8)
                        .foregroundStyle(Color.tokens.textTertiary)
                        .frame(maxWidth: .infinity)
                }
            }

            let cells = CalendarMath.buildMonthCells(
                year: year,
                month: month,
                calendar: Self.calendar
            )
            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: 7),
                spacing: 2
            ) {
                ForEach(cells, id: \.self) { date in
                    let cellKey = CalendarMath.dayKey(date, calendar: Self.calendar)
                    DayCell(
                        date: date,
                        isInMonth: Self.calendar.component(.month, from: date) == month,
                        isToday: cellKey == todayKey,
                        isSelected: cellKey == selectedDayKey,
                        projects: projectsByDay[cellKey] ?? []
                    )
                    .onTapGesture {
                        Haptics.tap()
                        onDayTap(date)
                    }
                }
            }
        }
    }
}
