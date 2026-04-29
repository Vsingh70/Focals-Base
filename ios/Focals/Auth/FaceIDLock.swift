import SwiftUI
import LocalAuthentication
import Observation
import FocalsDesign

/// Optional Face ID / Touch ID gate on cold start.
///
/// Disabled by default. Settings (Task 12) will surface a toggle that flips
/// `isEnabled`. When enabled, the app reaches the locked state on every
/// cold start until the user authenticates. There is no foreground-resume
/// re-lock in v1 — it's a once-per-launch gate, similar to most banking apps'
/// "remember me until I quit".
@Observable
@MainActor
final class FaceIDLock {
    private static let userDefaultsKey = "FaceIDLockEnabled"

    private(set) var isLocked: Bool

    var isEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: Self.userDefaultsKey) }
        set { UserDefaults.standard.set(newValue, forKey: Self.userDefaultsKey) }
    }

    init() {
        // Lock immediately on cold start when the toggle is on.
        self.isLocked = UserDefaults.standard.bool(forKey: Self.userDefaultsKey)
    }

    func unlock() async {
        guard isEnabled else {
            isLocked = false
            return
        }
        let context = LAContext()
        var policyError: NSError?
        // Use `.deviceOwnerAuthentication` not `.deviceOwnerAuthenticationWithBiometrics`
        // so a user without Face ID enrolled can still unlock with the device
        // passcode. We don't want to soft-brick anyone.
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &policyError) else {
            // No biometrics + no passcode set — degrade to no-lock so the user
            // isn't trapped. (This is a very narrow case but worth handling.)
            isLocked = false
            return
        }
        do {
            try await context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: "Unlock Focals"
            )
            isLocked = false
        } catch {
            // User cancelled or failed; stay locked. The lock screen has a
            // retry button so they can try again without restarting the app.
        }
    }
}

struct FaceIDLockScreen: View {
    let lock: FaceIDLock

    var body: some View {
        VStack(spacing: Spacing.lg) {
            Image(systemName: "faceid")
                .font(.system(size: 60))
                .foregroundStyle(Color.tokens.accent)
            Text("Locked")
                .font(.tokens.display(20))
                .foregroundStyle(Color.tokens.textPrimary)
            Button("Unlock") {
                Task { await lock.unlock() }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.tokens.accent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.tokens.bg)
        .task { await lock.unlock() }
    }
}
