import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct ProjectsScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedProject.updatedAt, order: .reverse) private var cached: [CachedProject]
    @Query(sort: \CachedClient.fullName, order: .forward) private var cachedClients: [CachedClient]

    @State private var search = ""
    @State private var hasLoadedOnce = false
    @State private var actionError: String?

    var body: some View {
        Group {
            if cached.isEmpty && hasLoadedOnce {
                EmptyState(
                    symbol: "folder",
                    title: "No projects yet",
                    description: "Create one with the + button to get started."
                )
            } else if cached.isEmpty {
                SkeletonList(count: 6)
            } else if filtered.isEmpty {
                EmptyState(
                    symbol: "magnifyingglass",
                    title: "No matches",
                    description: "No projects match \"\(search)\"."
                )
            } else {
                content
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Projects")
        .toolbar { toolbarContent }
        .searchable(text: $search, prompt: "Search projects")
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
        ScrollView {
            LazyVStack(alignment: .leading, spacing: Spacing.lg) {
                ForEach(grouped, id: \.phase) { section in
                    VStack(alignment: .leading, spacing: 0) {
                        sectionHeader(section.phase, count: section.items.count)
                        VStack(spacing: 10) {
                            ForEach(section.items, id: \.serverId) { project in
                                card(for: project)
                            }
                        }
                        .opacity(section.phase == .cancelled ? 0.6 : 1)
                    }
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.bottom, Spacing.xl)
        }
    }

    private func sectionHeader(_ phase: ProjectPhase, count: Int) -> some View {
        HStack(spacing: Spacing.sm) {
            RoundedRectangle(cornerRadius: 2)
                .fill(phase.color)
                .frame(width: 3, height: 13)
            Text(phase.title.uppercased())
                .font(.tokens.medium(12.5))
                .tracking(0.6)
                .foregroundStyle(Color.tokens.textSecondary)
            Text("\(count)")
                .font(.tokens.medium(12))
                .foregroundStyle(Color.tokens.textTertiary)
        }
        .padding(.top, Spacing.md)
        .padding(.bottom, Spacing.xs + 1)
    }

    private func card(for project: CachedProject) -> some View {
        Button {
            Haptics.tap()
            AppRouter.shared.navigate(to: .projectDetail(project.serverId))
        } label: {
            ProjectCard(project: project, clientName: clientName(for: project))
        }
        .buttonStyle(.plain)
        .contextMenu {
            if project.status.flatMap(ProjectStatus.init(rawValue:)) != .cancelled {
                Button {
                    Task { await markStatus(project, .cancelled) }
                } label: {
                    Label("Cancel project", systemImage: "slash.circle")
                }
            }
            Button(role: .destructive) {
                Task { await delete(project) }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                Button {
                    AppRouter.shared.presentedSheet = .createProject(presetShootDate: nil)
                } label: {
                    Label("New project", systemImage: "folder.badge.plus")
                }
                Button {
                    AppRouter.shared.presentedSheet = .projectUpload
                } label: {
                    Label("Import from file", systemImage: "square.and.arrow.down")
                }
            } label: {
                Image(systemName: "plus")
            }
        }
    }

    private var filtered: [CachedProject] {
        let needle = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !needle.isEmpty else { return cached }
        return cached.filter { project in
            let haystack = [project.title, project.location ?? "", project.category ?? ""]
                .joined(separator: " ")
            return haystack.localizedCaseInsensitiveContains(needle)
        }
    }

    /// Pipeline sections in `ProjectPhase.allCases` order, empty phases
    /// dropped. `.cancelled` is naturally last in the enum.
    private var grouped: [(phase: ProjectPhase, items: [CachedProject])] {
        let items = filtered
        return ProjectPhase.allCases.compactMap { phase in
            let matching = items.filter { project in
                let status = project.status.flatMap(ProjectStatus.init(rawValue:)) ?? .inquiry
                return ProjectPhase.of(status) == phase
            }
            return matching.isEmpty ? nil : (phase, matching)
        }
    }

    private func clientName(for project: CachedProject) -> String? {
        guard let id = project.clientId else { return nil }
        return cachedClients.first(where: { $0.serverId == id })?.fullName
    }

    private func refresh() async {
        // Sequential because ModelContext isn't Sendable — running both
        // through `async let` would cross actor isolation boundaries.
        try? await ProjectsCacheRepository.shared.refresh(in: context)
        try? await ClientsCacheRepository.shared.refresh(in: context)
    }

    private func delete(_ project: CachedProject) async {
        do {
            try await ProjectsCacheRepository.shared.delete(id: project.serverId, in: context)
            Haptics.medium()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }

    private func markStatus(_ project: CachedProject, _ status: ProjectStatus) async {
        var updated = project.toModel()
        updated = Project(
            id: updated.id,
            userId: updated.userId,
            title: updated.title,
            clientId: updated.clientId,
            category: updated.category,
            status: status,
            shootDate: updated.shootDate,
            location: updated.location,
            packagePrice: updated.packagePrice,
            amountPaid: updated.amountPaid,
            paymentStatus: updated.paymentStatus,
            notes: updated.notes,
            createdAt: updated.createdAt,
            updatedAt: .now
        )
        do {
            _ = try await ProjectsCacheRepository.shared.update(updated, in: context)
            Haptics.success()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }
}

/// One project card — mirrors `ListB` in the design reference: title + status
/// pill, client line, payment bar with balance, then date/location meta.
private struct ProjectCard: View {
    let project: CachedProject
    let clientName: String?

    private var status: ProjectStatus {
        project.status.flatMap(ProjectStatus.init(rawValue:)) ?? .inquiry
    }
    private var price: Double { project.packagePrice ?? 0 }
    private var paid: Double { project.amountPaid ?? 0 }
    private var balance: Double { max(0, price - paid) }
    private var fraction: Double {
        guard price > 0 else { return 0 }
        return min(1, max(0, paid / price))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(alignment: .top, spacing: Spacing.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(project.title)
                        .font(.tokens.semibold(16))
                        .foregroundStyle(Color.tokens.textPrimary)
                        .lineLimit(1)
                    Text(clientName?.isEmpty == false ? clientName! : "—")
                        .font(.tokens.body(13))
                        .foregroundStyle(Color.tokens.textSecondary)
                }
                Spacer(minLength: 0)
                StatusPill(status.displayName, tone: status.calendarPillTone)
            }

            if price > 0 {
                VStack(alignment: .leading, spacing: 5) {
                    GeometryReader { proxy in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.tokens.bgTertiary)
                            Capsule()
                                .fill(fraction >= 1 ? Color.tokens.success : Color.tokens.accent)
                                .frame(width: proxy.size.width * fraction)
                        }
                    }
                    .frame(height: 5)
                    HStack {
                        Text("\(money(paid)) of \(money(price))")
                            .font(.tokens.body(12))
                            .foregroundStyle(Color.tokens.textSecondary)
                        Spacer()
                        Text(fraction >= 1 ? "Paid in full" : "\(money(balance)) due")
                            .font(.tokens.medium(12))
                            .foregroundStyle(fraction >= 1 ? Color.tokens.success : Color.tokens.warning)
                    }
                }
            }

            meta
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Spacing.md)
        .background(Color.tokens.bgSecondary)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.tokens.border, lineWidth: 0.5)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .contentShape(RoundedRectangle(cornerRadius: 14))
    }

    @ViewBuilder
    private var meta: some View {
        let wallClock = project.shootDate.flatMap { CalendarMath.wallClockDate(from: $0) }
        let location = project.location?.isEmpty == false ? project.location : nil
        HStack(spacing: 14) {
            if let wallClock {
                Label(
                    wallClock.formatted(
                        .dateTime.weekday(.abbreviated).month(.abbreviated).day().hour().minute()
                    ),
                    systemImage: "calendar"
                )
            }
            if let location {
                Label(location, systemImage: "mappin.and.ellipse")
                    .lineLimit(1)
            }
            if wallClock == nil, location == nil {
                Label(project.category?.isEmpty == false ? project.category! : "No category", systemImage: "tag")
            }
        }
        .font(.tokens.body(12))
        .foregroundStyle(Color.tokens.textTertiary)
    }

    private func money(_ value: Double) -> String {
        value.formatted(.currency(code: "USD").precision(.fractionLength(0)))
    }
}
