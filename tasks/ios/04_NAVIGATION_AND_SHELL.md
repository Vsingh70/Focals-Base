# Task 04 — Navigation & Shell

## Goal

Build the app's navigation skeleton: tab bar on iPhone, split view on iPad, typed `Route` enum for every destination, deep-link handling, and the shared sheet/empty-state/skeleton/haptic primitives that every module screen will consume. After this task, you can navigate to any of the 13 module screens (showing a placeholder "Coming soon" view), pull-to-refresh works, deep links resolve to the right screen, and `focals://inquiry/{id}` opens the right detail sheet on the right tab.

This is the last "framework" task — Tasks 05–14 fill in actual content.

---

## Step 1 — `Route` enum

Create `ios/Focals/Navigation/Route.swift`:

```swift
import Foundation

public enum Route: Hashable, Sendable {
    // Top-level (one per tab / sidebar item)
    case dashboard
    case inbox
    case calendar
    case projects
    case clients
    case shoots
    case finances
    case contracts
    case gear
    case forms
    case links
    case help
    case settings

    // Detail destinations (pushed onto a NavigationStack)
    case projectDetail(UUID)
    case clientDetail(UUID)
    case shootDetail(UUID)
    case contractDetail(UUID)
    case contractNew
    case contractTemplates
    case helpArticle(slug: String)
    case inquiryDetail(UUID)
}
```

The split between top-level and detail matters: top-level cases are tab roots; detail cases get pushed via `NavigationStack` `path`.

## Step 2 — Tab shell (iPhone)

Create `ios/Focals/Navigation/TabBarShell.swift`:

```swift
import SwiftUI
import FocalsDesign

struct TabBarShell: View {
    @State private var selection: Tab = .dashboard
    @Bindable var router: AppRouter

    enum Tab: Hashable { case dashboard, inbox, calendar, projects, more }

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack(path: $router.dashboardPath) { DashboardScreen() }
                .tabItem { Label("Home", systemImage: "house") }
                .tag(Tab.dashboard)

            NavigationStack(path: $router.inboxPath) { InboxScreen() }
                .tabItem { Label("Inbox", systemImage: "tray") }
                .tag(Tab.inbox)

            NavigationStack(path: $router.calendarPath) { CalendarScreen() }
                .tabItem { Label("Calendar", systemImage: "calendar") }
                .tag(Tab.calendar)

            NavigationStack(path: $router.projectsPath) { ProjectsScreen() }
                .tabItem { Label("Projects", systemImage: "folder") }
                .tag(Tab.projects)

            NavigationStack(path: $router.morePath) { MoreScreen() }
                .tabItem { Label("More", systemImage: "ellipsis.circle") }
                .tag(Tab.more)
        }
        .tint(.tokens.accent)
    }
}
```

**iPhone has 5 tabs only**: Dashboard, Inbox, Calendar, Projects, More. The "More" tab hosts a list of the remaining 8 modules (Clients, Shoots, Finances, Contracts, Gear, Forms, Links, Help, Settings) — matches the web's `MobileNav.tsx` "Main" vs "More" split.

## Step 3 — Split view shell (iPad)

Create `ios/Focals/Navigation/SplitViewShell.swift`:

```swift
import SwiftUI

struct SplitViewShell: View {
    @State private var selection: Route? = .dashboard
    @Bindable var router: AppRouter

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Section("Main") {
                    NavLink(.dashboard, label: "Dashboard", systemImage: "house")
                    NavLink(.inbox, label: "Inbox", systemImage: "tray")
                    NavLink(.calendar, label: "Calendar", systemImage: "calendar")
                    NavLink(.projects, label: "Projects", systemImage: "folder")
                    NavLink(.clients, label: "Clients", systemImage: "person.2")
                    NavLink(.shoots, label: "Shoots", systemImage: "camera")
                    NavLink(.finances, label: "Finances", systemImage: "dollarsign.circle")
                    NavLink(.contracts, label: "Contracts", systemImage: "doc.text")
                }
                Section("More") {
                    NavLink(.gear, label: "Gear", systemImage: "camera.aperture")
                    NavLink(.forms, label: "Forms", systemImage: "list.bullet.rectangle")
                    NavLink(.links, label: "Links", systemImage: "link")
                    NavLink(.help, label: "Help", systemImage: "questionmark.circle")
                    NavLink(.settings, label: "Settings", systemImage: "gear")
                }
            }
            .navigationTitle("[APP_NAME]")
        } detail: {
            NavigationStack(path: $router.detailPath) {
                routeDestination(selection ?? .dashboard)
            }
        }
    }
}
```

