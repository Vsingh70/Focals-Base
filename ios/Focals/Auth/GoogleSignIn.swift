import Foundation
import AuthenticationServices
import Supabase
import FocalsAPI

/// Google Sign In via `ASWebAuthenticationSession` + Supabase's PKCE flow.
///
/// We deliberately don't pull in the GoogleSignIn SPM dependency — supabase-swift
/// can already mint a Google OAuth URL via `getOAuthSignInURL(provider: .google)`,
/// and `ASWebAuthenticationSession` handles the in-app browser hand-off. That
/// avoids ~30MB of transitive deps for a feature that's already free on the
/// Supabase side.
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
        let url = try FocalsClient.shared.supabase.auth.getOAuthSignInURL(
            provider: .google,
            redirectTo: Self.redirectURL
        )

        let callbackURL: URL = try await withCheckedThrowingContinuation { cont in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: Self.callbackScheme
            ) { url, error in
                if let url {
                    cont.resume(returning: url)
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

        // Hand the callback URL to supabase-swift; it'll exchange the code
        // for a session and persist it to Keychain on its own.
        try await FocalsClient.shared.supabase.auth.session(from: callbackURL)
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
