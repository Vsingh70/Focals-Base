import Foundation
import Supabase
import FocalsModels

public struct LinksRepository: Repository {
    public typealias Model = Link
    public static let shared = LinksRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<Link> {
        var query = supabase
            .from("links")
            .select()
        if let cursor = request.cursor {
            query = query.lt("created_at", value: cursor.iso8601String)
        }
        let items: [Link] = try await query
            .order("created_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.createdAt)
    }

    public func get(id: UUID) async throws -> Link {
        try await supabase
            .from("links")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: Link) async throws -> Link {
        try await supabase
            .from("links")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Link) async throws -> Link {
        try await supabase
            .from("links")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("links")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
