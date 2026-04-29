import SwiftUI
import FocalsDesign

/// Editorial-styled empty state used across every list/module screen.
/// One SF Symbol + a title + optional body copy + optional CTA.
///
/// Note: the parameter for the body copy is named `description` rather than
/// `body` so it doesn't shadow `View.body`.
public struct EmptyState: View {
    let symbol: String
    let title: String
    let description: String?
    let cta: CTA?

    public struct CTA {
        public let label: String
        public let action: () -> Void
        public init(label: String, action: @escaping () -> Void) {
            self.label = label
            self.action = action
        }
    }

    public init(
        symbol: String,
        title: String,
        description: String? = nil,
        cta: CTA? = nil
    ) {
        self.symbol = symbol
        self.title = title
        self.description = description
        self.cta = cta
    }

    public var body: some View {
        VStack(spacing: Spacing.md) {
            Image(systemName: symbol)
                .font(.system(size: 36))
                .foregroundStyle(Color.tokens.textTertiary)
            Text(title)
                .font(.tokens.display(20))
                .foregroundStyle(Color.tokens.textPrimary)
            if let description {
                Text(description)
                    .font(.tokens.body(14))
                    .foregroundStyle(Color.tokens.textSecondary)
                    .multilineTextAlignment(.center)
            }
            if let cta {
                Button(cta.label, action: cta.action)
                    .buttonStyle(.borderedProminent)
                    .tint(Color.tokens.accent)
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.tokens.bg)
    }
}
