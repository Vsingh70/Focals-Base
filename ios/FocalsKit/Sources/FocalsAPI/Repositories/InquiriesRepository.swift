import Foundation
import Supabase
import FocalsModels

public struct InquiriesRepository: Repository {
    public typealias Model = Inquiry
    public static let shared = InquiriesRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<Inquiry> {
        var query = supabase
            .from("inquiries")
            .select()
        if let cursor = request.cursor {
            query = query.lt("updated_at", value: cursor.iso8601String)
        }
        let items: [Inquiry] = try await query
            .order("updated_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.updatedAt)
    }

    public func get(id: UUID) async throws -> Inquiry {
        try await supabase
            .from("inquiries")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: Inquiry) async throws -> Inquiry {
        try await supabase
            .from("inquiries")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Inquiry) async throws -> Inquiry {
        try await supabase
            .from("inquiries")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("inquiries")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
