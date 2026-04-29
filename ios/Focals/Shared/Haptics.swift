import UIKit

/// Centralized haptic vocabulary so the app's feedback feels consistent.
///
/// Conventions:
/// - `tap()`     — sheet open, tab change, primary button press
/// - `medium()`  — swipe action commit, drag-and-drop drop
/// - `success()` — mutation that the user expects to succeed and did
/// - `warning()` — non-blocking concern surfaced (e.g. offline, overdue)
/// - `error()`   — mutation failed
///
/// All silent on simulator; verify haptics on a real device per Task 14.
public enum Haptics {
    public static func tap() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
    public static func medium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
    public static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }
    public static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
    public static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }
}
