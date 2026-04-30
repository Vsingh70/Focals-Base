import Foundation
import SwiftData
import FocalsAPI

/// Contract every per-table cache repo conforms to.
///
/// Reads come straight out of the local SwiftData store via `cached(in:)`;
/// `refresh(in:)` fetches the latest page from Supabase and upserts each row
/// so concurrent refreshes don't double-insert. Mutations always go through
/// the network first — on success the cache is updated from the server's
/// authoritative copy. On airplane mode, mutations throw `.offline` instead
/// of hanging on a long URLSession timeout.
@MainActor
public protocol CacheRepository {
    associatedtype Model: Codable & Identifiable & Sendable
    associatedtype Cached: PersistentModel

    /// Snapshot of cached rows, deserialized into the value-type model.
    func cached(in context: ModelContext) throws -> [Model]

    /// Pulls the latest page from Supabase and merges into the cache.
    /// Idempotent — a second concurrent call will upsert the same rows.
    func refresh(in context: ModelContext) async throws

    func create(_ payload: Model, in context: ModelContext) async throws -> Model
    func update(_ payload: Model, in context: ModelContext) async throws -> Model
    func delete(id: UUID, in context: ModelContext) async throws
}

/// Run-or-throw: if the device has no network, throw `.offline` immediately
/// so mutation calls don't hang on a 60-second URLSession timeout. Reading
/// from the cache is always allowed offline.
@MainActor
public func requireOnline() throws {
    if CacheConnectivityRegistry.shared.isOffline {
        throw FocalsAPIError.offline
    }
}

/// The slice of "is the network up?" the cache layer needs. The real
/// `ConnectivityMonitor` (NWPathMonitor-backed) lives in the app target;
/// FocalsCache itself stays headless and just consults this protocol.
@MainActor
public protocol CacheConnectivity: AnyObject {
    var isOffline: Bool { get }
}

/// Mutable registry — the app target plugs in its real connectivity
/// monitor at launch. Tests / SwiftPM-only consumers get the
/// `AlwaysOnline` default, which makes the repos exercisable without
/// pulling Network framework into a test environment.
@MainActor
public enum CacheConnectivityRegistry {
    public static var shared: CacheConnectivity = AlwaysOnline()
}

private final class AlwaysOnline: CacheConnectivity {
    var isOffline: Bool { false }
}
