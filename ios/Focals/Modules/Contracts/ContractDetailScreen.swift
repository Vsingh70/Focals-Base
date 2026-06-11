import SwiftUI
import SwiftData
import MarkdownUI
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct ContractDetailScreen: View {
    let id: UUID

    @Environment(\.modelContext) private var context
    @Query private var matches: [CachedContract]

    @State private var isMutating = false
    @State private var actionError: String?
    @State private var showDeleteConfirm = false

    init(id: UUID) {
        self.id = id
        _matches = Query(
            filter: #Predicate<CachedContract> { $0.serverId == id },
            sort: \CachedContract.updatedAt
        )
    }

    var body: some View {
        Group {
            if let contract = matches.first?.toModel() {
                content(for: contract)
            } else {
                EmptyState(
                    symbol: "doc.text",
                    title: "Contract unavailable",
                    description: "This contract may have been deleted or hasn't synced yet."
                )
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle(matches.first?.title ?? "Contract")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { toolbarContent }
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
        .confirmationDialog(
            "Delete this contract?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete contract", role: .destructive) {
                Task { await delete() }
            }
            Button("Cancel", role: .cancel) {}
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        if let contract = matches.first?.toModel() {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(
                    item: shareText(for: contract),
                    preview: SharePreview(contract.title)
                ) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    if contract.status != .sent {
                        Button {
                            Task { await markStatus(contract, .sent, stamp: \.sentAt) }
                        } label: {
                            Label("Mark sent", systemImage: "paperplane")
                        }
                    }
                    if contract.status != .signed {
                        Button {
                            Task { await markStatus(contract, .signed, stamp: \.signedAt) }
                        } label: {
                            Label("Mark signed", systemImage: "checkmark.seal")
                        }
                    }
                    if contract.status != .void {
                        Button(role: .destructive) {
                            Task { await markStatus(contract, .void, stamp: nil) }
                        } label: {
                            Label("Mark void", systemImage: "xmark.octagon")
                        }
                    }
                    Divider()
                    Button(role: .destructive) {
                        showDeleteConfirm = true
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
                .accessibilityLabel("More actions")
            }
        }
    }

    @ViewBuilder
    private func content(for contract: Contract) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                header(for: contract)
                bodyView(for: contract)
                if let custom = contract.customFields, !custom.isEmpty {
                    customFieldsSection(custom)
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.lg)
        }
    }

    private func header(for contract: Contract) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(contract.title)
                .editorialHeadline()
                .frame(maxWidth: .infinity, alignment: .leading)
            HStack(spacing: Spacing.xs) {
                StatusPill(
                    (contract.status ?? .draft).rawValue.capitalized,
                    tone: tone(for: contract.status ?? .draft)
                )
                if let sent = contract.sentAt {
                    Label(
                        "Sent \(sent.formatted(.dateTime.month(.abbreviated).day().year()))",
                        systemImage: "paperplane"
                    )
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.textTertiary)
                }
                if let signed = contract.signedAt {
                    Label(
                        "Signed \(signed.formatted(.dateTime.month(.abbreviated).day().year()))",
                        systemImage: "checkmark.seal"
                    )
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.success)
                }
            }
        }
    }

    private func bodyView(for contract: Contract) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Contract")
                .font(.tokens.medium(11))
                .textCase(.uppercase)
                .tracking(0.7)
                .foregroundStyle(Color.tokens.textTertiary)

            Markdown(contract.body)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(Spacing.md)
                .background(Color.tokens.bgSecondary)
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.md)
                        .stroke(Color.tokens.border, lineWidth: 0.5)
                )
                .clipShape(RoundedRectangle(cornerRadius: Radius.md))
        }
    }

    private func customFieldsSection(_ fields: [String: String]) -> some View {
        FormSection("Custom fields") {
            ForEach(fields.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in
                FormRow(key.replacingOccurrences(of: "_", with: " ").capitalized) {
                    Text(value)
                        .font(.tokens.body(14))
                        .foregroundStyle(Color.tokens.textPrimary)
                }
            }
        }
    }

    private func tone(for status: ContractStatus) -> StatusPill.Tone {
        switch status {
        case .draft:  return .neutral
        case .sent:   return .accent
        case .signed: return .success
        case .void:   return .danger
        }
    }

    private func shareText(for contract: Contract) -> String {
        var lines = [contract.title, ""]
        lines.append(contract.body)
        return lines.joined(separator: "\n")
    }

    // MARK: - Mutations

    private func markStatus(
        _ contract: Contract,
        _ status: ContractStatus,
        stamp: WritableKeyPath<ContractDetailScreen.StampWritable, Date?>?
    ) async {
        // Build the new payload — Date setting is done explicitly per status
        // because Contract is an immutable struct.
        let now = Date.now
        let updated = Contract(
            id: contract.id,
            userId: contract.userId,
            title: contract.title,
            body: contract.body,
            status: status,
            templateId: contract.templateId,
            projectId: contract.projectId,
            clientId: contract.clientId,
            customFields: contract.customFields,
            sentAt: status == .sent ? now : contract.sentAt,
            signedAt: status == .signed ? now : contract.signedAt,
            createdAt: contract.createdAt,
            updatedAt: now
        )
        isMutating = true
        defer { isMutating = false }
        do {
            _ = try await ContractsCacheRepository.shared.update(updated, in: context)
            Haptics.success()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }

    /// Stand-in struct so the keypath signature in `markStatus` compiles. The
    /// keypath parameter is currently unused — kept for future signature
    /// timestamping work.
    struct StampWritable {
        var sentAt: Date?
        var signedAt: Date?
    }

    private func delete() async {
        do {
            try await ContractsCacheRepository.shared.delete(id: id, in: context)
            Haptics.medium()
            AppRouter.shared.popCurrentStack()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }
}
