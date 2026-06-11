import Foundation

/// Every navigable destination in the app, expressed as a typed value.
///
/// The split between **top-level** cases (root of a tab/sidebar item) and
/// **detail** cases (pushed onto a NavigationStack) is intentional:
/// only top-level cases ever land in the iPad sidebar selection or as
/// the iPhone tab's root view. Detail cases get appended to a stack's
/// `path` array in AppRouter.
public enum Route: Hashable, Sendable {
    // MARK: Top-level
    case dashboard
    case inbox
    case calendar
    case projects
    case clients
    case projectUpload
    case finances
    case contracts
    case gear
    case forms
    case links
    case help
    case settings

    // MARK: Detail destinations
    case projectDetail(UUID)
    case clientDetail(UUID)
    case contractDetail(UUID)
    case contractNew
    case contractTemplates
    case helpArticle(slug: String)
    case inquiryDetail(UUID)

    // MARK: Module sub-routes
    case financesPnL
}
