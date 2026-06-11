import Foundation
import UIKit
import UserNotifications
import FocalsAPI

/// Owns notification permission, APNs token registration, and incoming-tap
/// dispatch into `DeepLinkRouter`. Setup flow:
///
///   1. App launch → `AppDelegate` calls `PushManager.shared.bootstrap()`
///      which sets us as the `UNUserNotificationCenter` delegate.
///   2. User opts in via Settings → `requestAuthorization()` prompts and,
///      on grant, registers for remote notifications.
///   3. APNs returns a device token to `AppDelegate` →
///      `handleDeviceToken(_:)` persists it on `profiles.push_token` so the
///      Edge Function can address pushes to this device.
///   4. A push arrives → `userNotificationCenter(_:didReceive:)` fires →
///      we read `data.type` + id and forward into the existing
///      `DeepLinkRouter`.
///
/// The token write requires the `profiles.push_token` column added by the
/// web migration in USER_TODO. If the column isn't there yet, the write
/// throws and we swallow it — the rest of the app still functions.
@MainActor
final class PushManager: NSObject {
    static let shared = PushManager()

    enum Preferences {
        static let inquiryAlertsKey = "PushNotifications.InquiryAlerts"
        static let projectRemindersKey = "PushNotifications.ProjectReminders"
    }

    private override init() { super.init() }

    func bootstrap() {
        UNUserNotificationCenter.current().delegate = self
    }

    /// Returns the current authorization status without prompting.
    func currentAuthorization() async -> UNAuthorizationStatus {
        await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
    }

    /// Prompt the user. Returns true when authorized (or already authorized).
    @discardableResult
    func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            if granted {
                UIApplication.shared.registerForRemoteNotifications()
            }
            return granted
        } catch {
            #if DEBUG
            print("[PushManager] requestAuthorization failed: \(error)")
            #endif
            return false
        }
    }

    /// Called from `AppDelegate.application(_:didRegisterForRemoteNotificationsWithDeviceToken:)`.
    func handleDeviceToken(_ data: Data) {
        let token = data.map { String(format: "%02x", $0) }.joined()
        #if DEBUG
        print("[PushManager] APNs token: \(token.prefix(12))…")
        #endif
        Task { await persistToken(token) }
    }

    /// APNs registration failed (e.g. no entitlement, no provisioning, or
    /// running in simulator without a paired device). Log and move on —
    /// notifications are best-effort.
    func handleRegistrationFailure(_ error: Error) {
        #if DEBUG
        print("[PushManager] APNs registration failed: \(error.localizedDescription)")
        #endif
    }

    /// Best-effort token clear on sign-out. Caller is responsible for
    /// running this *before* the session is destroyed so we still have a
    /// userId.
    func clearToken(for userId: UUID) async {
        try? await ProfileRepository.shared.updatePushToken(nil, userId: userId)
    }

    private func persistToken(_ token: String) async {
        guard let userId = SharedAuth.currentUserId() else { return }
        do {
            try await ProfileRepository.shared.updatePushToken(token, userId: userId)
        } catch {
            #if DEBUG
            print("[PushManager] persistToken failed (likely missing profiles.push_token column): \(error)")
            #endif
        }
    }
}

extension PushManager: UNUserNotificationCenterDelegate {
    /// Called when a push lands while the app is in the foreground. Show the
    /// banner anyway so the user knows something arrived.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .badge]
    }

    /// User tapped the notification (or it was delivered while the app was
    /// backgrounded). Dispatch into `DeepLinkRouter`.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let data = response.notification.request.content.userInfo
        guard let type = data["type"] as? String else { return }
        switch type {
        case "new_inquiry":
            if let raw = data["inquiryId"] as? String,
               let id = UUID(uuidString: raw) {
                AppRouter.shared.navigate(to: .inquiryDetail(id))
            }
        case "project_reminder":
            if let raw = data["projectId"] as? String,
               let id = UUID(uuidString: raw) {
                AppRouter.shared.navigate(to: .projectDetail(id))
            }
        default:
            break
        }
    }
}
