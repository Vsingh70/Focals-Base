# Task 10 — Finances

## Goal

Build the income/expense module: month-grouped transaction list, P&L view, receipt capture from camera or photo library, CSV export, and a "Log expense" Siri shortcut. After this task, every transaction the user logs on iOS appears identically on web `/finances`, and Siri can log an expense via voice.

Reference: [my-app/src/app/(dashboard)/finances/](../../my-app/src/app/(dashboard)/finances/).

---

## Layout

```
┌──────────────────────────────────────────┐
│ ← Finances              [P&L] [Export][⊕]│
│ ──────────────────────────────────────── │
│ April 2026               +$2,450 / -$840 │
│ ──────────────────────────────────────── │
│ Apr 24  Wedding deposit       +$1,500    │
│         Income · Sarah J                  │
│ Apr 18  Lens rental             -$240    │
│         Expense · Equipment              │
│ Apr 12  Portrait full payment +$950      │
│ ──────────────────────────────────────── │
│ March 2026               +$3,100 / -$520 │
│ …                                        │
└──────────────────────────────────────────┘
```

Pull-to-refresh, skeleton, empty state, search by description.

---

## Step 1 — `FinancesScreen` (list)

```swift
struct FinancesScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedFinance.date, order: .reverse) private var cached: [CachedFinance]

    @State private var search = ""

    var body: some View {
        List {
            ForEach(grouped) { group in
                Section {
                    ForEach(group.transactions) { tx in
                        FinanceRow(tx: tx.toModel())
                            .onTapGesture {
                                AppRouter.shared.presentedSheet = .editFinance(tx.toModel())
                            }
                    }
                    .onDelete { offsets in
                        Task { try? await delete(group: group, offsets: offsets) }
                    }
                } header: {
                    monthHeader(group)
                }
            }
        }
        .listStyle(.plain)
        .searchable(text: $search)
        .refreshable {
            try? await FinancesCacheRepository.shared.refresh(in: context)
        }
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                NavigationLink("P&L", value: Route.financesPnL)
            }
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Export CSV") { Task { await exportCSV() } }
                    Button("New transaction") { AppRouter.shared.presentedSheet = .createFinance(preselectedType: nil) }
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .navigationTitle("Finances")
    }
}
```

Add `Route.financesPnL` to `Route` enum (Task 04). Update `routeDestination(_:)` to render `PnLScreen()`.

## Step 2 — `FinanceRow`

```swift
struct FinanceRow: View {
    let tx: Finance
    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text(tx.description ?? "—")
                    .font(.tokens.medium(15))
                    .foregroundStyle(.tokens.textPrimary)
                HStack(spacing: Spacing.xs) {
                    StatusPill(tx.type.rawValue.capitalized, tone: tx.type == .income ? .success : .danger)
                    if let cat = tx.category {
                        Text("· \(cat)")
                            .font(.tokens.body(12))
                            .foregroundStyle(.tokens.textTertiary)
                    }
                }
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text(formattedAmount)
                    .font(.tokens.medium(15))
                    .foregroundStyle(tx.type == .income ? .tokens.success : .tokens.danger)
                Text(tx.date.formatted(.dateTime.month(.abbreviated).day()))
                    .font(.tokens.body(12))
                    .foregroundStyle(.tokens.textTertiary)
            }
        }
        .padding(.vertical, Spacing.xs)
    }
    private var formattedAmount: String {
        let prefix = tx.type == .income ? "+" : "-"
        return "\(prefix)\(tx.amount.currencyString)"
    }
}
```

## Step 3 — Month grouping

