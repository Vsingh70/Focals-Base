# Task 03 — Auth & Session

## Goal

Wire Google OAuth + Apple Sign In, persist the session to Keychain, gate the app behind login, support optional Face ID app lock, and make sign-out wipe every trace of the previous user from the device. After this task, the app launches to a login screen, both providers work end-to-end against the existing Supabase project, and after signing in the design-token gallery from Task 01 is replaced by a placeholder "Logged in as <email>" view.

---

## Step 1 — Apple Developer + Google Cloud setup

These are dashboard-only steps; document them in USER_TODO.md so the user can do them.

### Apple Developer

1. https://developer.apple.com/account/resources/identifiers — for bundle ID `com.[APP_NAME].ios`, enable **Sign In with Apple** capability.
2. Create a new **Service ID** (for Apple Sign In with web fallback): `com.[APP_NAME].ios.signin`. Configure with domain `oqaqopkcpgmjgswaismm.supabase.co` and return URL `https://oqaqopkcpgmjgswaismm.supabase.co/auth/v1/callback`.
3. Generate an **Apple Sign In key** (.p8 file). Note Key ID and Team ID.

### Supabase dashboard

1. https://supabase.com/dashboard/project/oqaqopkcpgmjgswaismm/auth/providers
2. Enable **Apple** provider. Paste Service ID, Team ID, Key ID, and the .p8 contents.
3. Verify **Google** provider is still enabled (it already is for web). The same client works for iOS via PKCE.

### Google Cloud Console

1. https://console.cloud.google.com/apis/credentials
2. Create a new **OAuth 2.0 Client ID** of type **iOS**.
3. Bundle ID: `com.[APP_NAME].ios`.
4. Copy the client ID into `Secrets.xcconfig` as `GOOGLE_OAUTH_CLIENT_ID`.
5. The reverse-DNS form (`com.googleusercontent.apps.<numeric>`) is the URL scheme — also goes into `Secrets.xcconfig` if needed.

## Step 2 — `SessionStore`

Create `ios/Focals/Auth/SessionStore.swift`:

```swift
import Foundation
import Observation
import Supabase
import FocalsAPI
import FocalsModels

@Observable
@MainActor
public final class SessionStore {
    public static let shared = SessionStore()

    public private(set) var user: User?
    public private(set) var profile: Profile?
    public private(set) var isLoading = true

    private var authStateTask: Task<Void, Never>?

    init() {
        // supabase-swift auto-restores session from Keychain on init
        Task { await bootstrap() }
        observeAuthChanges()
    }

    func bootstrap() async {
        defer { isLoading = false }
        do {
            let session = try await FocalsClient.shared.supabase.auth.session
            self.user = session.user
            self.profile = try? await ProfileRepository.shared.getCurrent()
        } catch {
            self.user = nil
            self.profile = nil
        }
    }

    private func observeAuthChanges() {
        authStateTask = Task { [weak self] in
            for await (event, session) in FocalsClient.shared.supabase.auth.authStateChanges {
                guard let self else { return }
                await MainActor.run {
                    self.user = session?.user
                }
                if event == .signedIn {
                    await self.upsertProfileFromMetadata(session?.user)
                    self.profile = try? await ProfileRepository.shared.getCurrent()
                } else if event == .signedOut {
                    await self.wipeLocalData()
                    self.profile = nil
                }
            }
        }
    }

    private func upsertProfileFromMetadata(_ user: User?) async {
        // Mirror my-app/src/app/auth/callback/route.ts:
        // upsert into profiles { id, email, full_name, avatar_url } on first sign-in
        guard let user else { return }
        let profilePayload = Profile.bootstrapFromUser(user)
        _ = try? await ProfileRepository.shared.upsert(profilePayload)
    }

    private func wipeLocalData() async {
        // Clear SwiftData store (Task 05 wires this in)
        // Clear Kingfisher cache (Task 09)
        // Clear any temp files
        URLCache.shared.removeAllCachedResponses()
    }

    public func signOut() async throws {
        try await FocalsClient.shared.supabase.auth.signOut()
    }
}
```

## Step 3 — Apple Sign In

Create `ios/Focals/Auth/AppleSignInButton.swift`:

