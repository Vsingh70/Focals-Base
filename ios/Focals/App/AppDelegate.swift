import UIKit
import SwiftUI

/// Bridge into legacy UIKit lifecycle callbacks that SwiftUI's `App` doesn't
/// expose. We only need APNs registration; everything else flows through
/// SwiftUI's modern bindings.
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Set ourselves as the UNUserNotificationCenter delegate so taps and
        // foreground deliveries route into PushManager. Token registration
        // does NOT fire here — it waits until the user opts in via Settings
        // (see PushManager.requestAuthorization).
        Task { @MainActor in
            PushManager.shared.bootstrap()
        }
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Task { @MainActor in
            PushManager.shared.handleDeviceToken(deviceToken)
        }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        Task { @MainActor in
            PushManager.shared.handleRegistrationFailure(error)
        }
    }
}
