import SwiftUI
import AuthenticationServices
import FocalsDesign

struct LoginView: View {
    @State private var error: String?
    @State private var isWorking = false

    var body: some View {
        VStack(spacing: Spacing.lg) {
            Spacer()
            VStack(spacing: Spacing.sm) {
                Text("Focals")
                    .editorialHeadline()
                Text("Photography business management")
                    .font(.tokens.body(15))
                    .foregroundStyle(Color.tokens.textSecondary)
            }
            Spacer()
            VStack(spacing: Spacing.sm) {
                AppleSignInButton(onError: { message in
                    self.error = message
                })
                Button {
                    Task { await signInWithGoogle() }
                } label: {
                    HStack {
                        Image(systemName: "globe")
                        Text("Continue with Google")
                    }
                    .frame(maxWidth: .infinity, minHeight: 50)
                }
                .buttonStyle(.bordered)
                .tint(Color.tokens.textPrimary)
            }
            if let error {
                Text(error)
                    .font(.tokens.body(13))
                    .foregroundStyle(Color.tokens.danger)
                    .multilineTextAlignment(.center)
            } else {
                // Reserve the space so layout doesn't jump when an error
                // appears.
                Color.clear.frame(height: 32)
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.tokens.bg)
        .disabled(isWorking)
    }

    private func signInWithGoogle() async {
        isWorking = true
        defer { isWorking = false }
        error = nil
        do {
            try await GoogleSignIn.shared.signIn()
        } catch {
            // ASWebAuthenticationSession returns ASWebAuthenticationSessionError
            // for both user-cancel (.canceledLogin) and explicit failures.
            // Don't surface cancellations as errors.
            if let webError = error as? ASWebAuthenticationSessionError,
               webError.code == .canceledLogin {
                return
            }
            self.error = error.localizedDescription
        }
    }
}
