import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

/// Single sheet for create + edit. Mirrors `ProjectForm.tsx` field-for-field
/// (title, client, category, status, shoot date & time, location, package
/// price, amount paid, payment status, notes). The web's "AI suggest a slot"
/// affordance is intentionally not ported — it's a server action with an
/// LLM call out of scope for this task.
struct ProjectForm: View {
    enum Mode: Hashable {
        case create(presetShootDate: Date?)
        case edit(Project)
    }

    let mode: Mode

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedClient.fullName, order: .forward) private var cachedClients: [CachedClient]

    // Draft fields
    @State private var title: String
    @State private var clientId: UUID?
    @State private var category: String?
    @State private var status: ProjectStatus
    @State private var shootDate: Date?
    @State private var location: String?
    @State private var packagePrice: Double?
    @State private var amountPaid: Double?
    @State private var paymentStatus: PaymentStatus
    @State private var notes: String?

    @State private var isSaving = false
    @State private var error: String?

    init(mode: Mode) {
        self.mode = mode
        switch mode {
        case .create(let presetShootDate):
            _title = State(initialValue: "")
            _clientId = State(initialValue: nil)
            _category = State(initialValue: nil)
            _status = State(initialValue: .inquiry)
            _shootDate = State(initialValue: presetShootDate)
            _location = State(initialValue: nil)
            _packagePrice = State(initialValue: nil)
            _amountPaid = State(initialValue: nil)
            _paymentStatus = State(initialValue: .unpaid)
            _notes = State(initialValue: nil)
        case .edit(let project):
            _title = State(initialValue: project.title)
            _clientId = State(initialValue: project.clientId)
            _category = State(initialValue: project.category)
            _status = State(initialValue: project.status ?? .inquiry)
            _shootDate = State(initialValue: project.shootDate.flatMap {
                CalendarMath.wallClockDate(from: $0)
            })
            _location = State(initialValue: project.location)
            _packagePrice = State(initialValue: project.packagePrice)
            _amountPaid = State(initialValue: project.amountPaid)
            _paymentStatus = State(initialValue: project.paymentStatus ?? .unpaid)
            _notes = State(initialValue: project.notes)
        }
    }

    private var isEdit: Bool {
        if case .edit = mode { return true }
        return false
    }

    private var clients: [Client] {
        cachedClients.map { $0.toModel() }
    }

    var body: some View {
        DetailSheet(
            title: isEdit ? "Edit project" : "New project",
            confirmTitle: isEdit ? "Done" : "Add",
            confirmDisabled: !isValid,
            isWorking: isSaving,
            onConfirm: { Task { await save() } }
        ) {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    FormSection("Basics") {
                        FormRow("Title") {
                            TextField("e.g. Johnson family portraits", text: $title)
                                .textInputAutocapitalization(.words)
                        }
                        RelatedRecordField(
                            selectedId: $clientId,
                            label: "Client",
                            placeholder: "No client",
                            options: clients,
                            display: { $0.fullName },
                            secondary: { $0.email }
                        )
                        FormRow("Category") {
                            TextField("portrait, wedding, editorial…", text: $category.bound)
                                .textInputAutocapitalization(.never)
                        }
                        StatusField(
                            value: $status,
                            label: "Status",
                            display: { $0.displayName }
                        )
                        DateField(date: $shootDate, label: "Shoot date & time")
                        FormRow("Location") {
                            TextField("Studio, venue, address…", text: $location.bound)
                        }
                    }

                    FormSection("Payment") {
                        MoneyField(value: $packagePrice, label: "Package price")
                        MoneyField(value: $amountPaid, label: "Amount paid")
                        FormRow("Payment status") {
                            Picker("Payment status", selection: $paymentStatus) {
                                ForEach(PaymentStatus.allCases, id: \.self) { option in
                                    Text(option.rawValue.capitalized).tag(option)
                                }
                            }
                            .pickerStyle(.segmented)
                        }
                        if let balance = balanceDue {
                            FormRow("Balance due") {
                                Text(balance, format: .currency(code: "USD"))
                                    .font(.tokens.medium(15))
                                    .foregroundStyle(balance > 0 ? Color.tokens.warning : Color.tokens.success)
                            }
                        }
                    }

                    FormSection("Notes") {
                        TextField("Anything to remember…", text: $notes.bound, axis: .vertical)
                            .lineLimit(3...8)
                    }

                    if let error {
                        Text(error)
                            .font(.tokens.body(13))
                            .foregroundStyle(Color.tokens.danger)
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.tokens.bg)
        }
    }

    private var isValid: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var balanceDue: Double? {
        guard let price = packagePrice else { return nil }
        return max(0, price - (amountPaid ?? 0))
    }

    private func save() async {
        guard isValid else { return }
        isSaving = true
        defer { isSaving = false }

        // Pack the user-typed wall-clock date back into a UTC-anchored Date so
        // the stored timestamp matches the web's wall-clock convention. Mirror
        // of `wallClockDate` from the web side.
        let wallClockUTC: Date? = shootDate.flatMap { localDate in
            let localComps = Calendar.current.dateComponents(
                [.year, .month, .day, .hour, .minute, .second],
                from: localDate
            )
            var utcCalendar = Calendar(identifier: .gregorian)
            utcCalendar.timeZone = TimeZone(identifier: "UTC")!
            return utcCalendar.date(from: localComps)
        }

        let now = Date.now
        let userId = SessionStore.shared.user?.id ?? UUID()
        let payload: Project
        switch mode {
        case .create:
            payload = Project(
                id: UUID(),
                userId: userId,
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                clientId: clientId,
                category: category,
                status: status,
                shootDate: wallClockUTC,
                location: location,
                packagePrice: packagePrice,
                amountPaid: amountPaid ?? 0,
                paymentStatus: paymentStatus,
                notes: notes,
                createdAt: now,
                updatedAt: now
            )
        case .edit(let existing):
            payload = Project(
                id: existing.id,
                userId: existing.userId,
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                clientId: clientId,
                category: category,
                status: status,
                shootDate: wallClockUTC,
                location: location,
                packagePrice: packagePrice,
                amountPaid: amountPaid ?? 0,
                paymentStatus: paymentStatus,
                notes: notes,
                createdAt: existing.createdAt,
                updatedAt: now
            )
        }

        do {
            switch mode {
            case .create:
                _ = try await ProjectsCacheRepository.shared.create(payload, in: context)
            case .edit:
                _ = try await ProjectsCacheRepository.shared.update(payload, in: context)
            }
            Haptics.success()
            dismiss()
        } catch {
            Haptics.error()
            self.error = error.asFocalsError().errorDescription
        }
    }
}
