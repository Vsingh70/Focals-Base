import SwiftUI
import SwiftData
import Charts
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct PnLScreen: View {
    enum Period: String, CaseIterable, Hashable {
        case month, quarter, year
        var label: String { rawValue.capitalized }
    }

    @Environment(\.modelContext) private var context
    @Query(sort: \CachedFinance.date, order: .reverse) private var cached: [CachedFinance]

    @State private var period: Period = .month

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                Picker("Period", selection: $period) {
                    ForEach(Period.allCases, id: \.self) { option in
                        Text(option.label).tag(option)
                    }
                }
                .pickerStyle(.segmented)

                summaryCard
                chartCard
                categoryCard
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.lg)
        }
        .background(Color.tokens.bg)
        .navigationTitle("Profit & Loss")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Cards

    private var summaryCard: some View {
        FormSection("Summary · \(period.label)") {
            FormRow("Income") {
                Text(currency(scopedIncome))
                    .font(.tokens.medium(18))
                    .foregroundStyle(Color.tokens.success)
                    .monospacedDigit()
            }
            FormRow("Expenses") {
                Text(currency(scopedExpense))
                    .font(.tokens.medium(18))
                    .foregroundStyle(Color.tokens.danger)
                    .monospacedDigit()
            }
            FormRow("Net profit") {
                Text(currency(scopedNet))
                    .font(.tokens.medium(20))
                    .foregroundStyle(scopedNet >= 0 ? Color.tokens.textPrimary : Color.tokens.warning)
                    .monospacedDigit()
            }
        }
    }

    private var chartCard: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Last 6 months")
                .font(.tokens.medium(13))
                .foregroundStyle(Color.tokens.textSecondary)
            if monthlySeries.allSatisfy({ $0.income == 0 && $0.expense == 0 }) {
                Text("No transactions in the last 6 months.")
                    .font(.tokens.body(13))
                    .foregroundStyle(Color.tokens.textTertiary)
                    .frame(maxWidth: .infinity, minHeight: 120)
            } else {
                Chart(monthlySeries) { row in
                    BarMark(
                        x: .value("Month", row.monthStart, unit: .month),
                        y: .value("Income", row.income)
                    )
                    .foregroundStyle(Color.tokens.success)
                    .position(by: .value("Type", "Income"))
                    BarMark(
                        x: .value("Month", row.monthStart, unit: .month),
                        y: .value("Expense", row.expense)
                    )
                    .foregroundStyle(Color.tokens.danger)
                    .position(by: .value("Type", "Expense"))
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
        }
        .padding(Spacing.md)
        .background(Color.tokens.bgSecondary)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.md)
                .stroke(Color.tokens.border, lineWidth: 0.5)
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.md))
    }

    @ViewBuilder
    private var categoryCard: some View {
        if !categoryBreakdown.isEmpty {
            FormSection("By category · \(period.label)") {
                ForEach(categoryBreakdown, id: \.0) { row in
                    HStack {
                        Text(FinanceConstants.displayCategory(row.0))
                            .font(.tokens.body(14))
                            .foregroundStyle(Color.tokens.textPrimary)
                        Spacer()
                        Text(currency(row.1))
                            .font(.tokens.medium(14))
                            .foregroundStyle(Color.tokens.textPrimary)
                            .monospacedDigit()
                    }
                }
            }
        }
    }

    // MARK: - Calculations

    private var modelTransactions: [Finance] { cached.map { $0.toModel() } }

    private var scopedTransactions: [Finance] {
        let calendar = Calendar.current
        let now = Date.now
        let cutoff: Date
        switch period {
        case .month:
            cutoff = calendar.date(from: calendar.dateComponents([.year, .month], from: now)) ?? now
        case .quarter:
            let comps = calendar.dateComponents([.year, .month], from: now)
            let m = comps.month ?? 1
            let quarterStartMonth = ((m - 1) / 3) * 3 + 1
            var cutoffComps = DateComponents()
            cutoffComps.year = comps.year
            cutoffComps.month = quarterStartMonth
            cutoffComps.day = 1
            cutoff = calendar.date(from: cutoffComps) ?? now
        case .year:
            let comps = calendar.dateComponents([.year], from: now)
            var cutoffComps = DateComponents()
            cutoffComps.year = comps.year
            cutoffComps.month = 1
            cutoffComps.day = 1
            cutoff = calendar.date(from: cutoffComps) ?? now
        }
        return modelTransactions.filter { tx in
            guard let date = tx.parsedDate(calendar: calendar) else { return false }
            return date >= cutoff
        }
    }

    private var scopedIncome: Double {
        scopedTransactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
    }
    private var scopedExpense: Double {
        scopedTransactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
    }
    private var scopedNet: Double { scopedIncome - scopedExpense }

    private var categoryBreakdown: [(String, Double)] {
        let scoped = scopedTransactions.filter { $0.type == .expense }
        let buckets = Dictionary(grouping: scoped) { $0.category ?? "uncategorized" }
        return buckets
            .map { ($0.key, $0.value.reduce(0) { $0 + $1.amount }) }
            .sorted { $0.1 > $1.1 }
    }

    private var monthlySeries: [PnLMonth] {
        let calendar = Calendar.current
        let now = Date.now
        let baseComps = calendar.dateComponents([.year, .month], from: now)
        guard let base = calendar.date(from: baseComps) else { return [] }
        var months: [Date] = []
        for offset in stride(from: 5, through: 0, by: -1) {
            if let d = calendar.date(byAdding: .month, value: -offset, to: base) {
                months.append(d)
            }
        }
        let earliest = months.first ?? now
        var byMonth: [Date: (income: Double, expense: Double)] = [:]
        months.forEach { byMonth[$0] = (0, 0) }
        for tx in modelTransactions {
            guard let date = tx.parsedDate(calendar: calendar), date >= earliest else { continue }
            let monthComps = calendar.dateComponents([.year, .month], from: date)
            guard let monthStart = calendar.date(from: monthComps),
                  byMonth[monthStart] != nil else { continue }
            if tx.type == .income {
                byMonth[monthStart]?.income += tx.amount
            } else {
                byMonth[monthStart]?.expense += tx.amount
            }
        }
        return months.map { PnLMonth(monthStart: $0, income: byMonth[$0]?.income ?? 0, expense: byMonth[$0]?.expense ?? 0) }
    }

    private func currency(_ value: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        f.maximumFractionDigits = 0
        f.minimumFractionDigits = 0
        return f.string(from: NSNumber(value: value)) ?? "$\(Int(value))"
    }
}

struct PnLMonth: Identifiable {
    let monthStart: Date
    let income: Double
    let expense: Double
    var id: Date { monthStart }
}
