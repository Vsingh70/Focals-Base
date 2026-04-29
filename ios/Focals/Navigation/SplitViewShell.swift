import SwiftUI
import FocalsDesign

// iPad shell: NavigationSplitView with all 13 modules in the sidebar,
// grouped Main/More to mirror the web Sidebar. The detail column is a
// single NavigationStack so deep-pushes from any module land in one
// consistent place.
struct SplitViewShell: View {
    @Bindable var router: AppRouter

    var body: some View {
        // List(selection:) on iOS wants Binding<Route?>, but the router
        // exposes a non-optional sidebarSelection (the sidebar is never
        // empty — it always has a selection). Bridge the two with a
        // computed Binding so taps update the router and a programmatic
        // navigate(to:) reflects in the highlighted row.
        let selection = Binding<Route?>(
            get: { router.sidebarSelection },
            set: { newValue in
                if let newValue { router.sidebarSelection = newValue }
            }
        )

        NavigationSplitView {
            List(selection: selection) {
                Section("Main") {
                    NavLink(.dashboard, label: "Dashboard", systemImage: "house")
                    NavLink(.inbox, label: "Inbox", systemImage: "tray")
                    NavLink(.calendar, label: "Calendar", systemImage: "calendar")
                    NavLink(.projects, label: "Projects", systemImage: "folder")
                    NavLink(.clients, label: "Clients", systemImage: "person.2")
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
            .navigationTitle("Focals")
        } detail: {
            NavigationStack(path: $router.detailPath) {
                routeDestination(router.sidebarSelection)
                    .navigationDestination(for: Route.self) { route in
                        routeDestination(route)
                    }
            }
        }
    }
}

// Compact sidebar row. Storing the Route on the row via `.tag()` lets the
// parent List's `selection:` binding resolve to a Route value directly.
private struct NavLink: View {
    let route: Route
    let label: String
    let systemImage: String

    init(_ route: Route, label: String, systemImage: String) {
        self.route = route
        self.label = label
        self.systemImage = systemImage
    }

    var body: some View {
        Label(label, systemImage: systemImage)
            .tag(route)
    }
}
