import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct LinkForm: View {
    enum Mode: Hashable {
        case create
        case edit(FocalsModels.Link)
    }

    let mode: Mode

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    @State private var title: String
    @State private var url: String
    @State private var category: String?
    @State private var notes: String?

    @State private var isSaving = false
    @State private var error: String?

    init(mode: Mode) {
        self.mode = mode
        switch mode {
        case .create:
            _title = State(initialValue: "")
            _url = State(initialValue: "")
            _category = State(initialValue: nil)
            _notes = State(initialValue: nil)
        case .edit(let link):
            _title = State(initialValue: link.title)
            _url = State(initialValue: link.url)
            _category = State(initialValue: link.category)
            _notes = State(initialValue: link.notes)
        }
    }

    private var isEdit: Bool {
        if case .edit = mode { return true }
        return false
    }

    var body: some View {
        DetailSheet(title: isEdit ? "Edit link" : "New link") {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    FormSection("Link") {
                        FormRow("Title") {
                            TextField("Posing guide for couples", text: $title)
                                .textInputAutocapitalization(.sentences)
                        }
                        FormRow("URL") {
                            TextField("https://example.com", text: $url)
                                .textContentType(.URL)
                                .keyboardType(.URL)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }
                        FormRow("Category") {
                            TextField("Inspiration, Tools, Reference…", text: $category.bound)
                        }
                    }

                    FormSection("Notes") {
                        TextField("Why this matters…", text: $notes.bound, axis: .vertical)
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
                            Text(isEdit ? "Save changes" : "Save link")
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
        guard !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return false }
        let trimmedURL = url.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedURL.isEmpty else { return false }
        // Accept anything that parses as a URL with a scheme.
        guard let parsed = URL(string: trimmedURL), parsed.scheme != nil else { return false }
        return true
    }

    private func save() async {
        guard isValid else { return }
        isSaving = true
        defer { isSaving = false }
        let userId = SessionStore.shared.user?.id ?? UUID()
        let payload: FocalsModels.Link
        switch mode {
        case .create:
            payload = FocalsModels.Link(
                id: UUID(),
                userId: userId,
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                url: url.trimmingCharacters(in: .whitespacesAndNewlines),
                category: category,
                notes: notes,
                createdAt: .now
            )
        case .edit(let existing):
            payload = FocalsModels.Link(
                id: existing.id,
                userId: existing.userId,
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                url: url.trimmingCharacters(in: .whitespacesAndNewlines),
                category: category,
                notes: notes,
                createdAt: existing.createdAt
            )
        }
        do {
            switch mode {
            case .create:
                _ = try await LinksCacheRepository.shared.create(payload, in: context)
            case .edit:
                _ = try await LinksCacheRepository.shared.update(payload, in: context)
            }
            Haptics.success()
            dismiss()
        } catch {
            Haptics.error()
            self.error = error.asFocalsError().errorDescription
        }
    }
}