A small `NavLink` helper renders consistent rows. Stage Manager and full-screen split view both work because `NavigationSplitView` handles compact-width collapse automatically.

## Step 4 — `AppRouter` + selecting tab vs split based on size class

Create `ios/Focals/Navigation/AppRouter.swift`:

```swift
import Observation
import SwiftUI

@Observable
@MainActor
public final class AppRouter {
    public static let shared = AppRouter()

    // Tab-specific stacks (iPhone)
    public var dashboardPath: [Route] = []
    public var inboxPath:     [Route] = []
    public var calendarPath:  [Route] = []
    public var projectsPath:  [Route] = []
    public var morePath:      [Route] = []

    // Single stack for iPad split-view detail
    public var detailPath: [Route] = []

    // Sheet state — replaces web modals
    public var presentedSheet: SheetRoute?

    public func navigate(to route: Route) {
        // Resolve which stack the route belongs in
        // (e.g. .clientDetail goes into the same stack as .clients in More tab)
        // Implementation dispatches by case.
    }
}

public enum SheetRoute: Identifiable, Hashable {
    case createProject
    case createClient(prefilled: Client? = nil)
    case createShoot(presetDate: Date? = nil)
    case createInquiry
    case createFinance(preselectedType: FinanceType? = nil)
    case shootDetail(Shoot)

    public var id: String { /* stable id from case + payload */ }
}
```

Update `RootView` (Task 03) to switch shells on size class:

```swift
struct LoggedInRoot: View {
    @Environment(\.horizontalSizeClass) var hSize
    @State private var router = AppRouter.shared
    var body: some View {
        Group {
            if hSize == .regular {
                SplitViewShell(router: router)
            } else {
                TabBarShell(router: router)
            }
        }
        .sheet(item: $router.presentedSheet) { route in
            sheetDestination(route)
        }
    }
}
```

## Step 5 — `routeDestination` resolver

A single function that maps `Route` → `View`. Used by both shells.

```swift
@ViewBuilder
func routeDestination(_ route: Route) -> some View {
    switch route {
    case .dashboard:               DashboardScreen()
    case .inbox:                   InboxScreen()
    case .calendar:                CalendarScreen()
    case .projects:                ProjectsScreen()
    case .clients:                 ClientsScreen()
    case .shoots:                  ShootsScreen()
    case .finances:                FinancesScreen()
    case .contracts:               ContractsScreen()
    case .gear:                    GearScreen()
    case .forms:                   FormsScreen()
    case .links:                   LinksScreen()
    case .help:                    HelpScreen()
    case .settings:                SettingsScreen()

    case .projectDetail(let id):   ProjectDetailScreen(id: id)
    case .clientDetail(let id):    ClientDetailScreen(id: id)
    case .shootDetail(let id):     ShootDetailScreen(id: id)
    case .contractDetail(let id):  ContractDetailScreen(id: id)
    case .contractNew:             ContractNewScreen()
    case .contractTemplates:       ContractTemplatesScreen()
    case .helpArticle(let slug):   HelpArticleScreen(slug: slug)
    case .inquiryDetail(let id):   InquiryDetailScreen(id: id)
    }
}
```

For Task 04, every screen is a placeholder:

