import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

/// Manual inquiry creation. Field shape mirrors the web's
/// `manualInquirySchema` (`inquiryPayloadSchema`). Source is hard-coded to
/// `manual` to match the web action.
struct CreateInquirySheet: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var shootType = ""
    @State private var preferredDate = Date()
    @State private var hasPreferredDate = false
    @State private var message = ""

    @State private var isSaving = false
    @State private var error: String?

    var body: some View {
        DetailSheet(title: "New inquiry") {
            Form {
                Section {
                    TextField("Name", text: $name)
                        .textContentType(.name)
                        .submitLabel(.next)
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    TextField("Phone", text: $phone)
                        .textContentType(.telephoneNumber)
                        .keyboardType(.phonePad)
                }

                Section("Shoot") {
                    TextField("Shoot type (portrait, wedding…)", text: $shootType)
                        .autocapitalization(.none)
                    Toggle("Preferred date", isOn: $hasPreferredDate.animation())
                    if hasPreferredDate {
                        DatePicker(
                            "Date",
                            selection: $preferredDate,
                            displayedComponents: .date
                        )
                    }
                }

                Section("Message") {
                    TextField("Anything they said…", text: $message, axis: .vertical)
                        .lineLimit(4...8)
                }

                if let error {
                    Section {
                        Text(error)
                            .font(.tokens.body(13))
                            .foregroundStyle(Color.tokens.danger)
                    }
                }

                Section {
                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving {
                            ProgressView().frame(maxWidth: .infinity)
                        } else {
                            Text("Save inquiry")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.tokens.accent)
                    .disabled(!isValid || isSaving)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.tokens.bg)
        }
    }

    private var isValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func save() async {
        guard isValid else { return }
        isSaving = true
        defer { isSaving = false }
        let payload = Inquiry(
            id: UUID(),
            userId: SessionStore.shared.user?.id ?? UUID(),
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            email: email.isEmpty ? nil : email.trimmingCharacters(in: .whitespacesAndNewlines),
            phone: phone.isEmpty ? nil : phone.trimmingCharacters(in: .whitespacesAndNewlines),
            shootType: shootType.isEmpty ? nil : shootType.trimmingCharacters(in: .whitespacesAndNewlines),
            preferredDate: hasPreferredDate ? Self.formatPreferredDate(preferredDate) : nil,
            message: message.isEmpty ? nil : message,
            source: "manual",
            sourceHandle: nil,
            status: .new,
            rawPayload: nil,
            convertedClientId: nil,
            convertedProjectId: nil,
            createdAt: .now,
            updatedAt: .now
        )
        do {
            _ = try await InquiriesCacheRepository.shared.create(payload, in: context)
            Haptics.success()
            dismiss()
        } catch {
            Haptics.error()
            self.error = error.asFocalsError().errorDescription
        }
    }

    static func formatPreferredDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = .current
        return formatter.string(from: date)
    }
}
