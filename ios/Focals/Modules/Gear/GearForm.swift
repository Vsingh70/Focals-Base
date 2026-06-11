import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct GearForm: View {
    enum Mode: Hashable {
        case create
        case edit(Gear)
    }

    let mode: Mode

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    @State private var name: String
    @State private var brand: String?
    @State private var model: String?
    @State private var category: String?
    @State private var status: GearStatus
    @State private var serialNumber: String?
    @State private var purchasePrice: Double?
    @State private var purchaseDate: Date?
    @State private var notes: String?

    @State private var isSaving = false
    @State private var error: String?

    static let categories = ["Camera", "Lens", "Lighting", "Audio", "Accessory", "Other"]

    init(mode: Mode) {
        self.mode = mode
        switch mode {
        case .create:
            _name = State(initialValue: "")
            _brand = State(initialValue: nil)
            _model = State(initialValue: nil)
            _category = State(initialValue: nil)
            _status = State(initialValue: .owned)
            _serialNumber = State(initialValue: nil)
            _purchasePrice = State(initialValue: nil)
            _purchaseDate = State(initialValue: nil)
            _notes = State(initialValue: nil)
        case .edit(let gear):
            _name = State(initialValue: gear.name)
            _brand = State(initialValue: gear.brand)
            _model = State(initialValue: gear.model)
            _category = State(initialValue: gear.category)
            _status = State(initialValue: gear.status ?? .owned)
            _serialNumber = State(initialValue: gear.serialNumber)
            _purchasePrice = State(initialValue: gear.purchasePrice)
            _purchaseDate = State(initialValue: Self.parseDate(gear.purchaseDate))
            _notes = State(initialValue: gear.notes)
        }
    }

    private var isEdit: Bool {
        if case .edit = mode { return true }
        return false
    }

    var body: some View {
        DetailSheet(title: isEdit ? "Edit gear" : "New gear") {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    FormSection("Basics") {
                        FormRow("Name") {
                            TextField("Sony A7 IV", text: $name)
                                .textInputAutocapitalization(.words)
                        }
                        FormRow("Brand") {
                            TextField("Sony, Canon…", text: $brand.bound)
                        }
                        FormRow("Model") {
                            TextField("A7 IV, R5…", text: $model.bound)
                        }
                        categoryPicker
                        StatusField(value: $status, label: "Status", display: { $0.rawValue.capitalized })
                    }

                    FormSection("Purchase") {
                        MoneyField(value: $purchasePrice, label: "Purchase price")
                        DateField(date: $purchaseDate, label: "Purchase date", components: .date)
                        FormRow("Serial number") {
                            TextField("Optional", text: $serialNumber.bound)
                                .autocapitalization(.none)
                        }
                    }

                    FormSection("Notes") {
                        TextField("Anything to remember…", text: $notes.bound, axis: .vertical)
                            .lineLimit(2...5)
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
                            Text(isEdit ? "Save changes" : "Add gear")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.tokens.accent)
                    .disabled(!isValid || isSaving)
                }
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.tokens.bg)
        }
    }

    private var categoryPicker: some View {
        FormRow("Category") {
            Menu {
                ForEach(Self.categories, id: \.self) { option in
                    Button(option) { category = option }
                }
                if category != nil {
                    Button("Clear") { category = nil }
                }
            } label: {
                HStack {
                    Text(category ?? "None")
                        .font(.tokens.body(14))
                        .foregroundStyle(category == nil ? Color.tokens.textTertiary : Color.tokens.textPrimary)
                    Spacer()
                    Image(systemName: "chevron.up.chevron.down")
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
            .buttonStyle(.plain)
        }
    }

    private var isValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func save() async {
        guard isValid else { return }
        isSaving = true
        defer { isSaving = false }
        let userId = SessionStore.shared.user?.id ?? UUID()
        let payload: Gear
        switch mode {
        case .create:
            payload = Gear(
                id: UUID(),
                userId: userId,
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                category: category,
                brand: brand,
                model: model,
                serialNumber: serialNumber,
                purchasePrice: purchasePrice,
                purchaseDate: purchaseDate.map(Self.dateString),
                status: status,
                notes: notes,
                createdAt: .now
            )
        case .edit(let existing):
            payload = Gear(
                id: existing.id,
                userId: existing.userId,
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                category: category,
                brand: brand,
                model: model,
                serialNumber: serialNumber,
                purchasePrice: purchasePrice,
                purchaseDate: purchaseDate.map(Self.dateString),
                status: status,
                notes: notes,
                createdAt: existing.createdAt
            )
        }
        do {
            switch mode {
            case .create:
                _ = try await GearCacheRepository.shared.create(payload, in: context)
            case .edit:
                _ = try await GearCacheRepository.shared.update(payload, in: context)
            }
            Haptics.success()
            dismiss()
        } catch {
            Haptics.error()
            self.error = error.asFocalsError().errorDescription
        }
    }

    static func dateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = .current
        return formatter.string(from: date)
    }

    static func parseDate(_ raw: String?) -> Date? {
        guard let raw, !raw.isEmpty else { return nil }
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: String(raw.prefix(10)))
    }
}
