import SwiftUI
import FocalsDesign

struct DesignTokenGallery: View {
    @State private var isDark = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    colorSection
                    typographySection
                    spacingSection
                    statusPillSection
                    cardSection
                }
                .padding(Spacing.md)
            }
            .background(Color.tokens.bg)
            .navigationTitle("Design Tokens")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isDark ? "Light" : "Dark") {
                        isDark.toggle()
                    }
                }
            }
            .preferredColorScheme(isDark ? .dark : .light)
        }
    }

    // MARK: - Colors

    private var colorSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Colors")
                .editorialHeadline()

            LazyVGrid(columns: [.init(.flexible()), .init(.flexible())], spacing: Spacing.sm) {
                colorSwatch("bg", Color.tokens.bg)
                colorSwatch("bgSecondary", Color.tokens.bgSecondary)
                colorSwatch("bgTertiary", Color.tokens.bgTertiary)
                colorSwatch("border", Color.tokens.border)
                colorSwatch("borderSecondary", Color.tokens.borderSecondary)
                colorSwatch("textPrimary", Color.tokens.textPrimary)
                colorSwatch("textSecondary", Color.tokens.textSecondary)
                colorSwatch("textTertiary", Color.tokens.textTertiary)
                colorSwatch("accent", Color.tokens.accent)
                colorSwatch("accentMuted", Color.tokens.accentMuted)
                colorSwatch("success", Color.tokens.success)
                colorSwatch("warning", Color.tokens.warning)
                colorSwatch("danger", Color.tokens.danger)
            }
        }
    }

    private func colorSwatch(_ name: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            RoundedRectangle(cornerRadius: Radius.sm)
                .fill(color)
                .frame(height: 48)
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.sm)
                        .stroke(Color.tokens.border, lineWidth: 0.5)
                )
            Text(name)
                .font(.tokens.body(11))
                .foregroundStyle(Color.tokens.textSecondary)
        }
    }

    // MARK: - Typography

    private var typographySection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Typography")
                .editorialHeadline()

            Group {
                Text("Display 28pt")
                    .font(.tokens.display(28))
                Text("SemiBold 17pt")
                    .font(.tokens.semibold(17))
                Text("Medium 15pt")
                    .font(.tokens.medium(15))
                Text("Body 15pt — The quick brown fox jumps over the lazy dog.")
                    .font(.tokens.body(15))
                Text("Body 13pt — Caption text for secondary information")
                    .font(.tokens.body(13))
                Text("Body 11pt — OVERLINE LABEL")
                    .font(.tokens.body(11))
                    .textCase(.uppercase)
                    .tracking(0.7)
            }
            .foregroundStyle(Color.tokens.textPrimary)
        }
        .cardStyle()
    }

    // MARK: - Spacing

    private var spacingSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Spacing")
                .editorialHeadline()

            VStack(alignment: .leading, spacing: Spacing.xs) {
                spacingBar("xs = 4", Spacing.xs)
                spacingBar("sm = 8", Spacing.sm)
                spacingBar("md = 16", Spacing.md)
                spacingBar("lg = 24", Spacing.lg)
                spacingBar("xl = 32", Spacing.xl)
                spacingBar("xxl = 48", Spacing.xxl)
            }
        }
        .cardStyle()
    }

    private func spacingBar(_ label: String, _ width: CGFloat) -> some View {
        HStack(spacing: Spacing.sm) {
            RoundedRectangle(cornerRadius: Radius.sm)
                .fill(Color.tokens.accent)
                .frame(width: width, height: 20)
            Text(label)
                .font(.tokens.body(11))
                .foregroundStyle(Color.tokens.textSecondary)
        }
    }

    // MARK: - Status Pills

    private var statusPillSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Status Pills")
                .editorialHeadline()

            HStack(spacing: Spacing.sm) {
                StatusPill("Accent", tone: .accent)
                StatusPill("Success", tone: .success)
                StatusPill("Warning", tone: .warning)
                StatusPill("Danger", tone: .danger)
                StatusPill("Neutral", tone: .neutral)
            }
        }
        .cardStyle()
    }

    // MARK: - Card

    private var cardSection: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Card Style")
                .editorialHeadline()

            VStack(alignment: .leading, spacing: Spacing.xs) {
                Text("Revenue MTD")
                    .font(.tokens.body(11))
                    .textCase(.uppercase)
                    .tracking(0.7)
                    .foregroundStyle(Color.tokens.textTertiary)
                Text("$4,500")
                    .font(.tokens.display(28))
                    .foregroundStyle(Color.tokens.textPrimary)
                Text("3 active projects")
                    .font(.tokens.body(13))
                    .foregroundStyle(Color.tokens.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .cardStyle()
        }
    }
}

#Preview {
    DesignTokenGallery()
        .preferredColorScheme(.dark)
}
