import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

/// Single-screen create flow: title + linked client/project + a template picker
/// that drops the chosen template's body into the editor. Merge fields use the
/// `{{key}}` convention; we substitute `{{client_name}}`, `{{project_title}}`,
/// `{{shoot_date}}` automatically when the user picks a client/project.
struct ContractNewScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedContractTemplate.name, order: .forward) private var templates: [CachedContractTemplate]
    @Query(sort: \CachedClient.fullName, order: .forward) private var cachedClients: [CachedClient]
    @Query(sort: \CachedProject.updatedAt, order: .reverse) private var cachedProjects: [CachedProject]

    @State private var title = ""
    @State private var contractBody = ""
    @State private var clientId: UUID?
    @State private var projectId: UUID?
    @State private var selectedTemplateId: UUID?

    @State private var isSaving = false
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                FormSection("Basics") {
                    FormRow("Title") {
                        TextField("Wedding photography agreement", text: $title)
                            .textInputAutocapitalization(.words)
                    }
                    RelatedRecordField(
                        selectedId: $clientId,
                        label: "Client",
                        placeholder: "No client",
                        options: cachedClients.map { $0.toModel() },
                        display: { $0.fullName },
                        secondary: { $0.email }
                    )
                    RelatedRecordField(
                        selectedId: $projectId,
                        label: "Project",
                        placeholder: "No project",
                        options: cachedProjects.map { $0.toModel() },
                        display: { $0.title },
                        secondary: { $0.shootDate?.formatted(.dateTime.month(.abbreviated).day().year()) }
                    )
                }

                templatePicker

                FormSection("Body") {
                    TextField("Contract body…", text: $contractBody, axis: .vertical)
                        .lineLimit(8...30)
                        .font(.system(size: 14, design: .monospaced))
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
                        Text("Save draft").frame(maxWidth: .infinity)
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
        .navigationTitle("New contract")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var templatePicker: some View {
        FormSection("Template") {
            if templates.isEmpty {
                Text("No templates yet. Create one on the web at /contracts/templates.")
                    .font(.tokens.body(13))
                    .foregroundStyle(Color.tokens.textTertiary)
            } else {
                Menu {
                    Button("None — start blank") {
                        selectedTemplateId = nil
                        contractBody = ""
                    }
                    ForEach(templates, id: \.serverId) { template in
                        Button(template.name) { applyTemplate(template) }
                    }
                } label: {
                    HStack {
                        Text(selectedTemplateName)
                            .font(.tokens.body(14))
                            .foregroundStyle(selectedTemplateId == nil ? Color.tokens.textTertiary : Color.tokens.textPrimary)
                        Spacer()
                        Image(systemName: "chevron.up.chevron.down")
                            .foregroundStyle(Color.tokens.textTertiary)
                    }
                }
                .buttonStyle(.plain)

                if selectedTemplateId != nil, !mergeKeys.isEmpty {
                    Text("Auto-filled fields: \(mergeKeys.joined(separator: ", "))")
                        .font(.tokens.body(11))
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
        }
    }

    private var selectedTemplateName: String {
        if let id = selectedTemplateId,
           let match = templates.first(where: { $0.serverId == id }) {
            return match.name
        }
        return "Pick a template"
    }

    private var mergeKeys: [String] {
        guard let selectedTemplateId,
              let template = templates.first(where: { $0.serverId == selectedTemplateId })
        else { return [] }
        return Self.mergeKeys(in: template.body)
    }

    private var isValid: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func applyTemplate(_ template: CachedContractTemplate) {
        selectedTemplateId = template.serverId
        contractBody = Self.substitute(template.body, with: substitutions)
        if title.isEmpty {
            title = template.name
        }
    }

    private var substitutions: [String: String] {
        var values: [String: String] = [:]
        if let id = clientId,
           let client = cachedClients.first(where: { $0.serverId == id }) {
            values["client_name"] = client.fullName
            if let email = client.email { values["client_email"] = email }
            if let phone = client.phone { values["client_phone"] = phone }
        }
        if let id = projectId,
           let project = cachedProjects.first(where: { $0.serverId == id }) {
            values["project_title"] = project.title
            if let raw = project.shootDate,
               let wallClock = CalendarMath.wallClockDate(from: raw) {
                values["shoot_date"] = wallClock.formatted(.dateTime.month(.wide).day().year())
            }
            if let location = project.location { values["location"] = location }
            if let price = project.packagePrice {
                values["package_price"] = "$\(Int(price))"
            }
        }
        return values
    }

    static func mergeKeys(in body: String) -> [String] {
        var seen = Set<String>()
        var keys: [String] = []
        let pattern = #"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [] }
        let range = NSRange(body.startIndex..., in: body)
        regex.enumerateMatches(in: body, range: range) { match, _, _ in
            guard let match,
                  let keyRange = Range(match.range(at: 1), in: body) else { return }
            let key = String(body[keyRange])
            if !seen.contains(key) {
                seen.insert(key)
                keys.append(key)
            }
        }
        return keys
    }

    static func substitute(_ body: String, with values: [String: String]) -> String {
        var output = body
        for (key, value) in values {
            output = output.replacingOccurrences(of: "{{\(key)}}", with: value)
            // Tolerate whitespace inside the braces.
            let pattern = #"\{\{\s*\#(key)\s*\}\}"#
            if let regex = try? NSRegularExpression(pattern: pattern) {
                let range = NSRange(output.startIndex..., in: output)
                output = regex.stringByReplacingMatches(in: output, range: range, withTemplate: value)
            }
        }
        return output
    }

    private func save() async {
        guard isValid else { return }
        isSaving = true
        defer { isSaving = false }
        let now = Date.now
        let userId = SessionStore.shared.user?.id ?? UUID()
        let payload = Contract(
            id: UUID(),
            userId: userId,
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            body: contractBody,
            status: .draft,
            templateId: selectedTemplateId,
            projectId: projectId,
            clientId: clientId,
            customFields: nil,
            sentAt: nil,
            signedAt: nil,
            createdAt: now,
            updatedAt: now
        )
        do {
            let saved = try await ContractsCacheRepository.shared.create(payload, in: context)
            Haptics.success()
            AppRouter.shared.popCurrentStack()
            AppRouter.shared.navigate(to: .contractDetail(saved.id))
        } catch {
            Haptics.error()
            self.error = error.asFocalsError().errorDescription
        }
    }
}
