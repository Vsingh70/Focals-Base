import SwiftUI
import FocalsAPI
import FocalsDesign
import FocalsModels

struct InquiryRow: View {
    let inquiry: Inquiry

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.sm) {
            // Unread dot — matches the web's "new" treatment.
            Circle()
                .fill((inquiry.status ?? .new) == .new ? Color.tokens.accent : .clear)
                .frame(width: 8, height: 8)
                .padding(.top, 6)

            VStack(alignment: .leading, spacing: Spacing.xs) {
                HStack(alignment: .firstTextBaseline, spacing: Spacing.sm) {
                    Text(inquiry.name)
                        .font(.tokens.medium(15))
                        .foregroundStyle(Color.tokens.textPrimary)
                        .lineLimit(1)
                    Spacer(minLength: Spacing.xs)
                    Text(Self.relativeDate(inquiry.createdAt))
                        .font(.tokens.body(12))
                        .foregroundStyle(Color.tokens.textTertiary)
                }

                let metaParts: [String] = [
                    inquiry.shootType,
                    Self.preferredDateLabel(inquiry.preferredDate),
                    "via \(inquiry.source.replacingOccurrences(of: "_", with: " "))",
                ].compactMap { $0 }

                if !metaParts.isEmpty {
                    Text(metaParts.joined(separator: " · "))
                        .font(.tokens.body(12))
                        .foregroundStyle(Color.tokens.textSecondary)
                        .lineLimit(1)
                }

                if let message = inquiry.message, !message.isEmpty {
                    Text(message)
                        .font(.tokens.body(13))
                        .foregroundStyle(Color.tokens.textSecondary)
                        .lineLimit(2)
                }
            }
        }
        .padding(.vertical, Spacing.xs)
        .contentShape(Rectangle())
    }

    private static let relativeFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f
    }()

    static func relativeDate(_ date: Date) -> String {
        let interval = Date.now.timeIntervalSince(date)
        if interval < 60 { return "just now" }
        return relativeFormatter.localizedString(for: date, relativeTo: .now)
    }

    private static let preferredDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let preferredDateOutput: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f
    }()

    static func preferredDateLabel(_ raw: String?) -> String? {
        guard let raw, !raw.isEmpty else { return nil }
        guard let date = preferredDateFormatter.date(from: String(raw.prefix(10))) else {
            return raw
        }
        return preferredDateOutput.string(from: date)
    }
}
