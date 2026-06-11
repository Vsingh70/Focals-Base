import SwiftUI
import FocalsDesign
import FocalsModels

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

private struct UpcomingProjectCard: View {
    let project: Project

    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "d"
        return f
    }()

    private static let weekdayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return f
    }()

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.sm) {
            if let shootDate = project.shootDate {
                VStack(spacing: 2) {
                    Text(Self.weekdayFormatter.string(from: shootDate).uppercased())
                        .font(.tokens.medium(11))
                        .tracking(0.6)
                        .foregroundStyle(Color.tokens.textTertiary)
                    Text(Self.dayFormatter.string(from: shootDate))
                        .font(.tokens.display(28))
                        .foregroundStyle(Color.tokens.textPrimary)
                }
                .frame(width: 44)
            }

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text(project.title)
                    .font(.tokens.medium(15))
                    .foregroundStyle(Color.tokens.textPrimary)
                    .lineLimit(1)
                if let location = project.location, !location.isEmpty {
                    Text(location)
                        .font(.tokens.body(12))
                        .foregroundStyle(Color.tokens.textTertiary)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                if let status = project.status {
                    StatusPill(status.displayName, tone: tone(for: status))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(Spacing.sm)
        .frame(width: 220, height: 100)
        .background(Color.tokens.bgSecondary)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.md)
                .stroke(Color.tokens.border, lineWidth: 0.5)
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.md))
    }

    private func tone(for status: ProjectStatus) -> StatusPill.Tone {
        switch status {
        case .inquiry, .editing:           return .neutral
        case .booked, .inProgress:         return .accent
        case .delivered, .completed:       return .success
        case .cancelled:                   return .danger
        }
    }
}
