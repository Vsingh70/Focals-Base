import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct ClientsScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedClient.fullName, order: .forward) private var cached: [CachedClient]

    @State private var search = ""
    @State private var hasLoadedOnce = false
    @State private var actionError: String?

    var body: some View {
        Group {
            if cached.isEmpty && hasLoadedOnce {
                EmptyState(
                    symbol: "person.2",
                    title: "No clients yet",
                    description: "Tap + to add your first client, or convert one from the inbox."
                )
            } else if cached.isEmpty {
                SkeletonList(count: 6)
            } else {
                content
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Clients")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    AppRouter.shared.presentedSheet = .createClient(prefilled: nil)
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .searchable(text: $search, prompt: "Search clients")
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
                    AppRouter.shared.navigate(to: .clientDetail(cached.serverId))
                } label: {
                    ClientListRow(client: cached)
                }
                .buttonStyle(.plain)
                .listRowBackground(Color.tokens.bgSecondary)
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button(role: .destructive) {
                        Task { await delete(cached) }
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
        .listStyle(.plain)
    }

    private var filtered: [CachedClient] {
        let needle = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !needle.isEmpty else { return cached }
        return cached.filter { client in
            let haystack = [client.fullName, client.email ?? "", client.phone ?? ""]
                .joined(separator: " ")
            return haystack.localizedCaseInsensitiveContains(needle)
        }
    }

    private func refresh() async {
        try? await ClientsCacheRepository.shared.refresh(in: context)
    }

    private func delete(_ client: CachedClient) async {
        do {
            try await ClientsCacheRepository.shared.delete(id: client.serverId, in: context)
            Haptics.medium()
            // Cascade null-FK: refresh projects so any rows that pointed at
            // this client pick up the server-side null.
            try? await ProjectsCacheRepository.shared.refresh(in: context)
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }
}

struct ClientListRow: View {
    let client: CachedClient

    var body: some View {
        HStack(spacing: Spacing.sm) {
            ClientAvatar(name: client.fullName)
            VStack(alignment: .leading, spacing: 2) {
                Text(client.fullName)
                    .font(.tokens.medium(15))
                    .foregroundStyle(Color.tokens.textPrimary)
                    .lineLimit(1)
                Text(secondaryLine)
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.textTertiary)
                    .lineLimit(1)
            }
            Spacer()
        }
        .padding(.vertical, Spacing.xs)
    }

    private var secondaryLine: String {
        [client.email, client.phone].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
    }
}

struct ClientAvatar: View {
    let name: String
    var size: CGFloat = 36

    var body: some View {
        Circle()
            .fill(Color.tokens.bgTertiary)
            .frame(width: size, height: size)
            .overlay(
                Text(initials)
                    .font(.tokens.medium(size > 50 ? 18 : 13))
                    .foregroundStyle(Color.tokens.textPrimary)
            )
            .overlay(
                Circle().stroke(Color.tokens.border, lineWidth: 0.5)
            )
    }

    private var initials: String {
        let words = name
            .split(separator: " ")
            .filter { !$0.isEmpty }
            .prefix(2)
        let chars = words.compactMap { $0.first.map(String.init) }
        return chars.joined().uppercased()
    }
}
