import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct ClientForm: View {
    enum Mode: Hashable {
        case create(prefilled: Client?)
        case edit(Client)
    }

    let mode: Mode

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    @State private var fullName: String
    @State private var email: String?
    @State private var phone: String?
    @State private var source: String?
    @State private var notes: String?

    @State private var isSaving = false
    @State private var error: String?

    init(mode: Mode) {
        self.mode = mode
        switch mode {
        case .create(let prefilled):
            _fullName = State(initialValue: prefilled?.fullName ?? "")
            _email = State(initialValue: prefilled?.email)
            _phone = State(initialValue: prefilled?.phone)
            _source = State(initialValue: prefilled?.source)
            _notes = State(initialValue: prefilled?.notes)
        case .edit(let client):
            _fullName = State(initialValue: client.fullName)
            _email = State(initialValue: client.email)
            _phone = State(initialValue: client.phone)
            _source = State(initialValue: client.source)
            _notes = State(initialValue: client.notes)
        }
    }

    private var isEdit: Bool {
        if case .edit = mode { return true }
        return false
    }

    var body: some View {
        DetailSheet(title: isEdit ? "Edit client" : "New client") {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    FormSection("Contact") {
                        FormRow("Full name") {
                            TextField("Sarah Johnson", text: $fullName)
                                .textContentType(.name)
                                .textInputAutocapitalization(.words)
                        }
                        FormRow("Email") {
                            TextField("name@example.com", text: $email.bound)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                        }
                        FormRow("Phone") {
                            TextField("(555) 123-4567", text: $phone.bound)
                                .textContentType(.telephoneNumber)
                                .keyboardType(.phonePad)
                        }
                    }

                    FormSection("Origin") {
                        FormRow("Source") {
                            TextField("inquiry, referral, instagram…", text: $source.bound)
                        }
                    }

                    FormSection("Notes") {
                        TextField("Anything to remember…", text: $notes.bound, axis: .vertical)
                            .lineLimit(3...6)
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
                            Text(isEdit ? "Save changes" : "Create client")
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

    private var isValid: Bool {
        !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func save() async {
        guard isValid else { return }
        isSaving = true
        defer { isSaving = false }
        let now = Date.now
        let userId = SessionStore.shared.user?.id ?? UUID()
        let payload: Client
        switch mode {
        case .create(let prefilled):
            payload = Client(
                id: prefilled?.id ?? UUID(),
                userId: userId,
                fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines),
                email: email,
                phone: phone,
                notes: notes,
                source: source,
                createdAt: prefilled?.createdAt ?? now,
                updatedAt: now
            )
        case .edit(let existing):
            payload = Client(
                id: existing.id,
                userId: existing.userId,
                fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines),
                email: email,
                phone: phone,
                notes: notes,
                source: source,
                createdAt: existing.createdAt,
                updatedAt: now
            )
        }
        do {
            switch mode {
            case .create:
                _ = try await ClientsCacheRepository.shared.create(payload, in: context)
            case .edit:
                _ = try await ClientsCacheRepository.shared.update(payload, in: context)
            }
            Haptics.success()
            dismiss()
        } catch {
            Haptics.error()
            self.error = error.asFocalsError().errorDescription
        }
    }
}
