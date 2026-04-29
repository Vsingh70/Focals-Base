import Foundation
import Observation

/// Captures incoming deep links so the right screen can resolve them.
///
/// Skeleton in Task 03 — we just record the path. Task 04 wires up the
/// full route enum (focals://project/{id}, focals://upload, the OAuth
/// callback, Universal Links from focals-base.vercel.app, etc.) and
/// `AppRouter` consumes `pendingPath` to push the right destination.
@Observable
@MainActor
public final class DeepLinkRouter {
    public static let shared = DeepLinkRouter()

    /// Last URL the app was opened with. Cleared after Task 04's router
    /// has consumed it.
    public var pendingURL: URL?

    private init() {}

    public func handle(_ url: URL) {
        // OAuth callbacks (com.focals.ios://oauth-callback?code=…) are
        // already handled by ASWebAuthenticationSession's callbackURLScheme
        // matching, so we don't need to forward them anywhere. Filter out
        // anything that's structurally a callback to keep this scaffolding
        // focused on app-level navigation.
        if url.host == "oauth-callback" {
            return
        }
        pendingURL = url
    }
}
