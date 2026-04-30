import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

@MainActor
public struct ProjectsCacheRepository: CacheRepository {
    public typealias Model = Project
    public typealias Cached = CachedProject
    public static let shared = ProjectsCacheRepository()

    public func cached(in context: ModelContext) throws -> [Project] {
        var descriptor = FetchDescriptor<CachedProject>(
            sortBy: [SortDescriptor(\.updatedAt, order: .reverse)]
        )
        descriptor.fetchLimit = 500
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let page = try await ProjectsRepository.shared.list(.init(limit: 100))
        for serverProject in page.items {
            try upsert(serverProject, in: context)
        }
        try context.save()
    }

    public func create(_ payload: Project, in context: ModelContext) async throws -> Project {
        try requireOnline()
        let saved = try await ProjectsRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: Project, in context: ModelContext) async throws -> Project {
        try requireOnline()
        let saved = try await ProjectsRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try requireOnline()
        try await ProjectsRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    private func upsert(_ project: Project, in context: ModelContext) throws {
        let projectId = project.id
        let descriptor = FetchDescriptor<CachedProject>(
            predicate: #Predicate { $0.serverId == projectId }
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
}
