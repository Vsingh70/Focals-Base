import SwiftUI
import FocalsCache
import FocalsDesign

@main
struct FocalsApp: App {
    // Bridge into UIApplicationDelegate so we can receive APNs callbacks.
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    init() {
        // Plug the app's NWPathMonitor-backed ConnectivityMonitor into the
        // FocalsCache layer so mutations on airplane mode fail fast with
        // .offline instead of waiting out the URLSession timeout. App
        // initializers always run on main, but the registry is MainActor-
        // isolated, so assert that explicitly.
        MainActor.assumeIsolated {
            CacheConnectivityRegistry.shared = ConnectivityMonitor.shared
            // Project mutations notify EventKitMirror so the user's iOS
            // Calendar stays in sync — the mirror only acts when the user
            // has flipped its toggle on, so installing the observer always
            // is safe.
            ProjectMutationObserverRegistry.shared = EventKitMirror.shared
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
