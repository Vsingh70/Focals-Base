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
                LoggedInRoot()
            }
        }
        .background(Color.tokens.bg)
        .onOpenURL { url in
            DeepLinkRouter.shared.handle(url)
        }
    }
}

// Picks TabBarShell vs SplitViewShell based on horizontal size class so
// iPhone, iPad in compact width (Stage Manager 1/3), and iPad in regular
// width all land in the right layout. The global sheet presenter lives
// here so any deeply-nested module can set `router.presentedSheet`.
private struct LoggedInRoot: View {
    @Environment(\.horizontalSizeClass) private var hSize
    @State private var router = AppRouter.shared

    var body: some View {
        Group {
            if hSize == .regular {
                SplitViewShell(router: router)
            } else {
                TabBarShell(router: router)
            }
        }
        .sheet(item: $router.presentedSheet) { sheet in
            sheetDestination(sheet)
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

#Preview {
    RootView()
        .preferredColorScheme(.dark)
}
