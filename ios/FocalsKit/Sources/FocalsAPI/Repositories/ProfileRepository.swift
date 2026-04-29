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
}
