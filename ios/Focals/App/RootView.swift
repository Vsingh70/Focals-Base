import SwiftUI
import SwiftData
import FocalsCache
import FocalsDesign

struct RootView: View {
    @State private var session = SessionStore.shared
    @State private var faceIDLock = FaceIDLock()

    var body: some View {
        Group {
            if session.isLoading {
                LoadingView()
            } else if let user = session.user {
                if faceIDLock.isLocked {
                    FaceIDLockScreen(lock: faceIDLock)
                } else {
                    // Re-keying on user.id forces a fresh container if the
                    // signed-in user changes (sign-out → sign-in as someone
                    // else on the same device). The previous user's store
                    // file is wiped in SessionStore.wipeLocalData.
                    LoggedInRoot()
                        .modelContainer(cacheContainer(for: user.id))
                        .id(user.id)
                }
            } else {
                LoginView()
            }
        }
        .background(Color.tokens.bg)
        .onOpenURL { url in
            DeepLinkRouter.shared.handle(url)
        }
        .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
            if let url = activity.webpageURL {
                DeepLinkRouter.shared.handle(url)
            }
        }
    }

    /// Best-effort container build. If the SwiftData file is corrupt
    /// (extremely rare; would mean a half-written store), wipe and retry
    /// once. If it still fails we fall through to an in-memory container so
    /// the app stays usable — every list will look "empty" but mutations
    /// still hit the network.
    private func cacheContainer(for userId: UUID) -> ModelContainer {
        do {
            return try CacheContainer.make(for: userId)
        } catch {
            try? CacheContainer.wipe(userId: userId)
            if let retry = try? CacheContainer.make(for: userId) {
                return retry
            }
            return inMemoryFallbackContainer()
        }
    }

    private func inMemoryFallbackContainer() -> ModelContainer {
        let schema = Schema([
            CachedProject.self, CachedClient.self, CachedInquiry.self,
            CachedFinance.self, CachedGear.self, CachedLink.self,
            CachedContract.self, CachedContractTemplate.self,
        ])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        // ModelContainer with an in-memory config can technically still throw
        // on a misconfigured schema — try!ing here is acceptable because
        // the schema is hand-curated and exercised by tests.
        return try! ModelContainer(for: schema, configurations: [config])
    }
}

// Picks TabBarShell vs SplitViewShell based on horizontal size class so
// iPhone, iPad in compact width (Stage Manager 1/3), and iPad in regular
// width all land in the right layout. The global sheet presenter lives
// here so any deeply-nested module can set `router.presentedSheet`. Cache
// refresh-on-foreground also lives here so the modelContainer environment
// is in scope.
private struct LoggedInRoot: View {
    @Environment(\.horizontalSizeClass) private var hSize
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.modelContext) private var modelContext
    @State private var router = AppRouter.shared

    /// Drives the next-project Live Activity countdown while the app is
    /// foregrounded. Ticks once a minute. Background updates require a
    /// remote push to the activity push token; deferred to v1.1.
    @State private var liveActivityTimer = Timer.publish(every: 60, on: .main, in: .common).autoconnect()

    var body: some View {
        Group {
            if hSize == .regular {
                SplitViewShell(router: router)
            } else {
                TabBarShell(router: router)
            }
        }
        .sheet(item: $router.presentedSheet) { sheet in
            sheetDestination(sheet)
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                Task {
                    await refreshAllCaches(in: modelContext)
                    await refreshLiveActivity(in: modelContext)
                }
            }
        }
        .onReceive(liveActivityTimer) { _ in
            Task { await ProjectCountdownActivityManager.shared.tick() }
        }
        .task {
            await refreshLiveActivity(in: modelContext)
        }
    }
}

@MainActor
private func refreshLiveActivity(in context: ModelContext) async {
    let projects = (try? ProjectsCacheRepository.shared.cached(in: context)) ?? []
    await ProjectCountdownActivityManager.shared.refresh(projects: projects)
}

/// Kicks off a refresh on every cache repo in parallel with a per-repo
/// timeout so a single slow query doesn't block the rest. Errors are
/// swallowed — the caller is foreground-refresh, not user-initiated.
@MainActor
private func refreshAllCaches(in context: ModelContext) async {
    await withTaskGroup(of: Void.self) { group in
        group.addTask { await refresh { try await ProjectsCacheRepository.shared.refresh(in: context) } }
        group.addTask { await refresh { try await ClientsCacheRepository.shared.refresh(in: context) } }
        group.addTask { await refresh { try await InquiriesCacheRepository.shared.refresh(in: context) } }
        group.addTask { await refresh { try await FinancesCacheRepository.shared.refresh(in: context) } }
        group.addTask { await refresh { try await GearCacheRepository.shared.refresh(in: context) } }
        group.addTask { await refresh { try await LinksCacheRepository.shared.refresh(in: context) } }
        group.addTask { await refresh { try await ContractsCacheRepository.shared.refresh(in: context) } }
        group.addTask { await refresh { try await ContractTemplatesCacheRepository.shared.refresh(in: context) } }
    }
}

@MainActor
private func refresh(_ work: @MainActor @Sendable @escaping () async throws -> Void) async {
    // 5-second cap matches the spec — Supabase queries usually finish in
    // <500ms; anything longer is a network problem we shouldn't block on.
    try? await withThrowingTaskGroup(of: Void.self) { group in
        group.addTask { try await work() }
        group.addTask {
            try await Task.sleep(nanoseconds: 5_000_000_000)
            throw CancellationError()
        }
        try await group.next()
        group.cancelAll()
    }
}

private struct LoadingView: View {
    var body: some View {
        VStack {
            ProgressView()
                .tint(Color.tokens.accent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.tokens.bg)
    }
}

#Preview {
    RootView()
        .preferredColorScheme(.dark)
}
