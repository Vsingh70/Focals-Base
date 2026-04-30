import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

@MainActor
public struct ClientsCacheRepository: CacheRepository {
    public typealias Model = Client
    public typealias Cached = CachedClient
    public static let shared = ClientsCacheRepository()

    public func cached(in context: ModelContext) throws -> [Client] {
        var descriptor = FetchDescriptor<CachedClient>(
            sortBy: [SortDescriptor(\.fullName, order: .forward)]
        )
        descriptor.fetchLimit = 1000
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let page = try await ClientsRepository.shared.list(.init(limit: 100))
        for client in page.items {
            try upsert(client, in: context)
        }
        try context.save()
    }

    public func create(_ payload: Client, in context: ModelContext) async throws -> Client {
        try requireOnline()
        let saved = try await ClientsRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: Client, in context: ModelContext) async throws -> Client {
        try requireOnline()
        let saved = try await ClientsRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try requireOnline()
        try await ClientsRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    private func upsert(_ client: Client, in context: ModelContext) throws {
        let id = client.id
        let descriptor = FetchDescriptor<CachedClient>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            existing.applyServer(client)
        } else {
            context.insert(CachedClient(from: client))
        }
    }

    private func removeFromCache(id: UUID, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedClient>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            context.delete(existing)
        }
    }
}
