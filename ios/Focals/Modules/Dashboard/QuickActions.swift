import SwiftUI
import FocalsDesign
import FocalsModels

struct QuickActions: View {
    var body: some View {
        HStack(spacing: Spacing.sm) {
            QuickActionButton(symbol: "folder.badge.plus", label: "Project") {
                AppRouter.shared.presentedSheet = .createProject(presetShootDate: nil)
            }
            QuickActionButton(symbol: "envelope.badge", label: "Inquiry") {
                AppRouter.shared.presentedSheet = .createInquiry
            }
            QuickActionButton(symbol: "minus.circle", label: "Expense") {
                AppRouter.shared.presentedSheet = .createFinance(preselectedType: .expense)
            }
        }
    }
}

private struct QuickActionButton: View {
    let symbol: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            VStack(spacing: Spacing.xs) {
                Image(systemName: symbol)
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(Color.tokens.accent)
                Text(label)
                    .font(.tokens.medium(12))
                    .foregroundStyle(Color.tokens.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.sm)
            .background(Color.tokens.bgSecondary)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.md)
                    .stroke(Color.tokens.border, lineWidth: 0.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: Radius.md))
        }
        .buttonStyle(.plain)
    }
}
