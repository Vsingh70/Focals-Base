import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

@MainActor
public struct ContractTemplatesCacheRepository: CacheRepository {
    public typealias Model = ContractTemplate
    public typealias Cached = CachedContractTemplate
    public static let shared = ContractTemplatesCacheRepository()

    public func cached(in context: ModelContext) throws -> [ContractTemplate] {
        var descriptor = FetchDescriptor<CachedContractTemplate>(
            sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
        )
        descriptor.fetchLimit = 500
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let page = try await ContractTemplatesRepository.shared.list(.init(limit: 100))
        for template in page.items {
            try upsert(template, in: context)
        }
        try context.save()
    }

    public func create(_ payload: ContractTemplate, in context: ModelContext) async throws -> ContractTemplate {
        try requireOnline()
        let saved = try await ContractTemplatesRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: ContractTemplate, in context: ModelContext) async throws -> ContractTemplate {
        try requireOnline()
        let saved = try await ContractTemplatesRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try requireOnline()
        try await ContractTemplatesRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    private func upsert(_ template: ContractTemplate, in context: ModelContext) throws {
        let id = template.id
        let descriptor = FetchDescriptor<CachedContractTemplate>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            existing.applyServer(template)
        } else {
            context.insert(CachedContractTemplate(from: template))
        }
    }

    private func removeFromCache(id: UUID, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedContractTemplate>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            context.delete(existing)
        }
    }
}
