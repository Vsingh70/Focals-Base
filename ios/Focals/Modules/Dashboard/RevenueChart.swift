import SwiftUI
import Charts
import FocalsAPI
import FocalsDesign

struct RevenueChart: View {
    let data: [DashboardMonthRevenue]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Revenue")
                .font(.tokens.medium(13))
                .foregroundStyle(Color.tokens.textSecondary)
            Chart(data) { point in
                BarMark(
                    x: .value("Month", point.monthStart, unit: .month),
                    y: .value("Revenue", NSDecimalNumber(decimal: point.income).doubleValue)
                )
                .foregroundStyle(Color.tokens.accent.gradient)
                .cornerRadius(Radius.sm)
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { _ in
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading) { _ in
                    AxisGridLine().foregroundStyle(Color.tokens.border)
                    AxisValueLabel().foregroundStyle(Color.tokens.textTertiary)
                }
            }
            .frame(height: 180)
        }
        .padding(.vertical, Spacing.sm)
        .cardStyle()
    }
}
