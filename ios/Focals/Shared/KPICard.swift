import SwiftUI
import Charts
import FocalsDesign

/// A reusable KPI tile: uppercase label, big value, optional sparkline.
/// Used across the dashboard grid and (eventually) the iPad sidebar header.
public struct KPICard: View {
    let label: String
    let value: String
    let trend: [Double]?
    let trendColor: Color

    public init(
        label: String,
        value: String,
        trend: [Double]? = nil,
        trendColor: Color = Color.tokens.accent
    ) {
        self.label = label
        self.value = value
        self.trend = trend
        self.trendColor = trendColor
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(label)
                .font(.tokens.body(11))
                .textCase(.uppercase)
                .tracking(0.7)
                .foregroundStyle(Color.tokens.textTertiary)
            Text(value)
                .font(.tokens.display(28))
                .foregroundStyle(Color.tokens.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            if let trend, trend.count > 1 {
                Chart(Array(trend.enumerated()), id: \.offset) { idx, value in
                    LineMark(
                        x: .value("Index", idx),
                        y: .value("Value", value)
                    )
                    .foregroundStyle(trendColor)
                    .interpolationMethod(.monotone)
                }
                .chartYAxis(.hidden)
                .chartXAxis(.hidden)
                .frame(height: 28)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(label): \(value)")
    }
}
