import Foundation
import Supabase
import FocalsModels

public struct GearRepository: Repository {
    public typealias Model = Gear
    public static let shared = GearRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<Gear> {
        var query = supabase
            .from("gear")
            .select()
        if let cursor = request.cursor {
            query = query.lt("created_at", value: cursor.iso8601String)
        }
        let items: [Gear] = try await query
            .order("created_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.createdAt)
    }

    public func get(id: UUID) async throws -> Gear {
        try await supabase
            .from("gear")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: Gear) async throws -> Gear {
        try await supabase
            .from("gear")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Gear) async throws -> Gear {
        try await supabase
            .from("gear")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("gear")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
