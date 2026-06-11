import SwiftUI
import FocalsDesign

/// Root of the More tab. Lists the secondary modules that don't have their
/// own primary tab on iPhone (the bottom bar only has room for five).
/// Tapping a row pushes the corresponding screen onto the More tab's
/// NavigationStack via `AppRouter.navigate(to:)`.
struct MoreScreen: View {
    var body: some View {
        List {
            Section {
                MoreRow(symbol: "person.2", label: "Clients", route: .clients)
                MoreRow(symbol: "dollarsign.circle", label: "Finances", route: .finances)
                MoreRow(symbol: "doc.text", label: "Contracts", route: .contracts)
            }
            Section {
                MoreRow(symbol: "camera.aperture", label: "Gear", route: .gear)
                MoreRow(symbol: "list.bullet.rectangle", label: "Forms", route: .forms)
                MoreRow(symbol: "link", label: "Links", route: .links)
            }
            Section {
                MoreRow(symbol: "questionmark.circle", label: "Help", route: .help)
                MoreRow(symbol: "gear", label: "Settings", route: .settings)
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(Color.tokens.bg)
        .navigationTitle("More")
    }
}

private struct MoreRow: View {
    let symbol: String
    let label: String
    let route: Route

    var body: some View {
        Button {
            Haptics.tap()
            AppRouter.shared.navigate(to: route)
        } label: {
            HStack(spacing: Spacing.md) {
                Image(systemName: symbol)
                    .font(.system(size: 17))
                    .foregroundStyle(Color.tokens.accent)
                    .frame(width: 28)
                Text(label)
                    .font(.tokens.body(15))
                    .foregroundStyle(Color.tokens.textPrimary)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textTertiary)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
