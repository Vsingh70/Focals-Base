import SwiftUI
import Charts
import FocalsAPI
import FocalsDesign
import FocalsModels

struct ProjectStatusDonut: View {
    let breakdown: [DashboardStatusCount]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Projects by status")
                .font(.tokens.medium(13))
                .foregroundStyle(Color.tokens.textSecondary)

            HStack(spacing: Spacing.md) {
                Chart(breakdown) { row in
                    SectorMark(
                        angle: .value("Count", row.count),
                        innerRadius: .ratio(0.6),
                        angularInset: 2
                    )
                    .foregroundStyle(color(for: row.status))
                    .cornerRadius(2)
                }
                .chartLegend(.hidden)
                .frame(width: 120, height: 120)

                VStack(alignment: .leading, spacing: Spacing.xs) {
                    ForEach(breakdown) { row in
                        HStack {
                            Circle()
                                .fill(color(for: row.status))
                                .frame(width: 8, height: 8)
                            Text(row.status.displayName)
                                .font(.tokens.body(13))
                                .foregroundStyle(Color.tokens.textSecondary)
                            Spacer()
                            Text("\(row.count)")
                                .font(.tokens.medium(13))
                                .foregroundStyle(Color.tokens.textPrimary)
                                .monospacedDigit()
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .cardStyle()
    }

    private func color(for status: ProjectStatus) -> Color {
        switch status {
        case .inquiry:    return Color.tokens.textTertiary
        case .booked:     return Color.tokens.accent
        case .inProgress: return Color.tokens.warning
        case .editing:    return Color.tokens.warning.opacity(0.6)
        case .delivered:  return Color.tokens.success
        case .completed:  return Color.tokens.success.opacity(0.6)
        case .cancelled:  return Color.tokens.danger
        }
    }
}
