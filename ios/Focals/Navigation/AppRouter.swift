import Observation
import SwiftUI
import FocalsModels

/// Single source of truth for navigation state.
///
/// Each iPhone tab owns its own NavigationStack `path`, so switching tabs
/// preserves their individual back-stacks (matches iOS Mail, Notes, etc.).
/// On iPad we collapse all of those into one `detailPath` because the
/// split view has a single detail pane.
///
/// Sheets are tracked in `presentedSheet` and presented at the root via
/// `.sheet(item:)`, so any module screen can open a global sheet without
/// caring whether the user is on iPhone or iPad.
@Observable
@MainActor
public final class AppRouter {
    public static let shared = AppRouter()

    // MARK: Per-tab navigation paths (iPhone)
    public var dashboardPath: [Route] = []
    public var inboxPath:     [Route] = []
    public var calendarPath:  [Route] = []
    public var projectsPath:  [Route] = []
    public var morePath:      [Route] = []

    // MARK: Combined detail stack (iPad)
    public var detailPath: [Route] = []

    // MARK: Active sheet (replaces web modals)
    public var presentedSheet: SheetRoute?

    // MARK: iPad sidebar selection — kept in sync with the app's notion of
    // "which top-level module is showing". Default to dashboard.
    public var sidebarSelection: Route = .dashboard

    // MARK: Currently-selected tab on iPhone (drives TabView selection).
    public var selectedTab: PrimaryTab = .dashboard

    private init() {}

    /// Navigate to a route. Top-level cases switch tab/sidebar; detail
    /// cases push onto the stack of the tab that owns them.
    public func navigate(to route: Route) {
        switch route {
        // Top-level destinations: switch the tab/sidebar selection. The
        // current path is preserved when re-entering a tab the user already
        // had drilled into; if they want to pop, they tap the tab again.
        case .dashboard:
            selectedTab = .dashboard
            sidebarSelection = .dashboard
        case .inbox:
            selectedTab = .inbox
            sidebarSelection = .inbox
        case .calendar:
            selectedTab = .calendar
            sidebarSelection = .calendar
        case .projects, .projectUpload:
            selectedTab = .projects
            sidebarSelection = .projects
        case .clients, .finances, .contracts, .gear,
             .forms, .links, .help, .settings:
            selectedTab = .more
            sidebarSelection = route
            // Drill into the chosen module within the More tab.
            if morePath.last != route {
                morePath.append(route)
            }

        // Detail destinations: append to the owning tab's path (iPhone) or
        // detailPath (iPad). The shell view picks which one it observes.
        case .projectDetail, .contractDetail, .contractNew, .contractTemplates:
            // Project + contract detail belong to the Projects/More tab.
            if route.belongsToProjectsTab {
                projectsPath.append(route)
            } else {
                morePath.append(route)
            }
            detailPath.append(route)

        case .clientDetail:
            morePath.append(route)
            detailPath.append(route)

        case .inquiryDetail:
            inboxPath.append(route)
            detailPath.append(route)

        case .helpArticle:
            morePath.append(route)
            detailPath.append(route)

        case .financesPnL:
            // Finances lives in the More tab, so its sub-routes do too.
            morePath.append(route)
            detailPath.append(route)
        }
    }

    /// Pop the current tab's stack by `count` levels. Used after a delete
    /// flow that destroys the detail screen the user is currently on.
    public func popCurrentStack(_ count: Int = 1) {
        let popper: (inout [Route]) -> Void = { path in
            for _ in 0..<min(count, path.count) {
                path.removeLast()
            }
        }
        switch selectedTab {
        case .dashboard: popper(&dashboardPath)
        case .inbox:     popper(&inboxPath)
        case .calendar:  popper(&calendarPath)
        case .projects:  popper(&projectsPath)
        case .more:      popper(&morePath)
        }
        // Mirror to detail stack for iPad.
        for _ in 0..<min(count, detailPath.count) {
            detailPath.removeLast()
        }
    }
}

/// The five tabs the iPhone shell actually renders. Distinct from `Route`
/// because the More tab covers many top-level routes.
public enum PrimaryTab: Hashable, Sendable {
    case dashboard
    case inbox
    case calendar
    case projects
    case more
}

/// Sheets presented globally by AppRouter. Each case is the data the sheet
/// needs to render itself; presentation is handled by the root shell.
public enum SheetRoute: Identifiable, Hashable, Sendable {
    /// Calendar slot taps prefill `presetShootDate`.
    case createProject(presetShootDate: Date? = nil)
    case editProject(Project)
    case createClient(prefilled: Client? = nil)
    case editClient(Client)
    case createInquiry
    case createFinance(preselectedType: FinanceType? = nil)
    case editFinance(Finance)
    case createGear
    case editGear(Gear)
    case createLink
    case editLink(FocalsModels.Link)
    /// File-import flow (Task 15).
    case projectUpload

    public var id: String {
        switch self {
        case .createProject(let d):
            return "createProject:\(d?.timeIntervalSince1970.description ?? "nil")"
        case .editProject(let p):
            return "editProject:\(p.id.uuidString)"
        case .createClient(let c):
            return "createClient:\(c?.id.uuidString ?? "nil")"
        case .editClient(let c):
            return "editClient:\(c.id.uuidString)"
        case .createInquiry:
            return "createInquiry"
        case .createFinance(let t):
            return "createFinance:\(t?.rawValue ?? "nil")"
        case .editFinance(let f):
            return "editFinance:\(f.id.uuidString)"
        case .createGear:
            return "createGear"
        case .editGear(let g):
            return "editGear:\(g.id.uuidString)"
        case .createLink:
            return "createLink"
        case .editLink(let l):
            return "editLink:\(l.id.uuidString)"
        case .projectUpload:
            return "projectUpload"
        }
    }
}

private extension Route {
    /// Detail cases that push into the Projects tab's stack (vs. the More
    /// tab). Project + contract detail screens both live there because
    /// users tend to enter them via the Projects → row → detail flow.
    var belongsToProjectsTab: Bool {
        switch self {
        case .projectDetail, .contractDetail, .contractNew, .contractTemplates:
            return true
        default:
            return false
        }
    }
}
