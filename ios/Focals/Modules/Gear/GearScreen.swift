import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct GearScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedGear.name, order: .forward) private var cached: [CachedGear]

    enum Filter: String, CaseIterable, Hashable {
        case all, owned, wishlist
        var label: String { rawValue.capitalized }
    }

    @State private var filter: Filter = .all
    @State private var search = ""
    @State private var hasLoadedOnce = false
    @State private var actionError: String?

    var body: some View {
        Group {
            if cached.isEmpty && hasLoadedOnce {
                EmptyState(
                    symbol: "camera.aperture",
                    title: "No gear yet",
                    description: "Track owned cameras, lenses, and wishlist items here."
                )
            } else if cached.isEmpty {
                SkeletonList(count: 5)
            } else {
                content
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Gear")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    AppRouter.shared.presentedSheet = .createGear
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .searchable(text: $search, prompt: "Search gear")
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
            Section {
                Picker("Filter", selection: $filter) {
                    ForEach(Filter.allCases, id: \.self) { option in
                        Text(option.label).tag(option)
                    }
                }
                .pickerStyle(.segmented)
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            }

            ForEach(filtered, id: \.serverId) { gear in
                Button {
                    Haptics.tap()
                    AppRouter.shared.presentedSheet = .editGear(gear.toModel())
                } label: {
                    GearRow(gear: gear)
                }
                .buttonStyle(.plain)
                .listRowBackground(Color.tokens.bgSecondary)
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button(role: .destructive) {
                        Task { await delete(gear) }
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                    if gear.status == GearStatus.wishlist.rawValue {
                        Button {
                            Task { await markOwned(gear) }
                        } label: {
                            Label("Mark owned", systemImage: "checkmark.circle")
                        }
                        .tint(Color.tokens.success)
                    }
                }
            }
        }
        .listStyle(.plain)
    }

    private var filtered: [CachedGear] {
        let needle = search.trimmingCharacters(in: .whitespacesAndNewlines)
        return cached.filter { gear in
            switch filter {
            case .all:
                break
            case .owned:
                if gear.status != GearStatus.owned.rawValue { return false }
            case .wishlist:
                if gear.status != GearStatus.wishlist.rawValue { return false }
            }
            if !needle.isEmpty {
                let haystack = [
                    gear.name,
                    gear.brand ?? "",
                    gear.modelName ?? "",
                    gear.category ?? "",
                ].joined(separator: " ")
                if !haystack.localizedCaseInsensitiveContains(needle) {
                    return false
                }
            }
            return true
        }
    }

    private func refresh() async {
        try? await GearCacheRepository.shared.refresh(in: context)
    }

    private func delete(_ gear: CachedGear) async {
        do {
            try await GearCacheRepository.shared.delete(id: gear.serverId, in: context)
            Haptics.medium()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }

    private func markOwned(_ gear: CachedGear) async {
        let updated = Gear(
            id: gear.serverId,
            userId: gear.userId,
            name: gear.name,
            category: gear.category,
            brand: gear.brand,
            model: gear.modelName,
            serialNumber: gear.serialNumber,
            purchasePrice: gear.purchasePrice,
            purchaseDate: gear.purchaseDate,
            status: .owned,
            notes: gear.notes,
            createdAt: gear.createdAt
        )
        do {
            _ = try await GearCacheRepository.shared.update(updated, in: context)
            Haptics.success()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }
}

private struct GearRow: View {
    let gear: CachedGear

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.sm) {
            Image(systemName: gear.status == GearStatus.owned.rawValue ? "star.fill" : "star")
                .foregroundStyle(gear.status == GearStatus.owned.rawValue ? Color.tokens.warning : Color.tokens.textTertiary)
                .padding(.top, 2)
            VStack(alignment: .leading, spacing: 2) {
                Text(gear.name)
                    .font(.tokens.medium(15))
                    .foregroundStyle(Color.tokens.textPrimary)
                    .lineLimit(1)
                let meta = [gear.brand, gear.modelName, gear.category]
                    .compactMap { $0 }
                    .filter { !$0.isEmpty }
                if !meta.isEmpty {
                    Text(meta.joined(separator: " · "))
                        .font(.tokens.body(12))
                        .foregroundStyle(Color.tokens.textTertiary)
                        .lineLimit(1)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                if let price = gear.purchasePrice {
                    Text(price, format: .currency(code: "USD"))
                        .font(.tokens.medium(14))
                        .monospacedDigit()
                        .foregroundStyle(Color.tokens.textPrimary)
                }
                Text((gear.status ?? GearStatus.owned.rawValue).capitalized)
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textTertiary)
            }
        }
        .padding(.vertical, Spacing.xs)
    }
}
