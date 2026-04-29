# Task 05 — Read-Cache Layer (SwiftData)

## Goal

Stand up a SwiftData read-cache so list screens render in < 200ms cold even on slow networks. Mutations stay online-only for v1 (offline writes deferred to v1.1). After this task, every list screen can call `cache.list()` and get instant data, with a background refresh updating the cache from Supabase.

The cache is **read-only from the app's perspective** — writes always go through `FocalsAPI.Repository` first; on success, the cache is updated from the server response. On airplane mode, cached data renders; create/update/delete attempts surface a clear error toast.

---

## Step 1 — App Group capability (for widget sharing in Task 13)

In Xcode → Signing & Capabilities → `+ Capability` → **App Groups**. Create group: `group.com.[APP_NAME].ios`. Add to:
- Main app target
- (Later) `FocalsWidgets` extension target
- (Later) `FocalsIntents` extension target

The SwiftData store goes in the App Group's shared container so widgets can read it without re-fetching from Supabase.

## Step 2 — SwiftData model containers in `FocalsCache`

Create `ios/FocalsKit/Sources/FocalsCache/`. Each cached table is a SwiftData `@Model`. **Don't reuse `FocalsModels` structs** — SwiftData needs class-based `@Model` types. Mirror them.

Example: `CachedProject.swift`:

```swift
import Foundation
import SwiftData
import FocalsModels

@Model
public final class CachedProject {
    @Attribute(.unique) public var serverId: UUID
    public var userId: UUID
    public var title: String
    public var status: String         // ProjectStatus.rawValue
    public var category: String?
    public var location: String?
    public var notes: String?
    public var packagePrice: Double?
    public var amountPaid: Double?
    public var paymentStatus: String  // PaymentStatus.rawValue
    public var shootDate: Date?
    public var clientId: UUID?
    public var createdAt: Date
    public var updatedAt: Date
    public var lastSyncedAt: Date

    public init(from model: Project) {
        self.serverId = model.id
        self.userId = model.userId
        self.title = model.title
        self.status = model.status.rawValue
        // ...
        self.lastSyncedAt = .now
    }

    public func toModel() -> Project {
        Project(
            id: serverId,
            userId: userId,
            title: title,
            status: ProjectStatus(rawValue: status) ?? .lead,
            // ...
        )
    }
}
```

Do this for: `CachedProject`, `CachedClient`, `CachedInquiry`, `CachedFinance`, `CachedGear`, `CachedLink`, `CachedContract`, `CachedContractTemplate`.

Skip caching: `profiles` (single row, fetched once on session bootstrap), `forms` (read-only, low frequency), `inquiry_sources` (settings-only).

## Step 3 — Container factory keyed by user

Create `FocalsCache/CacheContainer.swift`:

```swift
import Foundation
import SwiftData

public enum CacheContainer {
    /// One container per user_id; lives in the App Group shared container.
    public static func make(for userId: UUID) throws -> ModelContainer {
        let schema = Schema([
            CachedProject.self,
            CachedClient.self,
            CachedInquiry.self,
            CachedFinance.self,
            CachedGear.self,
            CachedLink.self,
            CachedContract.self,
            CachedContractTemplate.self,
        ])
        let url = appGroupURL.appendingPathComponent("cache-\(userId.uuidString).store")
        let configuration = ModelConfiguration(
            schema: schema,
            url: url,
            cloudKitDatabase: .none
        )
        return try ModelContainer(for: schema, configurations: [configuration])
    }

    public static func wipe(userId: UUID) throws {
        let url = appGroupURL.appendingPathComponent("cache-\(userId.uuidString).store")
        try? FileManager.default.removeItem(at: url)
        // Also remove SQLite WAL/SHM siblings
        try? FileManager.default.removeItem(at: url.appendingPathExtension("wal"))
        try? FileManager.default.removeItem(at: url.appendingPathExtension("shm"))
    }

    private static var appGroupURL: URL {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: "group.com.[APP_NAME].ios")!
    }
}
```