```swift
import SwiftUI
import AuthenticationServices
import CryptoKit
import Supabase
import FocalsAPI

struct AppleSignInButton: View {
    @Environment(\.colorScheme) var colorScheme

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
        guard case .success(let authorization) = result,
              let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let identityToken = credential.identityToken,
              let idTokenString = String(data: identityToken, encoding: .utf8) else {
            return
        }
        do {
            try await FocalsClient.shared.supabase.auth.signInWithIdToken(
                credentials: .init(provider: .apple, idToken: idTokenString, nonce: nonce)
            )
        } catch {
            // Surface error via SessionStore
        }
    }

    private static func randomNonceString(length: Int = 32) -> String { /* per Apple sample */ }
    private static func sha256(_ input: String) -> String { /* per Apple sample */ }
}
```

Use Apple's reference implementation from https://developer.apple.com/documentation/sign_in_with_apple for the nonce + SHA256 helpers verbatim.

## Step 4 — Google Sign In via `ASWebAuthenticationSession`

Don't pull in the GoogleSignIn SPM dep — supabase-swift's `signInWithOAuth(provider: .google)` plus `ASWebAuthenticationSession` is sufficient and avoids a 30MB transitive dependency.

Create `ios/Focals/Auth/GoogleSignIn.swift`:

```swift
import AuthenticationServices
import Supabase
import FocalsAPI

@MainActor
final class GoogleSignIn: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = GoogleSignIn()

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }

    func signIn() async throws {
        let url = try FocalsClient.shared.supabase.auth.getOAuthSignInURL(
            provider: .google,
            redirectTo: URL(string: "com.[APP_NAME].ios://oauth-callback")
        )
        let callbackScheme = "com.[APP_NAME].ios"

        let callbackURL: URL = try await withCheckedThrowingContinuation { cont in
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: callbackScheme) { url, error in
                if let url { cont.resume(returning: url) }
                else if let error { cont.resume(throwing: error) }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false   // share Safari cookies for SSO
            session.start()
        }

        try await FocalsClient.shared.supabase.auth.session(from: callbackURL)
    }
}
```

The redirect URL `com.[APP_NAME].ios://oauth-callback` matches the URL scheme registered in Info.plist (Task 01 Step 10).

**Add the redirect URL to Supabase**: dashboard → Authentication → URL Configuration → add `com.[APP_NAME].ios://oauth-callback` to the Redirect URLs allowlist.

## Step 5 — Login screen

Create `ios/Focals/Auth/LoginView.swift`:

```swift
import SwiftUI
import FocalsDesign

struct LoginView: View {
    @State private var error: String?
    @State private var isWorking = false

    var body: some View {
        VStack(spacing: Spacing.lg) {
            Spacer()
            Text("[APP_NAME]")
                .editorialHeadline()
            Text("Photography business management")
                .font(.tokens.body(15))
                .foregroundStyle(Color.tokens.textSecondary)
            Spacer()
            VStack(spacing: Spacing.sm) {
                AppleSignInButton()
                Button { Task { await signInWithGoogle() } } label: {
                    HStack {
                        Image(systemName: "globe")
                        Text("Continue with Google")
                    }
                    .frame(maxWidth: .infinity, minHeight: 50)
                }
                .buttonStyle(.borderedProminent)
                .tint(.tokens.bgTertiary)
                .foregroundStyle(.tokens.textPrimary)
            }
            if let error {
                Text(error)
                    .font(.tokens.body(13))
                    .foregroundStyle(Color.tokens.danger)
            }
        }
        .padding(Spacing.xl)
        .background(Color.tokens.bg)
        .disabled(isWorking)
    }

    private func signInWithGoogle() async {
        isWorking = true
        defer { isWorking = false }
        do {
            try await GoogleSignIn.shared.signIn()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
```

## Step 6 — Auth-gated `RootView`

Replace the design-token gallery with the auth gate. `App/RootView.swift`:

```swift
import SwiftUI
import FocalsDesign

struct RootView: View {
    @State private var session = SessionStore.shared
    @State private var faceIDLock = FaceIDLock()

    var body: some View {
        Group {
            if session.isLoading {
                ProgressView().tint(.tokens.accent)
            } else if session.user == nil {
                LoginView()
            } else if faceIDLock.isLocked {
                FaceIDLockScreen()
            } else {
                LoggedInPlaceholder(email: session.user?.email ?? "—")
            }
        }
        .background(Color.tokens.bg)
    }
}

private struct LoggedInPlaceholder: View {
    let email: String
    var body: some View {
        VStack(spacing: Spacing.md) {
            Text("Logged in as")
                .foregroundStyle(.tokens.textTertiary)
            Text(email)
                .editorialHeadline()
            Button("Sign out") {
                Task { try? await SessionStore.shared.signOut() }
            }
            .buttonStyle(.bordered)
        }
    }
}
```

