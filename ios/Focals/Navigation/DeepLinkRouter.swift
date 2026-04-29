import Foundation
import Observation

/// Routes incoming deep links into AppRouter navigation actions.
///
/// Custom-scheme links handled here:
/// - `focals://project/<UUID>`  → push project detail
/// - `focals://client/<UUID>`   → push client detail
/// - `focals://contract/<UUID>` → push contract detail
/// - `focals://inquiry/<UUID>`  → push inquiry detail (Inbox tab)
/// - `focals://upload`          → present the project-upload sheet
/// - `focals://help/<slug>`     → push help article
///
/// Universal Links (focals-base.vercel.app/...) come in Task 13.
@Observable
@MainActor
public final class DeepLinkRouter {
    public static let shared = DeepLinkRouter()

    /// Last URL the app was opened with. Useful for tests / diagnostics
    /// — `resolve(_:)` already dispatched it before this is set.
    public var pendingURL: URL?

    private init() {}

    public func handle(_ url: URL) {
        // OAuth callbacks (com.focals.ios://oauth-callback?code=…) are
        // already handled by ASWebAuthenticationSession's callbackURLScheme
        // matching, so we don't forward them anywhere.
        if url.host == "oauth-callback" {
            return
        }
        pendingURL = url
        resolve(url)
    }

    func resolve(_ url: URL) {
        // For focals://project/<id> the host is "project" and the last
        // path component is the id. For focals://upload the host is
        // "upload" and there is no id.
        guard let host = url.host, !host.isEmpty else { return }
        let last = url.lastPathComponent
        let uuid = UUID(uuidString: last)

        switch host {
        case "project":
            if let uuid {
                AppRouter.shared.navigate(to: .projectDetail(uuid))
            }
        case "client":
            if let uuid {
                AppRouter.shared.navigate(to: .clientDetail(uuid))
            }
        case "contract":
            if let uuid {
                AppRouter.shared.navigate(to: .contractDetail(uuid))
            }
        case "inquiry":
            if let uuid {
                AppRouter.shared.navigate(to: .inquiryDetail(uuid))
            }
        case "help":
            // Help slug isn't a UUID — pass it through.
            if !last.isEmpty, last != "help" {
                AppRouter.shared.navigate(to: .helpArticle(slug: last))
            }
        case "upload":
            // Used by the iOS Share Extension (Task 15) to drop the user
            // straight into the file-import sheet.
            AppRouter.shared.presentedSheet = .projectUpload
        default:
            break
        }
    }
}
