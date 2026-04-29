import Foundation
import Supabase
import FocalsModels

public struct ContractTemplatesRepository: Repository {
    public typealias Model = ContractTemplate
    public static let shared = ContractTemplatesRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<ContractTemplate> {
        var query = supabase
            .from("contract_templates")
            .select()
        if let cursor = request.cursor {
            query = query.lt("updated_at", value: cursor.iso8601String)
        }
        let items: [ContractTemplate] = try await query
            .order("updated_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.updatedAt)
    }

    public func get(id: UUID) async throws -> ContractTemplate {
        try await supabase
            .from("contract_templates")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: ContractTemplate) async throws -> ContractTemplate {
        try await supabase
            .from("contract_templates")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: ContractTemplate) async throws -> ContractTemplate {
        try await supabase
            .from("contract_templates")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("contract_templates")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
