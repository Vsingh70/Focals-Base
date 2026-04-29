import Foundation
import Supabase
import FocalsModels

public struct InquirySourcesRepository: Repository {
    public typealias Model = InquirySource
    public static let shared = InquirySourcesRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<InquirySource> {
        var query = supabase
            .from("inquiry_sources")
            .select()
        if let cursor = request.cursor {
            query = query.lt("created_at", value: cursor.iso8601String)
        }
        let items: [InquirySource] = try await query
            .order("created_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.createdAt)
    }

    public func get(id: UUID) async throws -> InquirySource {
        try await supabase
            .from("inquiry_sources")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: InquirySource) async throws -> InquirySource {
        try await supabase
            .from("inquiry_sources")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: InquirySource) async throws -> InquirySource {
        try await supabase
            .from("inquiry_sources")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("inquiry_sources")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
