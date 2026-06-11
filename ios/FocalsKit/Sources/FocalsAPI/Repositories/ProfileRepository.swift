import Foundation
import Supabase
import FocalsModels

public struct ProfileRepository: Sendable {
    public static let shared = ProfileRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func getCurrent() async throws -> Profile {
        try await supabase
            .from("profiles")
            .select()
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Profile) async throws -> Profile {
        try await supabase
            .from("profiles")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    /// Patch only the APNs push token. Pass `nil` on sign-out / opt-out so
    /// the server-side notify functions know to skip this user. Requires the
    /// `profiles.push_token` column added by the web's migration; if the
    /// column isn't there yet this throws and the caller should swallow it.
    public func updatePushToken(_ token: String?, userId: UUID) async throws {
        struct PushTokenPatch: Encodable {
            let push_token: String?
        }
        try await supabase
            .from("profiles")
            .update(PushTokenPatch(push_token: token))
            .eq("id", value: userId)
            .execute()
    }
}
