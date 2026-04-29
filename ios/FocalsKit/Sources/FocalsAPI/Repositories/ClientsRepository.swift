import Foundation
import Supabase
import FocalsModels

public struct ClientsRepository: Repository {
    public typealias Model = Client
    public static let shared = ClientsRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<Client> {
        var query = supabase
            .from("clients")
            .select()
        if let cursor = request.cursor {
            query = query.lt("updated_at", value: cursor.iso8601String)
        }
        let items: [Client] = try await query
            .order("updated_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.updatedAt)
    }

    public func get(id: UUID) async throws -> Client {
        try await supabase
            .from("clients")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: Client) async throws -> Client {
        try await supabase
            .from("clients")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Client) async throws -> Client {
        try await supabase
            .from("clients")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("clients")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
