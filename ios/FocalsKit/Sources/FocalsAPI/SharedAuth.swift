import Foundation

/// Shared identity helper for App Group consumers. Widget extensions and
/// Live Activity targets can't run the supabase-swift auth flow themselves;
/// they read the current user id out of the App Group's `UserDefaults`.
///
/// `SessionStore` writes to this on every auth state change so widgets and
/// the Live Activity manager always know which user's cached data to read.
public enum SharedAuth {
    public static let appGroupIdentifier = "group.com.focals.ios"
    private static let userIdKey = "currentUserId"

    private static var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupIdentifier)
    }

    public static func currentUserId() -> UUID? {
        guard let raw = sharedDefaults?.string(forKey: userIdKey),
              let uuid = UUID(uuidString: raw)
        else { return nil }
        return uuid
    }

    public static func setCurrentUserId(_ id: UUID?) {
        guard let defaults = sharedDefaults else { return }
        if let id {
            defaults.set(id.uuidString, forKey: userIdKey)
        } else {
            defaults.removeObject(forKey: userIdKey)
        }
    }
}
