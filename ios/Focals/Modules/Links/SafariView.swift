import SwiftUI
import SafariServices

/// Thin wrapper around `SFSafariViewController` for in-app web browsing.
struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }

    func updateUIViewController(_ vc: SFSafariViewController, context: Context) {}
}

/// `URL` is `Identifiable` only on iOS 16+ via `id: \.self` shorthand. Make
/// it explicit so `.sheet(item: $presentedURL)` compiles cleanly.
extension URL: @retroactive Identifiable {
    public var id: String { absoluteString }
}
