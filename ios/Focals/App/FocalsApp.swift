import SwiftUI
import FocalsDesign

@main
struct FocalsApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark)
                .tint(Color.tokens.accent)
        }
    }
}
