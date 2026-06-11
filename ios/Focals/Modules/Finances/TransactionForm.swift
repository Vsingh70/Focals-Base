import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

/// Mirrors the web's `TransactionForm.tsx`: type is fixed at create time
/// (not editable on edit), amount is a positive Decimal, date is a YYYY-MM-DD
/// wall-clock string, category and payment method are free-text with a
/// canonical picker, project is optional.
struct TransactionForm: View {
    enum Mode: Hashable {
        case create(defaultType: FinanceType)
        case edit(Finance)
    }

    let mode: Mode

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedProject.updatedAt, order: .reverse) private var cachedProjects: [CachedProject]

    @State private var amount: Double?
    @State private var date: Date
    @State private var category: String
    @State private var paymentMethod: String
    @State private var description: String?
    @State private var projectId: UUID?

    @State private var isSaving = false
    @State private var error: String?
    @State private var showDeleteConfirm = false

    init(mode: Mode) {
        self.mode = mode
        switch mode {
        case .create:
            _amount = State(initialValue: nil)
            _date = State(initialValue: .now)
            _category = State(initialValue: "")
            _paymentMethod = State(initialValue: "")
            _description = State(initialValue: nil)
            _projectId = State(initialValue: nil)
        case .edit(let tx):
            _amount = State(initialValue: tx.amount)
            _date = State(initialValue: tx.parsedDate() ?? .now)
            _category = State(initialValue: tx.category ?? "")
            _paymentMethod = State(initialValue: tx.paymentMethod ?? "")
            _description = State(initialValue: tx.description)
            _projectId = State(initialValue: tx.projectId)
        }
    }

    private var transactionType: FinanceType {
        switch mode {
        case .create(let defaultType):       return defaultType
        case .edit(let tx):                  return tx.type
        }
    }

    private var isEdit: Bool {
        if case .edit = mode { return true }
        return false
    }

    private var screenTitle: String {
        switch mode {
        case .create(let t):
            return t == .income ? "Log income" : "Log expense"
        case .edit(let tx):
            return "Edit \(tx.type.rawValue)"
        }
    }

    private var projects: [Project] {
        cachedProjects.map { $0.toModel() }
    }

    var body: some View {
        DetailSheet(title: screenTitle) {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    typeBadge

                    FormSection("Details") {
                        MoneyField(value: $amount, label: "Amount")
                        FormRow("Date") {
                            DatePicker(
                                "",
                                selection: $date,
                                displayedComponents: .date
                            )
                            .labelsHidden()
                        }
                        categoryPicker
                        paymentMethodPicker
                        RelatedRecordField(
                            selectedId: $projectId,
                            label: "Project",
                            placeholder: "No project",
                            options: projects,
                            display: { $0.title },
                            secondary: { $0.shootDate?.formatted(.dateTime.month(.abbreviated).day().year()) }
                        )
                        FormRow("Description") {
                            TextField("Optional notes", text: $description.bound, axis: .vertical)
                                .lineLimit(2...5)
                        }
                    }

                    if let error {
                        Text(error)
                            .font(.tokens.body(13))
                            .foregroundStyle(Color.tokens.danger)
                    }

                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving {
                            ProgressView().frame(maxWidth: .infinity)
                        } else {
                            Text(isEdit ? "Save changes" : (transactionType == .income ? "Log income" : "Log expense"))
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.tokens.accent)
                    .disabled(!isValid || isSaving)

                    if isEdit {
                        Button(role: .destructive) {
                            showDeleteConfirm = true
                        } label: {
                            Text("Delete transaction")
                                .frame(maxWidth: .infinity, minHeight: 44)
                        }
                        .buttonStyle(.bordered)
                        .tint(Color.tokens.danger)
                        .disabled(isSaving)
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.tokens.bg)
        }
        .confirmationDialog(
            "Delete this transaction?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete transaction", role: .destructive) {
                Task { await deleteTransaction() }
            }
            Button("Cancel", role: .cancel) {}
        }
    }

    private var typeBadge: some View {
        StatusPill(
            transactionType.rawValue.capitalized,
            tone: transactionType == .income ? .success : .danger
        )
    }

    private var categoryPicker: some View {
        FormRow("Category") {
            Menu {
                Button("Custom (keep typed)") { /* keep current */ }
                ForEach(FinanceConstants.categories, id: \.self) { option in
                    Button(FinanceConstants.displayCategory(option)) { category = option }
                }
                if !category.isEmpty && !FinanceConstants.categories.contains(category) {
                    Button("Clear") { category = "" }
                }
            } label: {
                HStack {
                    TextField("Category", text: $category)
                        .autocapitalization(.none)
                    Image(systemName: "chevron.up.chevron.down")
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
            .buttonStyle(.plain)
        }
    }

    private var paymentMethodPicker: some View {
        FormRow("Payment method") {
            Menu {
                ForEach(FinanceConstants.paymentMethods, id: \.self) { option in
                    Button(FinanceConstants.displayPaymentMethod(option)) { paymentMethod = option }
                }
                if !paymentMethod.isEmpty {
                    Button("Clear") { paymentMethod = "" }
                }
            } label: {
                HStack {
                    TextField("Payment method", text: $paymentMethod)
                        .autocapitalization(.none)
                    Image(systemName: "chevron.up.chevron.down")
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
            .buttonStyle(.plain)
        }
    }

    private var isValid: Bool {
        guard let amount, amount > 0 else { return false }
        return true
    }

    private func save() async {
        guard let amount, amount > 0 else { return }
        isSaving = true
        defer { isSaving = false }

        let formattedDate = Self.dateString(from: date)
        let userId = SessionStore.shared.user?.id ?? UUID()
        let payload: Finance
        switch mode {
        case .create:
            payload = Finance(
                id: UUID(),
                userId: userId,
                type: transactionType,
                amount: amount,
                date: formattedDate,
                category: category.isEmpty ? nil : category,
                description: description,
                paymentMethod: paymentMethod.isEmpty ? nil : paymentMethod,
                projectId: projectId,
                createdAt: .now
            )
        case .edit(let existing):
            payload = Finance(
                id: existing.id,
                userId: existing.userId,
                type: existing.type,
                amount: amount,
                date: formattedDate,
                category: category.isEmpty ? nil : category,
                description: description,
                paymentMethod: paymentMethod.isEmpty ? nil : paymentMethod,
                projectId: projectId,
                createdAt: existing.createdAt
            )
        }

        do {
            switch mode {
            case .create:
                _ = try await FinancesCacheRepository.shared.create(payload, in: context)
            case .edit:
                _ = try await FinancesCacheRepository.shared.update(payload, in: context)
            }
            Haptics.success()
            dismiss()
        } catch {
            Haptics.error()
            self.error = error.asFocalsError().errorDescription
        }
    }

    private func deleteTransaction() async {
        guard case .edit(let tx) = mode else { return }
        isSaving = true
        defer { isSaving = false }
        do {
            try await FinancesCacheRepository.shared.delete(id: tx.id, in: context)
            Haptics.medium()
            dismiss()
        } catch {
            Haptics.error()
            self.error = error.asFocalsError().errorDescription
        }
    }

    static func dateString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = .current
        return formatter.string(from: date)
    }
}
