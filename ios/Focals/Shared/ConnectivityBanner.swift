import SwiftUI
import Network
import Observation
import FocalsDesign

/// Lives for the lifetime of the app and reports network reachability via
/// NWPathMonitor. The @Observable macro re-renders any views that read
/// `isOffline` whenever the value flips.
@Observable
@MainActor
public final class ConnectivityMonitor {
    public static let shared = ConnectivityMonitor()

    public private(set) var isOffline = false

    @ObservationIgnored
    private let monitor = NWPathMonitor()
    @ObservationIgnored
    private let queue = DispatchQueue(label: "ConnectivityMonitor")

    private init() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor [weak self] in
                self?.isOffline = path.status != .satisfied
            }
        }
        monitor.start(queue: queue)
    }
}

/// Compact "Offline" pill rendered in nav bar / toolbars when the network
/// is down. Hides itself when reachable so it doesn't take up space.
public struct ConnectivityBanner: View {
    @State private var monitor = ConnectivityMonitor.shared

    public init() {}

    public var body: some View {
        if monitor.isOffline {
            HStack(spacing: Spacing.xs) {
                Image(systemName: "wifi.slash")
                Text("Offline")
            }
            .font(.tokens.medium(12))
            .foregroundStyle(Color.tokens.textSecondary)
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, Spacing.xs)
            .background(Color.tokens.bgTertiary)
            .clipShape(Capsule())
        }
    }
}
