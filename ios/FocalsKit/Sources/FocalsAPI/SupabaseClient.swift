import Foundation
import Supabase

public final class FocalsClient: @unchecked Sendable {
    public static let shared = FocalsClient()

    public let supabase: SupabaseClient

    private init() {
        guard
            let url = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
            let key = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
            let parsedURL = URL(string: url)
        else {
            preconditionFailure("Missing or invalid SUPABASE_URL / SUPABASE_ANON_KEY in Info.plist")
        }
        self.supabase = SupabaseClient(supabaseURL: parsedURL, supabaseKey: key)
    }
}
