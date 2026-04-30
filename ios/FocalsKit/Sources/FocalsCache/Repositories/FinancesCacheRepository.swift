import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

@MainActor
public struct FinancesCacheRepository: CacheRepository {
    public typealias Model = Finance
    public typealias Cached = CachedFinance
    public static let shared = FinancesCacheRepository()

    public func cached(in context: ModelContext) throws -> [Finance] {
        var descriptor = FetchDescriptor<CachedFinance>(
            sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
        )
        descriptor.fetchLimit = 1000
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let page = try await FinancesRepository.shared.list(.init(limit: 100))
        for finance in page.items {
            try upsert(finance, in: context)
        }
        try context.save()
    }

    public func create(_ payload: Finance, in context: ModelContext) async throws -> Finance {
        try requireOnline()
        let saved = try await FinancesRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: Finance, in context: ModelContext) async throws -> Finance {
        try requireOnline()
        let saved = try await FinancesRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try requireOnline()
        try await FinancesRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    private func upsert(_ finance: Finance, in context: ModelContext) throws {
        let id = finance.id
        let descriptor = FetchDescriptor<CachedFinance>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            existing.applyServer(finance)
        } else {
            context.insert(CachedFinance(from: finance))
        }
    }

    private func removeFromCache(id: UUID, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedFinance>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            context.delete(existing)
        }
    }
}
