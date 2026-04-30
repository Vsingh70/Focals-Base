import Foundation
import SwiftData

/// Factory for the SwiftData read-cache `ModelContainer`.
///
/// One container per user — the store file lives in the App Group shared
/// container so widgets/extensions in Task 13 can read from the same
/// SwiftData store without re-fetching from Supabase.
///
/// **App Group fallback**: until the app is signed with a real provisioning
/// profile (Apple Developer enrollment is a Task 14 prereq),
/// `containerURL(forSecurityApplicationGroupIdentifier:)` returns nil. We
/// fall back to `Application Support/` so simulator + unsigned builds still
/// get a working cache. Once provisioning lands, the same code path picks
/// up the App Group automatically.
public enum CacheContainer {
    /// The bundle prefix here intentionally matches the app's bundle ID
    /// (`com.focals.ios`) — Apple's convention is `group.<bundle id>`.
    public static let appGroupIdentifier = "group.com.focals.ios"

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
        let configuration = ModelConfiguration(
            schema: schema,
            url: storeURL(for: userId),
            cloudKitDatabase: .none
        )
        return try ModelContainer(for: schema, configurations: [configuration])
    }

    /// Delete the store file (and SQLite WAL/SHM siblings) for a given user.
    /// Called from SessionStore on sign-out so a different user signing in
    /// on the same device doesn't see the previous user's data.
    public static func wipe(userId: UUID) throws {
        let url = storeURL(for: userId)
        try? FileManager.default.removeItem(at: url)
        // SQLite write-ahead log + shared memory companion files.
        try? FileManager.default.removeItem(at: url.appendingPathExtension("wal"))
        try? FileManager.default.removeItem(at: url.appendingPathExtension("shm"))
    }

    static func storeURL(for userId: UUID) -> URL {
        baseDirectory()
            .appendingPathComponent("cache-\(userId.uuidString).store")
    }

    /// App Group container if entitled; otherwise the standard Application
    /// Support directory. Both are valid SwiftData store locations.
    private static func baseDirectory() -> URL {
        if let groupURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupIdentifier
        ) {
            return groupURL
        }
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: support, withIntermediateDirectories: true)
        return support
    }
}
