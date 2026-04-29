import SwiftUI
import FocalsDesign

struct RootView: View {
    @State private var session = SessionStore.shared
    @State private var faceIDLock = FaceIDLock()

    var body: some View {
        Group {
            if session.isLoading {
                LoadingView()
            } else if session.user == nil {
                LoginView()
            } else if faceIDLock.isLocked {
                FaceIDLockScreen(lock: faceIDLock)
            } else {
                LoggedInPlaceholder(
                    email: session.user?.email ?? "—",
                    fullName: session.profile?.fullName
                )
            }
        }
        .background(Color.tokens.bg)
        .onOpenURL { url in
            DeepLinkRouter.shared.handle(url)
        }
    }
}

private struct LoadingView: View {
    var body: some View {
        VStack {
            ProgressView()
                .tint(Color.tokens.accent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.tokens.bg)
    }
}

/// Stand-in for the real shell that arrives in Task 04 (TabBarShell on iPhone,
/// SplitViewShell on iPad). This is just enough to verify auth round-trips:
/// shows who's signed in and a Sign Out button.
private struct LoggedInPlaceholder: View {
    let email: String
    let fullName: String?

    var body: some View {
        VStack(spacing: Spacing.md) {
            Spacer()
            Text("Signed in as")
                .font(.tokens.body(13))
                .foregroundStyle(Color.tokens.textTertiary)
            if let fullName, !fullName.isEmpty {
                Text(fullName)
                    .editorialHeadline()
            }
            Text(email)
                .font(.tokens.body(15))
                .foregroundStyle(Color.tokens.textSecondary)
            Spacer()
            Button("Sign out") {
                Task { try? await SessionStore.shared.signOut() }
            }
            .buttonStyle(.bordered)
            .tint(Color.tokens.danger)
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.tokens.bg)
    }
}

#Preview {
    RootView()
        .preferredColorScheme(.dark)
}