```swift
struct InboxScreen: View {
    var body: some View {
        EmptyState(
            symbol: "tray",
            title: "Inbox",
            body: "Coming in Task 07."
        )
    }
}
```

Replace screen-by-screen in Tasks 06–12.

## Step 6 — `EmptyState`

Create `ios/Focals/Shared/EmptyState.swift`:

```swift
import SwiftUI
import FocalsDesign

public struct EmptyState: View {
    let symbol: String
    let title: String
    let body: String?
    let cta: (label: String, action: () -> Void)?

    public init(
        symbol: String,
        title: String,
        body: String? = nil,
        cta: (label: String, action: () -> Void)? = nil
    ) {
        self.symbol = symbol
        self.title = title
        self.body = body
        self.cta = cta
    }

    public var body: some View {
        VStack(spacing: Spacing.md) {
            Image(systemName: symbol)
                .font(.system(size: 36))
                .foregroundStyle(Color.tokens.textTertiary)
            Text(title)
                .font(.tokens.display(20))
                .foregroundStyle(.tokens.textPrimary)
            if let body {
                Text(body)
                    .font(.tokens.body(14))
                    .foregroundStyle(.tokens.textSecondary)
                    .multilineTextAlignment(.center)
            }
            if let cta {
                Button(cta.label, action: cta.action)
                    .buttonStyle(.borderedProminent)
                    .tint(.tokens.accent)
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.tokens.bg)
    }
}
```

## Step 7 — `LoadingSkeleton`

Create `ios/Focals/Shared/LoadingSkeleton.swift`:

```swift
import SwiftUI
import FocalsDesign

public struct SkeletonCard: View {
    @State private var phase: CGFloat = 0
    public init() {}
    public var body: some View {
        RoundedRectangle(cornerRadius: Radius.md)
            .fill(Color.tokens.bgSecondary)
            .overlay(
                LinearGradient(
                    colors: [.clear, Color.tokens.bgTertiary.opacity(0.5), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .offset(x: phase)
                .mask(RoundedRectangle(cornerRadius: Radius.md))
            )
            .onAppear {
                withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                    phase = 300
                }
            }
    }
}

public struct SkeletonList: View {
    let count: Int
    public init(count: Int = 6) { self.count = count }
    public var body: some View {
        VStack(spacing: Spacing.sm) {
            ForEach(0..<count, id: \.self) { _ in
                SkeletonCard().frame(height: 64)
            }
        }
        .padding(Spacing.md)
    }
}
```

Match the height/shape of the real cell each module renders.

## Step 8 — `BottomSheet` / detail sheet pattern

iOS 17 has good native sheet support; we wrap it for consistency:

```swift
public struct DetailSheet<Content: View>: View {
    let title: String
    let content: () -> Content
    public init(title: String, @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.content = content
    }
    public var body: some View {
        NavigationStack {
            content()
                .navigationTitle(title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") { /* dismiss via env */ }
                    }
                }
        }
        .presentationDetents([.medium, .large])
        .presentationBackground(Color.tokens.bgSecondary)
        .presentationDragIndicator(.visible)
    }
}
```

## Step 9 — Pull-to-refresh helper

`.refreshable { await store.refresh() }` is built into SwiftUI `List` and `ScrollView` on iOS 16+. Document the convention: every list screen calls `.refreshable` and every store exposes `func refresh() async`. No bespoke wrapper needed.

## Step 10 — Haptics

Create `ios/Focals/Shared/Haptics.swift`:

```swift
import UIKit

public enum Haptics {
    public static func tap()      { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    public static func medium()   { UIImpactFeedbackGenerator(style: .medium).impactOccurred() }
    public static func success()  { UINotificationFeedbackGenerator().notificationOccurred(.success) }
    public static func warning()  { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
    public static func error()    { UINotificationFeedbackGenerator().notificationOccurred(.error) }
}
```

Convention:
- Sheet open / button tap → `Haptics.tap()`
- Mutation success → `Haptics.success()`
- Mutation failure → `Haptics.error()`
- Swipe action commit → `Haptics.medium()`

