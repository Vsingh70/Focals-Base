import Foundation
import Supabase
import FocalsModels

/// Read + delete access to the user's stored LLM API keys.
///
/// **Creation/update is intentionally not exposed here.** Storing a key
/// requires server-side encryption (AES-256-GCM with a secret only the
/// server has), which iOS can't do. Task 12 will add a `setAnthropicKey(_:)`
/// method that POSTs to the web's `/api/integrations/anthropic` route and
/// the server-side action performs the encrypt-and-store. This repo handles
/// only the operations iOS can do safely on its own.
public struct UserIntegrationsRepository: Sendable {
    public static let shared = UserIntegrationsRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    /// Returns the user's current integration for the given provider, or nil
    /// if they haven't connected one yet.
    public func get(provider: String) async throws -> UserIntegration? {
        let rows: [UserIntegration] = try await supabase
            .from("user_integrations")
            .select()
            .eq("provider", value: provider)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    /// Disconnects the user's stored key for the given provider. The next
    /// LLM-powered action will fail until they re-add it.
    public func delete(provider: String) async throws {
        try await supabase
            .from("user_integrations")
            .delete()
            .eq("provider", value: provider)
            .execute()
    }
}
