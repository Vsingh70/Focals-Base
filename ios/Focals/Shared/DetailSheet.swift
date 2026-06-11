import SwiftUI
import FocalsDesign

/// Editorial-styled sheet wrapper. Wraps content in a NavigationStack so
/// child detail screens can be pushed inside the sheet, sets consistent
/// presentation, and surfaces a trailing confirm button.
///
/// With no `onConfirm` the trailing button is a plain "Done" that dismisses
/// (legacy behavior — most callers). Passing `onConfirm` turns the sheet into
/// a form: a leading Cancel appears, the trailing button runs the action
/// (e.g. save), and `isWorking` swaps it for a spinner.
///
/// Use as the top-level container of any sheet content:
///
///     .sheet(item: $router.presentedSheet) { _ in
///         DetailSheet(title: "New project") { ProjectFormView() }
///     }
public struct DetailSheet<Content: View>: View {
    let title: String
    let confirmTitle: String
    let confirmDisabled: Bool
    let isWorking: Bool
    let onConfirm: (() -> Void)?      // nil → Done simply dismisses (legacy behavior)
    let content: () -> Content

    @Environment(\.dismiss) private var dismiss

    public init(
        title: String,
        confirmTitle: String = "Done",
        confirmDisabled: Bool = false,
        isWorking: Bool = false,
        onConfirm: (() -> Void)? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.title = title
        self.confirmTitle = confirmTitle
        self.confirmDisabled = confirmDisabled
        self.isWorking = isWorking
        self.onConfirm = onConfirm
        self.content = content
    }

    public var body: some View {
        NavigationStack {
            content()
                .navigationTitle(title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    if onConfirm != nil {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("Cancel") { dismiss() }
                        }
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        if isWorking {
                            ProgressView()
                        } else if let onConfirm {
                            Button(confirmTitle, action: onConfirm)
                                .fontWeight(.semibold)
                                .disabled(confirmDisabled)
                        } else {
                            Button("Done") { dismiss() }   // unchanged for other callers
                        }
                    }
                }
        }
        .presentationDetents([.large])
        .presentationBackground(Color.tokens.bgSecondary)
        .presentationDragIndicator(.visible)
    }
}
