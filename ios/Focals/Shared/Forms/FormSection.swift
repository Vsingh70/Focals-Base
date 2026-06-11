import SwiftUI
import FocalsDesign

/// Editorial-styled grouping for a form: small uppercase header + a single
/// rounded card containing its children. Used by ProjectForm and ClientForm.
struct FormSection<Content: View>: View {
    let header: String
    @ViewBuilder let content: () -> Content

    init(_ header: String, @ViewBuilder content: @escaping () -> Content) {
        self.header = header
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(header)
                .font(.tokens.medium(11))
                .textCase(.uppercase)
                .tracking(0.7)
                .foregroundStyle(Color.tokens.textTertiary)
            VStack(alignment: .leading, spacing: Spacing.sm) {
                content()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Spacing.md)
            .background(Color.tokens.bgSecondary)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.md)
                    .stroke(Color.tokens.border, lineWidth: 0.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: Radius.md))
        }
    }
}

/// Standard label + content row used inside a FormSection. The label sits in
/// uppercase tertiary text on the left, content fills the rest of the row.
struct FormRow<Content: View>: View {
    let label: String
    @ViewBuilder let content: () -> Content

    init(_ label: String, @ViewBuilder content: @escaping () -> Content) {
        self.label = label
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.tokens.body(11))
                .foregroundStyle(Color.tokens.textTertiary)
            content()
        }
    }
}
