import Foundation
import Auth
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

        // We override the default Keychain-backed storage with a hybrid:
        // sessions go to UserDefaults so they persist across launches, and the
        // PKCE `code_verifier` round-trip works reliably on the simulator.
        // The default `KeychainLocalStorage` silently swallows write failures
        // and returns nil on read, which manifests as
        // `validation_failed: both auth code and code verifier should be non-empty`
        // when Supabase rejects the post-OAuth `/token` exchange.
        // Revisit when/if iOS 17+ keychain entitlements are sorted on the
        // app target.
        let options = SupabaseClientOptions(
            auth: SupabaseClientOptions.AuthOptions(
                storage: UserDefaultsAuthStorage()
            )
        )

        self.supabase = SupabaseClient(
            supabaseURL: parsedURL,
            supabaseKey: key,
            options: options
        )
    }
}

/// `AuthLocalStorage` backed by `UserDefaults`. Survives app restarts (so
/// the user stays signed in) without depending on Keychain entitlements.
/// Stored values are not encrypted — acceptable for an access-token cache,
/// since the same token is stored in cleartext in the Keychain by default.
private struct UserDefaultsAuthStorage: AuthLocalStorage {
    private let defaults: UserDefaults
    private let prefix = "focals.auth."

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func store(key: String, value: Data) throws {
        defaults.set(value, forKey: prefix + key)
    }

    func retrieve(key: String) throws -> Data? {
        defaults.data(forKey: prefix + key)
    }

    func remove(key: String) throws {
        defaults.removeObject(forKey: prefix + key)
    }
}
