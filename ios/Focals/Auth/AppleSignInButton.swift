import SwiftUI
import AuthenticationServices
import CryptoKit
import Supabase
import FocalsAPI

/// Sign in with Apple. The button's UI is provided by `SignInWithAppleButton`
/// (Apple's HIG-compliant component); on success we hand the identity token
/// to Supabase via `signInWithIdToken`, which validates and creates a session.
///
/// We generate a nonce locally, send its SHA-256 hash to Apple, and pass the
/// raw nonce to Supabase so the server can verify the round-trip. This is
/// Apple's recommended flow per:
/// https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/configuring_your_webpage_for_sign_in_with_apple#3326305
struct AppleSignInButton: View {
    @Environment(\.colorScheme) var colorScheme
    let onError: (String) -> Void

    @State private var nonce: String = ""

    var body: some View {
        SignInWithAppleButton(.signIn) { request in
            self.nonce = Self.randomNonceString()
            request.requestedScopes = [.email, .fullName]
            request.nonce = Self.sha256(self.nonce)
        } onCompletion: { result in
            Task { await handle(result) }
        }
        .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
        .frame(height: 50)
    }

    private func handle(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let authorization):
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let identityToken = credential.identityToken,
                let idTokenString = String(data: identityToken, encoding: .utf8)
            else {
                onError("Apple Sign In didn't return an identity token.")
                return
            }
            do {
                _ = try await FocalsClient.shared.supabase.auth.signInWithIdToken(
                    credentials: .init(provider: .apple, idToken: idTokenString, nonce: nonce)
                )
            } catch {
                onError(error.localizedDescription)
            }
        case .failure(let error):
            // ASAuthorizationError.canceled is the user backing out — silent.
            if let asError = error as? ASAuthorizationError, asError.code == .canceled {
                return
            }
            onError(error.localizedDescription)
        }
    }

    // MARK: - Apple's reference nonce helpers

    /// Cryptographically-random nonce. The raw value is sent to Supabase;
    /// only its SHA-256 hash leaves the device toward Apple.
    private static func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            let randoms: [UInt8] = (0..<16).map { _ in
                var random: UInt8 = 0
                let status = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
                if status != errSecSuccess {
                    fatalError("SecRandomCopyBytes failed: \(status)")
                }
                return random
            }
            for r in randoms {
                if remaining == 0 { break }
                if r < charset.count {
                    result.append(charset[Int(r)])
                    remaining -= 1
                }
            }
        }
        return result
    }

    private static func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hashed = SHA256.hash(data: data)
        return hashed.compactMap { String(format: "%02x", $0) }.joined()
    }
}
