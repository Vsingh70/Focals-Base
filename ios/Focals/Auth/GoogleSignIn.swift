import Foundation
import AuthenticationServices
import Supabase
import FocalsAPI

/// Google Sign In via `ASWebAuthenticationSession` + Supabase's PKCE flow.
///
/// Use the SDK's high-level `signInWithOAuth(provider:redirectTo:launchURL:)`
/// rather than `getOAuthSignInURL` + manual exchange — the high-level method
/// is what generates the `code_verifier` and stashes it in the SDK's auth
/// storage. Calling `getOAuthSignInURL` directly skips the verifier creation,
/// so the subsequent `/auth/v1/token?grant_type=pkce` POST has no verifier
/// to send and the server rejects it with `validation_failed`.
@MainActor
final class GoogleSignIn: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = GoogleSignIn()

    /// Custom URL scheme registered in Info.plist (Task 01 Step 10). Must
    /// match `OAUTH_URL_SCHEME` in Secrets.xcconfig and the redirect URL
    /// allowlisted in Supabase's Auth settings.
    private static let callbackScheme = "com.focals.ios"
    private static let redirectURL = URL(string: "com.focals.ios://oauth-callback")!

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }

    func signIn() async throws {
        #if DEBUG
        print("[GoogleSignIn] === starting signInWithOAuth (PKCE) ===")
        #endif
        do {
            try await FocalsClient.shared.supabase.auth.signInWithOAuth(
                provider: .google,
                redirectTo: Self.redirectURL,
                launchFlow: { @MainActor [weak self] url in
                    #if DEBUG
                    print("[GoogleSignIn] launchFlow handed url: \(url.absoluteString.prefix(160))…")
                    #endif
                    guard let self else { throw GoogleSignInError.noCallbackURL }
                    return try await self.openOAuthURL(url)
                }
            )
            #if DEBUG
            print("[GoogleSignIn] signInWithOAuth completed successfully")
            #endif
        } catch {
            #if DEBUG
            print("[GoogleSignIn] signInWithOAuth threw: \(error)")
            #endif
            throw error
        }
    }

    private func openOAuthURL(_ url: URL) async throws -> URL {
        try await withCheckedThrowingContinuation { cont in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: Self.callbackScheme
            ) { callbackURL, error in
                if let callbackURL {
                    #if DEBUG
                    print("[GoogleSignIn] callback URL: \(callbackURL.absoluteString)")
                    #endif
                    cont.resume(returning: callbackURL)
                } else if let error {
                    cont.resume(throwing: error)
                } else {
                    cont.resume(throwing: GoogleSignInError.noCallbackURL)
                }
            }
            session.presentationContextProvider = self
            // Share Safari cookies so users already signed in to Google in
            // Safari skip the password prompt.
            session.prefersEphemeralWebBrowserSession = false
            session.start()
        }
    }
}

enum GoogleSignInError: LocalizedError {
    case noCallbackURL

    var errorDescription: String? {
        switch self {
        case .noCallbackURL: return "Google didn't return a callback URL."
        }
    }
}
