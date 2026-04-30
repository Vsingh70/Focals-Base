import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

@MainActor
public struct GearCacheRepository: CacheRepository {
    public typealias Model = Gear
    public typealias Cached = CachedGear
    public static let shared = GearCacheRepository()

    public func cached(in context: ModelContext) throws -> [Gear] {
        var descriptor = FetchDescriptor<CachedGear>(
            sortBy: [SortDescriptor(\.name, order: .forward)]
        )
        descriptor.fetchLimit = 1000
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let page = try await GearRepository.shared.list(.init(limit: 100))
        for gear in page.items {
            try upsert(gear, in: context)
        }
        try context.save()
    }

    public func create(_ payload: Gear, in context: ModelContext) async throws -> Gear {
        try requireOnline()
        let saved = try await GearRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: Gear, in context: ModelContext) async throws -> Gear {
        try requireOnline()
        let saved = try await GearRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try requireOnline()
        try await GearRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    private func upsert(_ gear: Gear, in context: ModelContext) throws {
        let id = gear.id
        let descriptor = FetchDescriptor<CachedGear>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            existing.applyServer(gear)
        } else {
            context.insert(CachedGear(from: gear))
        }
    }

    private func removeFromCache(id: UUID, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedGear>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            context.delete(existing)
        }
    }
}