```swift
struct MonthGroup: Identifiable {
    let id: String           // "2026-04"
    let label: String        // "April 2026"
    let totalIncome: Decimal
    let totalExpense: Decimal
    let transactions: [CachedFinance]
}

private var grouped: [MonthGroup] {
    Dictionary(grouping: filtered) { tx in
        let cal = Calendar.current
        return String(format: "%04d-%02d", cal.component(.year, from: tx.date), cal.component(.month, from: tx.date))
    }
    .map { key, items in
        let income = items.filter { $0.type == "income" }.reduce(Decimal(0)) { $0 + $1.amount }
        let expense = items.filter { $0.type == "expense" }.reduce(Decimal(0)) { $0 + $1.amount }
        let firstDate = items.first?.date ?? .now
        return MonthGroup(
            id: key,
            label: firstDate.formatted(.dateTime.month(.wide).year()),
            totalIncome: income,
            totalExpense: expense,
            transactions: items.sorted { $0.date > $1.date }
        )
    }
    .sorted { $0.id > $1.id }
}
```

Header view shows the month label and `+$X.XX / -$Y.YY` totals.

## Step 4 — `FinanceForm`

Fields:
- Type (segmented: Income / Expense)
- Amount (`MoneyField`)
- Date (`DateField`)
- Category (picker — see Step 5)
- Project (RelatedRecordField, optional — links tx to project for P&L breakdown)
- Description (TextField)
- Receipt photo (Step 6)
- Payment method (picker — Cash, Card, Bank Transfer, Other)

## Step 5 — Categories

Match web's `category` enum. Read [my-app/src/lib/validations/finances.ts](../../my-app/src/lib/validations/finances.ts) (or wherever the schema lives — verify in the actual codebase). Hard-coded in `FocalsModels/FinanceCategory.swift`:

```swift
public enum FinanceCategory: String, Codable, CaseIterable, Sendable {
    // Income
    case bookingDeposit = "booking_deposit"
    case bookingFinal   = "booking_final"
    case licensing
    case prints
    // Expense
    case equipment
    case software
    case travel
    case insurance
    case marketing
    case other

    public static var income: [FinanceCategory] {
        [.bookingDeposit, .bookingFinal, .licensing, .prints]
    }
    public static var expense: [FinanceCategory] {
        [.equipment, .software, .travel, .insurance, .marketing, .other]
    }
}
```

Form filters categories by selected type.

## Step 6 — Receipt capture

Two paths:
1. **PhotosPicker** (library)
2. **Camera** (UIKit `UIImagePickerController` wrapped in `UIViewControllerRepresentable`)

```swift
@State private var receiptImage: UIImage?
@State private var showCamera = false
@State private var photoItem: PhotosPickerItem?

VStack {
    if let receiptImage {
        Image(uiImage: receiptImage)
            .resizable()
            .scaledToFit()
            .frame(maxHeight: 200)
            .cardStyle()
    }
    HStack {
        PhotosPicker("Pick photo", selection: $photoItem, matching: .images)
        Button("Take photo") { showCamera = true }
    }
}
.sheet(isPresented: $showCamera) {
    CameraView { image in
        receiptImage = image
        showCamera = false
    }
}
.onChange(of: photoItem) { _, item in
    Task { receiptImage = await loadImage(from: item) }
}
```

For v1, store the image as **base64 in `description` field** with a sentinel prefix `[receipt:base64,...]` — hacky but avoids a Storage bucket migration. Document the v1.1 plan in `ios/Focals/Modules/Finances/RECEIPT_STORAGE.md`:

> v1: receipts stored as base64 in `finances.description` with sentinel prefix. Limit: 1MB after JPEG-80 compression.
> v1.1: introduce a `receipts` Storage bucket, store URL in `finances.receipt_url`. Migrate existing base64 records on first read.

`Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>[APP_NAME] needs camera access to capture receipts.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>[APP_NAME] needs photo library access to attach receipts to transactions.</string>
```

## Step 7 — P&L view

`PnLScreen`:

