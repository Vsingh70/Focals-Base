import Foundation
import Supabase
import FocalsModels

public struct FormsRepository: Repository {
    public typealias Model = Form
    public static let shared = FormsRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<Form> {
        var query = supabase
            .from("forms")
            .select()
        if let cursor = request.cursor {
            query = query.lt("updated_at", value: cursor.iso8601String)
        }
        let items: [Form] = try await query
            .order("updated_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.updatedAt)
    }

    public func get(id: UUID) async throws -> Form {
        try await supabase
            .from("forms")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: Form) async throws -> Form {
        try await supabase
            .from("forms")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Form) async throws -> Form {
        try await supabase
            .from("forms")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("forms")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
