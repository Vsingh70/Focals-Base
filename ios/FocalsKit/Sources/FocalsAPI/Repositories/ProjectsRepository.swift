import Foundation
import Supabase
import FocalsModels

public struct ProjectsRepository: Repository {
    public typealias Model = Project
    public static let shared = ProjectsRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<Project> {
        var query = supabase
            .from("projects")
            .select()
        if let cursor = request.cursor {
            query = query.lt("updated_at", value: cursor.iso8601String)
        }
        let items: [Project] = try await query
            .order("updated_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.updatedAt)
    }

    public func get(id: UUID) async throws -> Project {
        try await supabase
            .from("projects")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: Project) async throws -> Project {
        try await supabase
            .from("projects")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Project) async throws -> Project {
        try await supabase
            .from("projects")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("projects")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