Inject the container into the root view's environment in `RootView` once `SessionStore` reports a user:

```swift
.modelContainer(try! CacheContainer.make(for: session.user!.id))
```

Wipe on sign-out from `SessionStore.wipeLocalData()` (Task 03).

## Step 4 — `CacheRepository` protocol

Create `FocalsCache/CacheRepository.swift`:

```swift
import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

public protocol CacheRepository<Model> {
    associatedtype Model: Codable & Identifiable & Sendable
    associatedtype Cached: PersistentModel

    /// Returns cached items immediately (synchronously from the SwiftData context).
    func cached(in context: ModelContext) throws -> [Model]

    /// Fetches deltas from Supabase, merges into cache.
    func refresh(in context: ModelContext) async throws

    /// Bypasses cache; calls server directly. Updates cache on success.
    func create(_ payload: Model, in context: ModelContext) async throws -> Model
    func update(_ payload: Model, in context: ModelContext) async throws -> Model
    func delete(id: UUID, in context: ModelContext) async throws
}
```

## Step 5 — Concrete cache repos

One per cached table. Example `ProjectsCacheRepository`:

```swift
import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

public struct ProjectsCacheRepository: CacheRepository {
    public typealias Model = Project
    public typealias Cached = CachedProject
    public static let shared = ProjectsCacheRepository()

    public func cached(in context: ModelContext) throws -> [Project] {
        let descriptor = FetchDescriptor<CachedProject>(
            sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
        )
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let cursor = try lastSync(in: context)
        let page = try await ProjectsRepository.shared.list(.init(cursor: cursor, limit: 100))
        for serverProject in page.items {
            try upsert(serverProject, in: context)
        }
        try context.save()
    }

    public func create(_ payload: Project, in context: ModelContext) async throws -> Project {
        let saved = try await ProjectsRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: Project, in context: ModelContext) async throws -> Project {
        let saved = try await ProjectsRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try await ProjectsRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    private func upsert(_ project: Project, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedProject>(
            predicate: #Predicate { $0.serverId == project.id }
        )
        if let existing = try context.fetch(descriptor).first {
            existing.applyServer(project)
        } else {
            context.insert(CachedProject(from: project))
        }
    }

    private func removeFromCache(id: UUID, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedProject>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            context.delete(existing)
        }
    }

    private func lastSync(in context: ModelContext) throws -> Date? {
        let descriptor = FetchDescriptor<CachedProject>(
            sortBy: [SortDescriptor(\.lastSyncedAt, order: .reverse)]
        )
        var d = descriptor; d.fetchLimit = 1
        return try context.fetch(d).first?.lastSyncedAt
    }
}
```

Repeat for the 8 other cached tables. Extract the boilerplate into a generic when the duplication is unbearable; for v1, hand-roll is fine and easier to debug.

## Step 6 — `@Query` integration in views

Module screens (Tasks 06–12) read cached data via SwiftData `@Query`:

```swift
struct ProjectsScreen: View {
    @Query(sort: \CachedProject.updatedAt, order: .reverse) private var projects: [CachedProject]
    @Environment(\.modelContext) private var context

    @State private var refreshing = false

    var body: some View {
        List {
            ForEach(projects) { p in
                ProjectRow(project: p.toModel())
            }
        }
        .overlay {
            if projects.isEmpty && !refreshing {
                EmptyState(symbol: "folder", title: "No projects yet", body: "Create your first project from the toolbar.")
            }
        }
        .refreshable {
            try? await ProjectsCacheRepository.shared.refresh(in: context)
        }
        .task {
            // First-launch refresh — cache is empty
            if projects.isEmpty {
                refreshing = true
                try? await ProjectsCacheRepository.shared.refresh(in: context)
                refreshing = false
            }
        }
    }
}
```

