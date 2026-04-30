import SwiftUI
import FocalsCache
import FocalsDesign

@main
struct FocalsApp: App {
    init() {
        // Plug the app's NWPathMonitor-backed ConnectivityMonitor into the
        // FocalsCache layer so mutations on airplane mode fail fast with
        // .offline instead of waiting out the URLSession timeout. App
        // initializers always run on main, but the registry is MainActor-
        // isolated, so assert that explicitly.
        MainActor.assumeIsolated {
            CacheConnectivityRegistry.shared = ConnectivityMonitor.shared
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark)
                .tint(Color.tokens.accent)
        }
    }
}
