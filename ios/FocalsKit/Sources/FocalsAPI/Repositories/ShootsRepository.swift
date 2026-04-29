import Foundation
import Supabase
import FocalsModels

public struct ShootsRepository: Repository {
    public typealias Model = Shoot
    public static let shared = ShootsRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<Shoot> {
        var query = supabase
            .from("shoots")
            .select()
        if let cursor = request.cursor {
            query = query.lt("updated_at", value: cursor.iso8601String)
        }
        let items: [Shoot] = try await query
            .order("updated_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.updatedAt)
    }

    public func get(id: UUID) async throws -> Shoot {
        try await supabase
            .from("shoots")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: Shoot) async throws -> Shoot {
        try await supabase
            .from("shoots")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Shoot) async throws -> Shoot {
        try await supabase
            .from("shoots")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("shoots")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
