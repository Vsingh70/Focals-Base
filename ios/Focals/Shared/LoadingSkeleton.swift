import SwiftUI
import FocalsDesign

/// Animated card-shaped placeholder. The shimmer is a translating linear
/// gradient masked by the card's rounded rectangle.
public struct SkeletonCard: View {
    @State private var phase: CGFloat = -200

    public init() {}

    public var body: some View {
        RoundedRectangle(cornerRadius: Radius.md)
            .fill(Color.tokens.bgSecondary)
            .overlay(
                LinearGradient(
                    colors: [
                        .clear,
                        Color.tokens.bgTertiary.opacity(0.5),
                        .clear
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .offset(x: phase)
                .mask(RoundedRectangle(cornerRadius: Radius.md))
            )
            .onAppear {
                withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                    phase = 400
                }
            }
    }
}

/// Convenience: a vertical stack of `SkeletonCard`s sized to the typical
/// list-row height. Each module that needs a more specific skeleton (e.g.
/// the calendar) builds its own — this is the default.
public struct SkeletonList: View {
    let count: Int

    public init(count: Int = 6) {
        self.count = count
    }

    public var body: some View {
        VStack(spacing: Spacing.sm) {
            ForEach(0..<count, id: \.self) { _ in
                SkeletonCard().frame(height: 64)
            }
        }
        .padding(Spacing.md)
    }
}
