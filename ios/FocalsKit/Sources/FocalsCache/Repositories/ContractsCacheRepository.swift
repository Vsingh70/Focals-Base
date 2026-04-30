import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

@MainActor
public struct ContractsCacheRepository: CacheRepository {
    public typealias Model = Contract
    public typealias Cached = CachedContract
    public static let shared = ContractsCacheRepository()

    public func cached(in context: ModelContext) throws -> [Contract] {
        var descriptor = FetchDescriptor<CachedContract>(
            sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
        )
        descriptor.fetchLimit = 500
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let page = try await ContractsRepository.shared.list(.init(limit: 100))
        for contract in page.items {
            try upsert(contract, in: context)
        }
        try context.save()
    }

    public func create(_ payload: Contract, in context: ModelContext) async throws -> Contract {
        try requireOnline()
        let saved = try await ContractsRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: Contract, in context: ModelContext) async throws -> Contract {
        try requireOnline()
        let saved = try await ContractsRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try requireOnline()
        try await ContractsRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    private func upsert(_ contract: Contract, in context: ModelContext) throws {
        let id = contract.id
        let descriptor = FetchDescriptor<CachedContract>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            existing.applyServer(contract)
        } else {
            context.insert(CachedContract(from: contract))
        }
    }

    private func removeFromCache(id: UUID, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedContract>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            context.delete(existing)
        }
    }
}
