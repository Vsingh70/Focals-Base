import Foundation
import Supabase
import FocalsModels

public struct FinancesRepository: Repository {
    public typealias Model = Finance
    public static let shared = FinancesRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<Finance> {
        var query = supabase
            .from("finances")
            .select()
        if let cursor = request.cursor {
            query = query.lt("created_at", value: cursor.iso8601String)
        }
        let items: [Finance] = try await query
            .order("created_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.createdAt)
    }

    public func get(id: UUID) async throws -> Finance {
        try await supabase
            .from("finances")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: Finance) async throws -> Finance {
        try await supabase
            .from("finances")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Finance) async throws -> Finance {
        try await supabase
            .from("finances")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("finances")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
