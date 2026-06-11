import SwiftUI
import FocalsAPI
import FocalsDesign
import FocalsModels

struct DayDetailPanel: View {
    let date: Date
    let projects: [Project]
    /// Default 60 minutes — matches `DEFAULT_DURATION_MIN` in MobileCalendarView.
    static let defaultDurationMinutes = 60

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            HStack {
                Text(date.formatted(.dateTime.weekday(.wide).month(.wide).day()))
                    .font(.tokens.medium(13))
                    .foregroundStyle(Color.tokens.textPrimary)
                Spacer()
                Button {
                    Haptics.tap()
                    AppRouter.shared.presentedSheet = .createProject(presetShootDate: presetTime)
                } label: {
                    Text("+ Add")
                        .font(.tokens.medium(12))
                        .foregroundStyle(Color.tokens.accent)
                }
                .buttonStyle(.plain)
            }

            if projects.isEmpty {
                Text("No projects scheduled.")
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.textTertiary)
            } else {
                VStack(spacing: Spacing.xs) {
                    ForEach(projects) { project in
                        ProjectListCard(project: project)
                            .onTapGesture {
                                Haptics.tap()
                                AppRouter.shared.navigate(to: .projectDetail(project.id))
                            }
                    }
                }
            }
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.tokens.bgSecondary)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.md)
                .stroke(Color.tokens.border, lineWidth: 0.5)
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.md))
    }

    /// Default to 10:00 AM on the selected day, matching the web's `+ Add`
    /// behavior (`start.setHours(10, 0, 0, 0)`).
    private var presetTime: Date {
        var comps = Calendar.current.dateComponents([.year, .month, .day], from: date)
        comps.hour = 10
        comps.minute = 0
        return Calendar.current.date(from: comps) ?? date
    }
}

private struct ProjectListCard: View {
    let project: Project

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f
    }()

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            // Left status border — mirrors the web's 3px coloured stripe.
            Rectangle()
                .fill((project.status ?? .inquiry).barColor)
                .frame(width: 3)

            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .firstTextBaseline) {
                    Text(project.title)
                        .font(.tokens.medium(14))
                        .foregroundStyle(Color.tokens.textPrimary)
                        .lineLimit(2)
                    Spacer()
                    if let status = project.status {
                        StatusPill(status.displayName, tone: status.calendarPillTone)
                    }
                }
                Text(metaLine)
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textSecondary)
                    .lineLimit(2)
                if let category = project.category, !category.isEmpty {
                    Text(category)
                        .font(.tokens.body(10))
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, Spacing.xs + 2)
        }
        .background(Color.tokens.bgTertiary)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.sm)
                .stroke(Color.tokens.border, lineWidth: 0.5)
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.sm))
        .opacity(project.status == .completed ? 0.7 : 1)
    }

    private var metaLine: String {
        var parts: [String] = []
        if let raw = project.shootDate,
           let wallClock = CalendarMath.wallClockDate(from: raw) {
            let endTime = wallClock.addingTimeInterval(
                TimeInterval(DayDetailPanel.defaultDurationMinutes * 60)
            )
            parts.append(
                "\(Self.timeFormatter.string(from: wallClock)) – \(Self.timeFormatter.string(from: endTime))"
            )
        }
        if let location = project.location, !location.isEmpty {
            parts.append(location)
        }
        return parts.joined(separator: " · ")
    }
}
