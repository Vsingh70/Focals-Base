import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

@MainActor
public struct LinksCacheRepository: CacheRepository {
    public typealias Model = Link
    public typealias Cached = CachedLink
    public static let shared = LinksCacheRepository()

    public func cached(in context: ModelContext) throws -> [Link] {
        var descriptor = FetchDescriptor<CachedLink>(
            sortBy: [SortDescriptor(\.title, order: .forward)]
        )
        descriptor.fetchLimit = 1000
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let page = try await LinksRepository.shared.list(.init(limit: 100))
        for link in page.items {
            try upsert(link, in: context)
        }
        try context.save()
    }

    public func create(_ payload: Link, in context: ModelContext) async throws -> Link {
        try requireOnline()
        let saved = try await LinksRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: Link, in context: ModelContext) async throws -> Link {
        try requireOnline()
        let saved = try await LinksRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try requireOnline()
        try await LinksRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    private func upsert(_ link: Link, in context: ModelContext) throws {
        let id = link.id
        let descriptor = FetchDescriptor<CachedLink>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            existing.applyServer(link)
        } else {
            context.insert(CachedLink(from: link))
        }
    }

    private func removeFromCache(id: UUID, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedLink>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            context.delete(existing)
        }
    }
}