## Step 11 — Top bar conventions

Every screen sets:
- `.navigationTitle("…")` — module name
- `.navigationBarTitleDisplayMode(.large)` for top-level, `.inline` for detail
- A trailing action menu when relevant: `.toolbar { ToolbarItem(placement: .topBarTrailing) { Menu("…", systemImage: "ellipsis.circle") { … } } }`
- Pull-to-refresh on every list

Document this in `ios/Focals/Modules/_README.md` so module tasks don't reinvent it.

## Step 12 — Connectivity banner

Create `ios/Focals/Shared/ConnectivityBanner.swift`:

```swift
import SwiftUI
import Network
import FocalsDesign

@Observable
@MainActor
final class ConnectivityMonitor {
    static let shared = ConnectivityMonitor()
    private(set) var isOffline = false
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "ConnectivityMonitor")

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isOffline = path.status != .satisfied
            }
        }
        monitor.start(queue: queue)
    }
}

struct ConnectivityBanner: View {
    @State private var monitor = ConnectivityMonitor.shared
    var body: some View {
        if monitor.isOffline {
            HStack(spacing: Spacing.sm) {
                Image(systemName: "wifi.slash")
                Text("Offline")
            }
            .font(.tokens.medium(12))
            .foregroundStyle(.tokens.textSecondary)
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.xs)
            .background(Color.tokens.bgTertiary)
            .clipShape(Capsule())
        }
    }
}
```

Wire into top bar of every screen via a shared `.toolbar { ToolbarItem(placement: .principal) { ConnectivityBanner() } }` modifier.

## Step 13 — Deep-link routing

Update `DeepLinkRouter` from Task 03:

```swift
@MainActor
public extension DeepLinkRouter {
    func resolve(_ url: URL) {
        guard let host = url.host ?? url.pathComponents.first else { return }
        let id = url.lastPathComponent
        let uuid = UUID(uuidString: id)

        switch host {
        case "inquiry":
            if let uuid {
                AppRouter.shared.navigate(to: .inquiryDetail(uuid))
            }
        case "shoot":
            if let uuid {
                AppRouter.shared.navigate(to: .shootDetail(uuid))
            }
        case "project":
            if let uuid {
                AppRouter.shared.navigate(to: .projectDetail(uuid))
            }
        default:
            break
        }
    }
}
```

Universal Links (`focals-base.vercel.app/...`) come in Task 13; the custom-scheme deep links work in Task 04.

---

## Acceptance Criteria

- [ ] iPhone shows 5 tabs (Dashboard, Inbox, Calendar, Projects, More); each tab is a `NavigationStack` with its own path
- [ ] iPad shows `NavigationSplitView` with all 13 modules in the sidebar grouped by Main/More
- [ ] Compact-width iPad (Stage Manager 1/3) collapses cleanly to tab-style behavior
- [ ] Every module screen exists as a placeholder using `EmptyState`
- [ ] `routeDestination(_:)` returns the right view for every `Route` case
- [ ] `focals://inquiry/<UUID>` from Safari deep-links to the inquiry detail screen on the Inbox tab
- [ ] Pull-to-refresh fires on every list (verified by adding `print` in `.refreshable`)
- [ ] `EmptyState` renders consistently across all 13 placeholder screens
- [ ] `SkeletonList` shimmer animation runs at 60fps in Instruments
- [ ] `Haptics.tap()` fires on a real device when opening a sheet (simulator silent — must verify on device)
- [ ] `ConnectivityBanner` shows when airplane mode is enabled, hides when toggled back
- [ ] `DetailSheet` opens with `.presentationDetents([.medium, .large])` and a drag indicator
- [ ] Sign out from Task 03 still works — returns to LoginView

## Depends on

- 01 (Project setup, design tokens)
- 03 (Auth gate, SessionStore, DeepLinkRouter scaffold)
