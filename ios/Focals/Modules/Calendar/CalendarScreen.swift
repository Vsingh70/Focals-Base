import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct CalendarScreen: View {
    @Environment(\.modelContext) private var context
    @Query(
        filter: #Predicate<CachedProject> { $0.shootDate != nil },
        sort: \CachedProject.shootDate,
        order: .forward
    )
    private var cached: [CachedProject]

    @State private var selectedDay: Date? = .now
    @State private var hasAutoScrolled = false
    @State private var hasLoadedOnce = false

    private static let calendar = Calendar.iso8601MondayFirst

    private var months: [(year: Int, month: Int)] { CalendarMath.monthRange() }
    private var todayKey: String { CalendarMath.dayKey(.now, calendar: Self.calendar) }
    private var currentMonthKey: String { CalendarMath.monthKey(.now, calendar: Self.calendar) }

    private var projectsByDay: [String: [Project]] {
        let projects = cached.map { $0.toModel() }
        return CalendarMath.projectsByDay(projects, calendar: Self.calendar)
    }

    private var selectedDayKey: String? {
        selectedDay.map { CalendarMath.dayKey($0, calendar: Self.calendar) }
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: Spacing.lg, pinnedViews: []) {
                    ForEach(months, id: \.self.month) { ym in
                        let key = CalendarMath.monthKey(year: ym.year, month: ym.month)
                        let showDetail = (selectedDay.flatMap { d -> Bool in
                            let comps = Self.calendar.dateComponents([.year, .month], from: d)
                            return comps.year == ym.year && comps.month == ym.month
                        }) ?? false

                        VStack(alignment: .leading, spacing: Spacing.sm) {
                            MonthSection(
                                year: ym.year,
                                month: ym.month,
                                isCurrent: key == currentMonthKey,
                                todayKey: todayKey,
                                selectedDayKey: showDetail ? selectedDayKey : nil,
                                projectsByDay: projectsByDay,
                                onDayTap: { date in handleDayTap(date, proxy: proxy) }
                            )
                            .id(key)

                            if showDetail, let day = selectedDay {
                                DayDetailPanel(
                                    date: day,
                                    projects: projectsByDay[CalendarMath.dayKey(day, calendar: Self.calendar)] ?? []
                                )
                            }
                        }
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.md)
            }
            .background(Color.tokens.bg)
            .navigationTitle("Calendar")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Today") {
                        Haptics.tap()
                        let now = Date.now
                        selectedDay = now
                        withAnimation { proxy.scrollTo(currentMonthKey, anchor: .top) }
                    }
                    .font(.tokens.medium(13))
                    .foregroundStyle(Color.tokens.textSecondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        AppRouter.shared.presentedSheet = .createProject(presetShootDate: selectedDay)
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable { await refresh() }
            .task {
                if !hasLoadedOnce {
                    await refresh()
                    hasLoadedOnce = true
                }
                if !hasAutoScrolled {
                    hasAutoScrolled = true
                    proxy.scrollTo(currentMonthKey, anchor: .top)
                }
            }
        }
    }

    private func handleDayTap(_ date: Date, proxy: ScrollViewProxy) {
        let tappedKey = CalendarMath.dayKey(date, calendar: Self.calendar)
        // Tapping the same day toggles the panel off, matching web behaviour.
        if let current = selectedDay,
           CalendarMath.dayKey(current, calendar: Self.calendar) == tappedKey {
            selectedDay = nil
            return
        }
        selectedDay = date

        // If the tap landed on a leading or trailing day from an adjacent
        // month (the cell visually belongs to the rendered month, but the
        // date itself is in the prior/next month), scroll the strip to that
        // date's actual month so the inline detail panel renders alongside
        // the right header. Mirrors `handleDayTap` in MobileCalendarView.tsx.
        let targetMonthKey = CalendarMath.monthKey(date, calendar: Self.calendar)
        withAnimation {
            proxy.scrollTo(targetMonthKey, anchor: .top)
        }
    }

    private func refresh() async {
        try? await ProjectsCacheRepository.shared.refresh(in: context)
    }
}
