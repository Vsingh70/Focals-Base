import SwiftUI
import SwiftData
import UniformTypeIdentifiers
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct FinancesScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedFinance.date, order: .reverse) private var cached: [CachedFinance]

    @State private var search = ""
    @State private var hasLoadedOnce = false
    @State private var actionError: String?

    var body: some View {
        Group {
            if cached.isEmpty && hasLoadedOnce {
                EmptyState(
                    symbol: "dollarsign.circle",
                    title: "No transactions yet",
                    description: "Tap + to log your first income or expense."
                )
            } else if cached.isEmpty {
                SkeletonList(count: 6)
            } else {
                content
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Finances")
        .toolbar { toolbarContent }
        .searchable(text: $search, prompt: "Search transactions")
        .refreshable { await refresh() }
        .task {
            if !hasLoadedOnce {
                await refresh()
                hasLoadedOnce = true
            }
        }
        .alert(
            "Couldn't update",
            isPresented: Binding(
                get: { actionError != nil },
                set: { if !$0 { actionError = nil } }
            ),
            presenting: actionError
        ) { _ in
            Button("OK", role: .cancel) {}
        } message: { error in
            Text(error)
        }
    }

    private var content: some View {
        List {
            ForEach(grouped) { group in
                Section {
                    ForEach(group.transactions, id: \.id) { tx in
                        Button {
                            Haptics.tap()
                            AppRouter.shared.presentedSheet = .editFinance(tx)
                        } label: {
                            FinanceRow(tx: tx)
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(Color.tokens.bgSecondary)
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                Task { await delete(tx) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                } header: {
                    monthHeader(group)
                }
            }
        }
        .listStyle(.plain)
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Button {
                AppRouter.shared.navigate(to: .financesPnL)
            } label: {
                Label("P&L", systemImage: "chart.bar")
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                Button {
                    AppRouter.shared.presentedSheet = .createFinance(preselectedType: .income)
                } label: {
                    Label("Log income", systemImage: "plus.circle")
                }
                Button {
                    AppRouter.shared.presentedSheet = .createFinance(preselectedType: .expense)
                } label: {
                    Label("Log expense", systemImage: "minus.circle")
                }
                Divider()
                ShareLink(
                    item: csvFile,
                    preview: SharePreview(
                        "Finances export",
                        image: Image(systemName: "tablecells")
                    )
                ) {
                    Label("Export CSV", systemImage: "square.and.arrow.up")
                }
            } label: {
                Image(systemName: "plus")
            }
        }
    }

    private func monthHeader(_ group: MonthGroup) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(group.label)
                .font(.tokens.medium(11))
                .textCase(.uppercase)
                .tracking(0.7)
                .foregroundStyle(Color.tokens.textTertiary)
            Spacer()
            HStack(spacing: Spacing.xs) {
                Text("+\(currency(group.totalIncome))")
                    .foregroundStyle(Color.tokens.success)
                Text("/")
                    .foregroundStyle(Color.tokens.textTertiary)
                Text("-\(currency(group.totalExpense))")
                    .foregroundStyle(Color.tokens.danger)
            }
            .font(.tokens.medium(11))
            .monospacedDigit()
        }
    }

    // MARK: - Grouping

    private var modelTransactions: [Finance] {
        cached.map { $0.toModel() }
    }

    private var filtered: [Finance] {
        let needle = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !needle.isEmpty else { return modelTransactions }
        return modelTransactions.filter { tx in
            let haystack = [
                tx.description ?? "",
                tx.category ?? "",
                tx.paymentMethod ?? "",
            ].joined(separator: " ")
            return haystack.localizedCaseInsensitiveContains(needle)
        }
    }

    private var grouped: [MonthGroup] {
        let calendar = Calendar.current
        let buckets = Dictionary(grouping: filtered) { tx -> String in
            let date = tx.parsedDate(calendar: calendar) ?? Date.distantPast
            let comps = calendar.dateComponents([.year, .month], from: date)
            return String(format: "%04d-%02d", comps.year ?? 0, comps.month ?? 0)
        }
        return buckets.map { key, items -> MonthGroup in
            let income = items.filter { $0.type == .income }.reduce(0.0) { $0 + $1.amount }
            let expense = items.filter { $0.type == .expense }.reduce(0.0) { $0 + $1.amount }
            let firstDate = items.compactMap { $0.parsedDate() }.first ?? .now
            let label = firstDate.formatted(.dateTime.month(.wide).year())
            let sorted = items.sorted {
                ($0.parsedDate() ?? .distantPast) > ($1.parsedDate() ?? .distantPast)
            }
            return MonthGroup(
                id: key,
                label: label,
                totalIncome: income,
                totalExpense: expense,
                transactions: sorted
            )
        }
        .sorted { $0.id > $1.id }
    }

    private func currency(_ value: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        f.maximumFractionDigits = 0
        f.minimumFractionDigits = 0
        return f.string(from: NSNumber(value: value)) ?? "$\(Int(value))"
    }

    // MARK: - Mutations

    private func refresh() async {
        try? await FinancesCacheRepository.shared.refresh(in: context)
    }

    private func delete(_ tx: Finance) async {
        do {
            try await FinancesCacheRepository.shared.delete(id: tx.id, in: context)
            Haptics.medium()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }

    // MARK: - CSV

    private var csvFile: URL {
        FinancesCSVExport.write(transactions: modelTransactions)
    }
}

struct MonthGroup: Identifiable {
    let id: String
    let label: String
    let totalIncome: Double
    let totalExpense: Double
    let transactions: [Finance]
}

private struct FinanceRow: View {
    let tx: Finance

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(displayTitle)
                    .font(.tokens.medium(15))
                    .foregroundStyle(Color.tokens.textPrimary)
                    .lineLimit(1)
                HStack(spacing: Spacing.xs) {
                    StatusPill(
                        tx.type.rawValue.capitalized,
                        tone: tx.type == .income ? .success : .danger
                    )
                    if let category = tx.category, !category.isEmpty {
                        Text("·  \(FinanceConstants.displayCategory(category))")
                            .font(.tokens.body(12))
                            .foregroundStyle(Color.tokens.textTertiary)
                            .lineLimit(1)
                    }
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(tx.signedAmountString)
                    .font(.tokens.medium(15))
                    .foregroundStyle(tx.type == .income ? Color.tokens.success : Color.tokens.danger)
                    .monospacedDigit()
                if let date = tx.parsedDate() {
                    Text(date.formatted(.dateTime.month(.abbreviated).day()))
                        .font(.tokens.body(12))
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
        }
        .padding(.vertical, Spacing.xs)
    }

    private var displayTitle: String {
        if let description = tx.description, !description.isEmpty {
            return description
        }
        return FinanceConstants.displayCategory(tx.category)
    }
}
