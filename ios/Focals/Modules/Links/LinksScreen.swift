import SwiftUI
import SwiftData
import UIKit
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct LinksScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedLink.createdAt, order: .reverse) private var cached: [CachedLink]

    @State private var presentedURL: URL?
    @State private var search = ""
    @State private var hasLoadedOnce = false
    @State private var actionError: String?

    var body: some View {
        Group {
            if cached.isEmpty && hasLoadedOnce {
                EmptyState(
                    symbol: "link",
                    title: "No links yet",
                    description: "Save inspiration, references, and tools you reach for often."
                )
            } else if cached.isEmpty {
                SkeletonList(count: 4)
            } else {
                content
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Links")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    AppRouter.shared.presentedSheet = .createLink
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .searchable(text: $search, prompt: "Search links")
        .refreshable { await refresh() }
        .task {
            if !hasLoadedOnce {
                await refresh()
                hasLoadedOnce = true
            }
        }
        .sheet(item: $presentedURL) { url in
            SafariView(url: url)
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
            ForEach(grouped, id: \.0) { category, links in
                Section(category) {
                    ForEach(links, id: \.serverId) { link in
                        Button {
                            Haptics.tap()
                            if let url = URL(string: link.url) {
                                presentedURL = url
                            }
                        } label: {
                            LinkRow(link: link)
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(Color.tokens.bgSecondary)
                        .contextMenu {
                            Button {
                                AppRouter.shared.presentedSheet = .editLink(link.toModel())
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            Button {
                                UIPasteboard.general.string = link.url
                            } label: {
                                Label("Copy URL", systemImage: "doc.on.doc")
                            }
                            Button(role: .destructive) {
                                Task { await delete(link) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.plain)
    }

    private var filtered: [CachedLink] {
        let needle = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !needle.isEmpty else { return cached }
        return cached.filter { link in
            let haystack = [link.title, link.url, link.category ?? "", link.notes ?? ""]
                .joined(separator: " ")
            return haystack.localizedCaseInsensitiveContains(needle)
        }
    }

    private var grouped: [(String, [CachedLink])] {
        let buckets = Dictionary(grouping: filtered) { $0.category ?? "Uncategorized" }
        return buckets
            .map { ($0.key, $0.value.sorted { $0.title < $1.title }) }
            .sorted { $0.0 < $1.0 }
    }

    private func refresh() async {
        try? await LinksCacheRepository.shared.refresh(in: context)
    }

    private func delete(_ link: CachedLink) async {
        do {
            try await LinksCacheRepository.shared.delete(id: link.serverId, in: context)
            Haptics.medium()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }
}

private struct LinkRow: View {
    let link: CachedLink

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.sm) {
            Image(systemName: "link")
                .foregroundStyle(Color.tokens.textTertiary)
                .frame(width: 24, height: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(link.title)
                    .font(.tokens.medium(15))
                    .foregroundStyle(Color.tokens.textPrimary)
                    .lineLimit(1)
                Text(link.url)
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.textTertiary)
                    .lineLimit(1)
                if let notes = link.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.tokens.body(12))
                        .foregroundStyle(Color.tokens.textSecondary)
                        .lineLimit(2)
                }
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.tokens.body(11))
                .foregroundStyle(Color.tokens.textTertiary)
        }
        .padding(.vertical, Spacing.xs)
    }
}
