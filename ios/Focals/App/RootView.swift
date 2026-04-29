import SwiftUI
import FocalsDesign

struct RootView: View {
    var body: some View {
        DesignTokenGallery()
    }
}

#Preview {
    RootView()
        .preferredColorScheme(.dark)
}
