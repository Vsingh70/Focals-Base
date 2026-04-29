import SwiftUI
import FocalsDesign

// iPhone shell: 5 tabs, each with its own NavigationStack so back-stacks
// survive tab switches. Matches the web's MobileNav.tsx Main/More split —
// secondary modules (Clients, Finances, Contracts, Gear, Forms, Links,
// Help, Settings) live behind the More tab.
struct TabBarShell: View {
    @Bindable var router: AppRouter

    var body: some View {
        TabView(selection: $router.selectedTab) {
            tabStack(path: $router.dashboardPath, root: DashboardScreen())
                .tabItem { Label("Home", systemImage: "house") }
                .tag(PrimaryTab.dashboard)

            tabStack(path: $router.inboxPath, root: InboxScreen())
                .tabItem { Label("Inbox", systemImage: "tray") }
                .tag(PrimaryTab.inbox)

            tabStack(path: $router.calendarPath, root: CalendarScreen())
                .tabItem { Label("Calendar", systemImage: "calendar") }
                .tag(PrimaryTab.calendar)

            tabStack(path: $router.projectsPath, root: ProjectsScreen())
                .tabItem { Label("Projects", systemImage: "folder") }
                .tag(PrimaryTab.projects)

            tabStack(path: $router.morePath, root: MoreScreen())
                .tabItem { Label("More", systemImage: "ellipsis.circle") }
                .tag(PrimaryTab.more)
        }
        .tint(Color.tokens.accent)
    }

    // Per-tab NavigationStack with the shared route resolver attached.
    // ViewBuilder so the root view's static type is preserved.
    @ViewBuilder
    private func tabStack<Root: View>(path: Binding<[Route]>, root: Root) -> some View {
        NavigationStack(path: path) {
            root
                .navigationDestination(for: Route.self) { route in
                    routeDestination(route)
                }
        }
    }
}
