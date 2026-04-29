import Foundation
import Observation
import Supabase
import FocalsAPI
import FocalsModels

/// Single source of truth for "who is signed in right now".
///
/// supabase-swift persists the session to Keychain on its own; we just
/// observe the auth state stream and surface the current user + their
/// profile row to the rest of the app via the @Observable macro.
///
/// The `profiles` row is auto-created on first sign-in by the
/// `handle_new_user` Postgres trigger (web migration 20260423141532),
/// so iOS doesn't need to upsert anything itself — a `getCurrent()`
/// after the `signedIn` event is enough.
@Observable
@MainActor
public final class SessionStore {
    public static let shared = SessionStore()

    public private(set) var user: User?
    public private(set) var profile: Profile?
    public private(set) var isLoading = true

    private var authStateTask: Task<Void, Never>?

    private init() {
        Task { await bootstrap() }
        observeAuthChanges()
    }

    /// Restore the persisted Keychain session on cold start.
    func bootstrap() async {
        defer { isLoading = false }
        do {
            let session = try await FocalsClient.shared.supabase.auth.session
            self.user = session.user
            self.profile = try? await ProfileRepository.shared.getCurrent()
        } catch {
            // No session yet — user is signed out. Don't surface this as
            // an error; the LoginView will render.
            self.user = nil
            self.profile = nil
        }
    }

    private func observeAuthChanges() {
        authStateTask = Task { [weak self] in
            for await (event, session) in FocalsClient.shared.supabase.auth.authStateChanges {
                guard let self else { return }
                self.user = session?.user

                switch event {
                case .signedIn, .tokenRefreshed, .userUpdated:
                    self.profile = try? await ProfileRepository.shared.getCurrent()
                case .signedOut:
                    await self.wipeLocalData()
                    self.profile = nil
                default:
                    break
                }
            }
        }
    }

    /// Sign out the current user. The auth-state observer above will see the
    /// `.signedOut` event and trigger `wipeLocalData()`.
    public func signOut() async throws {
        try await FocalsClient.shared.supabase.auth.signOut()
    }

    /// Best-effort wipe of every cache the iOS client keeps.
    /// - Cleared today: URLCache, Face ID lock toggle (so the next user on
    ///   the same device starts unlocked).
    /// - Tasks 05 and 09 layer in SwiftData + Kingfisher wipes here.
    private func wipeLocalData() async {
        URLCache.shared.removeAllCachedResponses()
        UserDefaults.standard.removeObject(forKey: "FaceIDLockEnabled")
    }
}
