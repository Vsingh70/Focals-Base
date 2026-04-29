import SwiftUI

public extension View {
    func cardStyle() -> some View {
        self
            .padding(Spacing.md)
            .background(Color.tokens.bgSecondary)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.md)
                    .stroke(Color.tokens.border, lineWidth: 0.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: Radius.md))
    }

    func editorialHeadline() -> some View {
        self
            .font(.tokens.display(28))
            .foregroundStyle(Color.tokens.textPrimary)
            .tracking(-0.4)
    }
}

public struct StatusPill: View {
    public enum Tone { case accent, success, warning, danger, neutral }
    let text: String
    let tone: Tone

    public init(_ text: String, tone: Tone) {
        self.text = text
        self.tone = tone
    }

    public var body: some View {
        Text(text)
            .font(.tokens.medium(11))
            .textCase(.uppercase)
            .tracking(0.6)
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, Spacing.xs / 2)
            .foregroundStyle(foreground)
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: Radius.sm))
    }

    private var foreground: Color {
        switch tone {
        case .accent:  return .tokens.accent
        case .success: return .tokens.success
        case .warning: return .tokens.warning
        case .danger:  return .tokens.danger
        case .neutral: return .tokens.textTertiary
        }
    }

    private var background: Color {
        foreground.opacity(0.12)
    }
}
