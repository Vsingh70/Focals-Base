import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

@MainActor
public struct InquiriesCacheRepository: CacheRepository {
    public typealias Model = Inquiry
    public typealias Cached = CachedInquiry
    public static let shared = InquiriesCacheRepository()

    public func cached(in context: ModelContext) throws -> [Inquiry] {
        var descriptor = FetchDescriptor<CachedInquiry>(
            sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
        )
        descriptor.fetchLimit = 500
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let page = try await InquiriesRepository.shared.list(.init(limit: 100))
        for inquiry in page.items {
            try upsert(inquiry, in: context)
        }
        try context.save()
    }

    public func create(_ payload: Inquiry, in context: ModelContext) async throws -> Inquiry {
        try requireOnline()
        let saved = try await InquiriesRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: Inquiry, in context: ModelContext) async throws -> Inquiry {
        try requireOnline()
        let saved = try await InquiriesRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try requireOnline()
        try await InquiriesRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    private func upsert(_ inquiry: Inquiry, in context: ModelContext) throws {
        let id = inquiry.id
        let descriptor = FetchDescriptor<CachedInquiry>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            existing.applyServer(inquiry)
        } else {
            context.insert(CachedInquiry(from: inquiry))
        }
    }

    private func removeFromCache(id: UUID, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedInquiry>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            context.delete(existing)
        }
    }
}
