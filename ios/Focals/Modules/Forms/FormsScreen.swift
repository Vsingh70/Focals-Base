import SwiftUI
import FocalsAPI
import FocalsDesign
import FocalsModels

struct FormsScreen: View {
    @State private var forms: [FocalsModels.Form] = []
    @State private var isLoading = true
    @State private var loadError: String?

    var body: some View {
        Group {
            if isLoading && forms.isEmpty {
                SkeletonList(count: 3)
            } else if forms.isEmpty {
                EmptyState(
                    symbol: "list.bullet.rectangle",
                    title: "No forms yet",
                    description: "Create forms on the web. They'll show up here as a read-only reference."
                )
            } else {
                content
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Forms")
        .refreshable { await load() }
        .task { await load() }
        .alert(
            "Couldn't load",
            isPresented: Binding(
                get: { loadError != nil },
                set: { if !$0 { loadError = nil } }
            ),
            presenting: loadError
        ) { _ in
            Button("OK", role: .cancel) {}
        } message: { error in
            Text(error)
        }
    }

    private var content: some View {
        List {
            Section {
                Text("Form creation is web-only. Manage your forms on the web; iOS shows them read-only here.")
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.textSecondary)
                    .listRowBackground(Color.tokens.bgTertiary)
            }
            Section {
                ForEach(forms, id: \.id) { form in
                    NavigationLink(value: form) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(form.name)
                                .font(.tokens.medium(15))
                                .foregroundStyle(Color.tokens.textPrimary)
                            Text("\(form.fields.count) field\(form.fields.count == 1 ? "" : "s") · last edited \(form.updatedAt.formatted(.relative(presentation: .named)))")
                                .font(.tokens.body(12))
                                .foregroundStyle(Color.tokens.textTertiary)
                        }
                    }
                    .listRowBackground(Color.tokens.bgSecondary)
                }
            }
        }
        .listStyle(.plain)
        .navigationDestination(for: FocalsModels.Form.self) { form in
            FormDetailScreen(form: form)
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let page = try await FormsRepository.shared.list(.init(limit: 100))
            forms = page.items
        } catch {
            loadError = error.asFocalsError().errorDescription
        }
    }
}

private struct FormDetailScreen: View {
    let form: FocalsModels.Form

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                Text(form.name)
                    .editorialHeadline()
                    .frame(maxWidth: .infinity, alignment: .leading)

                FormSection("Fields") {
                    ForEach(form.fields, id: \.id) { field in
                        VStack(alignment: .leading, spacing: 2) {
                            HStack {
                                Text(field.label)
                                    .font(.tokens.medium(14))
                                    .foregroundStyle(Color.tokens.textPrimary)
                                if field.required ?? false {
                                    Text("Required")
                                        .font(.tokens.body(10))
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color.tokens.danger.opacity(0.12))
                                        .foregroundStyle(Color.tokens.danger)
                                        .clipShape(Capsule())
                                }
                                Spacer()
                            }
                            Text(field.type.rawValue.capitalized)
                                .font(.tokens.body(11))
                                .foregroundStyle(Color.tokens.textTertiary)
                        }
                    }
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.lg)
        }
        .background(Color.tokens.bg)
        .navigationTitle("Form")
        .navigationBarTitleDisplayMode(.inline)
    }
}