```
┌──────────────────────────────────────────┐
│ Profit & Loss                            │
│ ──────────────────────────────────────── │
│ [Month] [Quarter] [Year]    Period picker│
│ ──────────────────────────────────────── │
│ Income       $14,500                     │
│ Expenses     $3,820                      │
│ Net Profit   $10,680                     │
│ ──────────────────────────────────────── │
│ ┌──────────────────────────────────────┐│
│ │ Bar chart: income vs expense, 6 months│
│ └──────────────────────────────────────┘│
│ ──────────────────────────────────────── │
│ By category                              │
│  Equipment        $1,200                 │
│  Software           $480                 │
│  …                                       │
└──────────────────────────────────────────┘
```

Use Apple Charts `BarMark`. Period toggle filters the underlying transactions.

## Step 8 — CSV export

```swift
import UniformTypeIdentifiers

struct FinancesCSV: Transferable {
    let transactions: [Finance]

    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(exportedContentType: .commaSeparatedText) { csv in
            let header = "Date,Type,Amount,Category,Description,Payment Method,Project ID\n"
            let rows = csv.transactions.map { tx in
                "\(tx.date.iso8601),\(tx.type.rawValue),\(tx.amount),\(tx.category ?? ""),\"\(tx.description?.replacingOccurrences(of: "\"", with: "\"\"") ?? "")\",\(tx.paymentMethod ?? ""),\(tx.projectId?.uuidString ?? "")"
            }.joined(separator: "\n")
            return Data((header + rows).utf8)
        }
        .suggestedFileName { _ in "finances-\(Date.now.iso8601Day).csv" }
    }
}

ShareLink(item: FinancesCSV(transactions: cached.map { $0.toModel() })) {
    Label("Export CSV", systemImage: "square.and.arrow.up")
}
```

## Step 9 — "Log expense" Siri shortcut

This is shared with Task 13 — define the AppIntent here, register it there.

```swift
import AppIntents

struct LogExpenseIntent: AppIntent {
    static let title: LocalizedStringResource = "Log Expense"
    static let description: IntentDescription = "Log a quick expense in [APP_NAME]."

    @Parameter(title: "Amount") var amount: Double
    @Parameter(title: "Description") var description: String?
    @Parameter(title: "Category") var category: FinanceCategoryEntity?

    static var parameterSummary: some ParameterSummary {
        Summary("Log expense \(\.$amount) for \(\.$description)")
    }

    func perform() async throws -> some IntentResult {
        let finance = Finance(
            id: UUID(),
            userId: SessionStore.shared.user!.id,
            type: .expense,
            amount: Decimal(amount),
            date: .now,
            category: category?.id ?? "other",
            description: description,
            paymentMethod: nil,
            projectId: nil,
            createdAt: .now
        )
        // Cache repo would need access to the SwiftData container — use a static helper
        try await FinancesCacheRepository.shared.create(finance, in: backgroundContext())
        return .result(dialog: "Logged $\(amount) expense")
    }
}
```

The intent is exposed in Shortcuts, Spotlight, and Siri voice once registered in Task 13.

---

## Acceptance Criteria

- [ ] List groups transactions by month with monthly totals (income / expense)
- [ ] Tap a row opens edit form; form saves changes
- [ ] Create form: Type segmented, MoneyField, category picker filters by type, project picker (optional), receipt capture
- [ ] Camera permission denied / library permission denied → actionable message
- [ ] Receipts persist (base64 in description with sentinel) and re-render after app restart
- [ ] P&L view shows correct totals for Month / Quarter / Year toggles, matches web `/finances`
- [ ] Bar chart shows income vs expense for 6 months
- [ ] By-category breakdown matches web
- [ ] CSV export opens cleanly in Numbers and contains all transactions
- [ ] "Log expense" Siri shortcut creates a finance row (verified via Shortcuts app: tap → triggers → row appears in list)
- [ ] Search filters by description
- [ ] Swipe-left to delete, with confirm
- [ ] Offline create shows error toast; list still renders cached

## Depends on

- 04 (Shell, sheet infrastructure)
- 05 (`FinancesCacheRepository`)
- 09 (`MoneyField`, `DateField`, `StatusField`, `RelatedRecordField`)