`LoggedInPlaceholder` is replaced by the real shell in Task 04.

## Step 7 — Face ID app lock

Create `ios/Focals/Auth/FaceIDLock.swift`:

```swift
import LocalAuthentication
import Observation

@Observable
@MainActor
final class FaceIDLock {
    private(set) var isLocked: Bool

    var isEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "FaceIDLockEnabled") }
        set { UserDefaults.standard.set(newValue, forKey: "FaceIDLockEnabled") }
    }

    init() {
        // Lock on cold start if enabled
        self.isLocked = UserDefaults.standard.bool(forKey: "FaceIDLockEnabled")
    }

    func unlock() async {
        guard isEnabled else { isLocked = false; return }
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            // Biometrics not available — degrade to passcode, then to no-lock
            isLocked = false
            return
        }
        do {
            try await context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock [APP_NAME]")
            isLocked = false
        } catch {
            // User cancelled — stay locked
        }
    }
}

struct FaceIDLockScreen: View {
    @Environment(FaceIDLock.self) private var lock
    var body: some View {
        VStack(spacing: Spacing.lg) {
            Image(systemName: "faceid")
                .font(.system(size: 60))
                .foregroundStyle(.tokens.accent)
            Button("Unlock") { Task { await lock.unlock() } }
                .buttonStyle(.borderedProminent)
        }
        .task { await lock.unlock() }
    }
}
```

Toggle lives in Settings (Task 12). Default OFF.

## Step 8 — Sign-out wipe

`SessionStore.signOut()` triggers the `signedOut` auth state change, which calls `wipeLocalData()`. Tasks 05 and 09 layer in the SwiftData and Kingfisher wipes. For now, wipe `URLCache`, any tutorial-progress UserDefaults, and the Face ID lock state.

Add an explicit test:

```swift
func testSignOutWipesEverything() async throws {
    try await SessionStore.shared.signOut()
    XCTAssertNil(SessionStore.shared.user)
    XCTAssertNil(SessionStore.shared.profile)
    XCTAssertEqual(URLCache.shared.currentDiskUsage, 0)
}
```

## Step 9 — Deep-link router scaffold

Create `ios/Focals/Navigation/DeepLinkRouter.swift` (skeleton only — Task 04 fills in routes):

```swift
import Foundation
import Observation

@Observable
@MainActor
public final class DeepLinkRouter {
    public static let shared = DeepLinkRouter()
    public var pendingPath: String?

    public func handle(_ url: URL) {
        // Custom scheme: focals://inquiry/{id}, focals://shoot/{id}
        // Universal Link:  focals-base.vercel.app/inquiry/{id}
        // Defer to Task 04 for actual route resolution
        pendingPath = url.path
    }
}
```

Wire `.onOpenURL { DeepLinkRouter.shared.handle($0) }` on `RootView`.

---

## Acceptance Criteria

- [ ] Apple Sign In flow completes end-to-end against staging Supabase (verified by inspecting auth.users in dashboard)
- [ ] Google Sign In flow completes via `ASWebAuthenticationSession` (verified the same way)
- [ ] After sign-in, `profiles` row is upserted with email, full_name, avatar_url from OAuth metadata
- [ ] Cold start with no session shows `LoginView`
- [ ] Cold start with valid session shows `LoggedInPlaceholder` directly (Keychain restore works)
- [ ] Toggling Face ID lock in code shows the lock screen on next cold start
- [ ] Face ID denied / not enrolled → degrades to "no lock" gracefully (doesn't soft-brick the app)
- [ ] Sign out clears `session.user`, `URLCache`, and (when later tasks land) SwiftData + Kingfisher caches
- [ ] Deep-link `com.[APP_NAME].ios://oauth-callback?code=...` from Safari completes auth flow without crashing
- [ ] No password / token logged via `print` or `os_log` anywhere in `Auth/`

## Depends on

- 01 (Project setup, Info.plist secrets, URL scheme)
- 02 (FocalsClient, Profile model, ProfileRepository)
