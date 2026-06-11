import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct ContractsScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedContract.updatedAt, order: .reverse) private var cached: [CachedContract]
    @Query(sort: \CachedClient.fullName, order: .forward) private var cachedClients: [CachedClient]

    @State private var search = ""
    @State private var hasLoadedOnce = false
    @State private var actionError: String?

    var body: some View {
        Group {
            if cached.isEmpty && hasLoadedOnce {
                EmptyState(
                    symbol: "doc.text",
                    title: "No contracts yet",
                    description: "Tap + to draft a contract from a template."
                )
            } else if cached.isEmpty {
                SkeletonList(count: 4)
            } else {
                content
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Contracts")
        .toolbar { toolbarContent }
        .searchable(text: $search, prompt: "Search contracts")
        .refreshable { await refresh() }
        .task {
            if !hasLoadedOnce {
                await refresh()
                hasLoadedOnce = true
            }
        }
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
    }

    private var content: some View {
        List {
            ForEach(filtered, id: \.serverId) { cached in
                Button {
                    Haptics.tap()
                    AppRouter.shared.navigate(to: .contractDetail(cached.serverId))
                } label: {
                    ContractListRow(
                        contract: cached.toModel(),
                        clientName: clientName(for: cached.clientId)
                    )
                }
                .buttonStyle(.plain)
                .listRowBackground(Color.tokens.bgSecondary)
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button(role: .destructive) {
                        Task { await delete(cached.serverId) }
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
        .listStyle(.plain)
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Button {
                AppRouter.shared.navigate(to: .contractTemplates)
            } label: {
                Label("Templates", systemImage: "doc.on.doc")
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                AppRouter.shared.navigate(to: .contractNew)
            } label: {
                Image(systemName: "plus")
            }
        }
    }

    private var filtered: [CachedContract] {
        let needle = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !needle.isEmpty else { return cached }
        return cached.filter { c in
            c.title.localizedCaseInsensitiveContains(needle)
                || c.body.localizedCaseInsensitiveContains(needle)
        }
    }

    private func clientName(for id: UUID?) -> String? {
        guard let id else { return nil }
        return cachedClients.first(where: { $0.serverId == id })?.fullName
    }

    private func refresh() async {
        try? await ContractsCacheRepository.shared.refresh(in: context)
        try? await ContractTemplatesCacheRepository.shared.refresh(in: context)
        try? await ClientsCacheRepository.shared.refresh(in: context)
    }

    private func delete(_ id: UUID) async {
        do {
            try await ContractsCacheRepository.shared.delete(id: id, in: context)
            Haptics.medium()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }
}

private struct ContractListRow: View {
    let contract: Contract
    let clientName: String?

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            Text(contract.title)
                .font(.tokens.medium(15))
                .foregroundStyle(Color.tokens.textPrimary)
                .lineLimit(1)

            if let clientName, !clientName.isEmpty {
                Text(clientName)
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.textSecondary)
            }

            HStack(spacing: Spacing.sm) {
                StatusPill(
                    statusLabel,
                    tone: tone(for: contract.status ?? .draft)
                )
                if let sentAt = contract.sentAt {
                    Label(
                        "Sent \(sentAt.formatted(.dateTime.month(.abbreviated).day()))",
                        systemImage: "paperplane"
                    )
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textTertiary)
                }
                if let signedAt = contract.signedAt {
                    Label(
                        "Signed \(signedAt.formatted(.dateTime.month(.abbreviated).day()))",
                        systemImage: "checkmark.seal"
                    )
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.success)
                }
            }
        }
        .padding(.vertical, Spacing.xs)
    }

    private var statusLabel: String {
        (contract.status ?? .draft).rawValue.capitalized
    }

    private func tone(for status: ContractStatus) -> StatusPill.Tone {
        switch status {
        case .draft:  return .neutral
        case .sent:   return .accent
        case .signed: return .success
        case .void:   return .danger
        }
    }
}
