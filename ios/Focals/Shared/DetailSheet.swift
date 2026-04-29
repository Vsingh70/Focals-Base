import SwiftUI
import FocalsDesign

/// Editorial-styled sheet wrapper. Wraps content in a NavigationStack so
/// child detail screens can be pushed inside the sheet, sets consistent
/// presentation detents (medium + large), and surfaces a Done button that
/// dismisses via the SwiftUI environment.
///
/// Use as the top-level container of any sheet content:
///
///     .sheet(item: $router.presentedSheet) { _ in
///         DetailSheet(title: "New project") { ProjectFormView() }
///     }
public struct DetailSheet<Content: View>: View {
    let title: String
    let content: () -> Content

    @Environment(\.dismiss) private var dismiss

    public init(title: String, @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.content = content
    }

    public var body: some View {
        NavigationStack {
            content()
                .navigationTitle(title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") { dismiss() }
                    }
                }
        }
        .presentationDetents([.medium, .large])
        .presentationBackground(Color.tokens.bgSecondary)
        .presentationDragIndicator(.visible)
    }
}