This is the canonical pattern. Tasks 06–12 follow it.

## Step 7 — Refresh strategy

Three triggers refresh the cache:
1. **App foreground** — `.onChange(of: scenePhase)` → `.active`
2. **Pull-to-refresh** — `.refreshable`
3. **After a mutation** — `create/update/delete` already update cache from response, so no extra refresh needed

App-foreground refresh in `RootView`:

```swift
.onChange(of: scenePhase) { _, phase in
    if phase == .active {
        Task { await refreshAllCaches() }
    }
}
```

`refreshAllCaches()` calls each cache repo's `refresh()` in parallel via `withTaskGroup`. Wrap in a 5-second timeout per repo so a single slow table doesn't block the others.

## Step 8 — Mutations during offline state

When `ConnectivityMonitor.shared.isOffline == true`, mutation calls should fail fast with a clear error rather than hanging on a long network timeout:

```swift
public func create(_ payload: Project, in context: ModelContext) async throws -> Project {
    if ConnectivityMonitor.shared.isOffline {
        throw FocalsAPIError.offline
    }
    // ... existing code
}
```

Module screens catch `FocalsAPIError.offline` and show an error toast. Standard pattern via shared `ErrorToast` view.

## Step 9 — Wipe on sign-out

In `SessionStore.wipeLocalData()`, after the user is set to nil:

```swift
private func wipeLocalData(userId: UUID?) async {
    if let userId {
        try? CacheContainer.wipe(userId: userId)
    }
    URLCache.shared.removeAllCachedResponses()
    // Kingfisher cache wiped in Task 09 once added
}
```

Pass the previous user's ID into the wipe — once `auth.users` is nil, you've lost the ID.

## Step 10 — Document the v1.1 evolution path

Create `ios/FocalsKit/Sources/FocalsCache/OFFLINE_FIRST.md`:

> Read-cache only — v1. Mutations require connectivity.
>
> v1.1 plan: add a `MutationOutbox` SwiftData model with rows like `{ id, table, op (create/update/delete), payload (JSON), createdAt }`. On mutation when offline, append to outbox and update the cached row optimistically. A background task drains the outbox in order whenever connectivity returns. Conflict policy: server-wins, but log conflicts to a Settings → Sync log so the user sees what was lost.
>
> Schema migration story: SwiftData supports `@Migration` blocks. Bump the schema version when adding columns. Test migrations in `FocalsTests/`.

This is documentation, not code — saves the next session from re-deriving the design.

---

## Acceptance Criteria

- [ ] App Group `group.com.[APP_NAME].ios` is configured on the main target
- [ ] All 9 cached `@Model` classes exist with `serverId` unique attribute
- [ ] `CacheContainer.make(for:)` creates a SwiftData store at the App Group path keyed by user
- [ ] Sign-out wipes the SwiftData store file (verify by inspecting Files app on device → cache file gone)
- [ ] Airplane mode: app launches → list screens render cached data within 200ms (verified with Time Profiler in Instruments)
- [ ] Pull-to-refresh while offline does not crash; surfaces a subtle banner via `ConnectivityMonitor`
- [ ] Attempting to create a record while offline throws `FocalsAPIError.offline` and shows an error toast
- [ ] When network returns, foreground app → cache refreshes via delta `updated_at` cursor (verified by counting requests in Charles or `URLSession` logging — second refresh fetches < 5 rows on a quiet account)
- [ ] After a mutation, the cache reflects the new state without a separate `refresh()` call (single-round-trip update)
- [ ] Two simultaneous foreground refreshes (e.g. swipe-up while still loading) don't double-insert cached rows
- [ ] `OFFLINE_FIRST.md` exists and documents the v1.1 plan

## Depends on

- 02 (Models, repositories — cache layers on top of `FocalsAPI`)
- 03 (SessionStore wipes the cache on sign-out)
- 04 (Connectivity banner consumes `ConnectivityMonitor`)
