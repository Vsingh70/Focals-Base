import Foundation
import FocalsModels

/// Finance category + payment method values that match the web's
/// `validations/finances.ts`. Stored as raw strings on the row so the iOS
/// form mirrors the web's "free text with datalist" behaviour: any string
/// is accepted, but these are the canonical options surfaced as pickers.
public enum FinanceConstants {
    public static let categories: [String] = [
        "session_fee",
        "print_sale",
        "gear",
        "software",
        "travel",
        "misc",
    ]

    public static let paymentMethods: [String] = [
        "venmo", "zelle", "check", "cash", "stripe",
    ]

    public static func displayCategory(_ raw: String?) -> String {
        guard let raw, !raw.isEmpty else { return "—" }
        return raw.replacingOccurrences(of: "_", with: " ").capitalized
    }

    public static func displayPaymentMethod(_ raw: String?) -> String {
        guard let raw, !raw.isEmpty else { return "—" }
        return raw.capitalized
    }
}

public extension Finance {
    /// `YYYY-MM-DD` date string parsed in the user's calendar — used for month
    /// grouping in the iOS list. Mirrors how the web reads `finances.date`
    /// (which is a Postgres `date`, no time component).
    func parsedDate(calendar: Calendar = .current) -> Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = calendar.timeZone
        return formatter.date(from: String(self.date.prefix(10)))
    }

    /// Display amount with sign convention used across the app:
    /// income shows `+$1,500`, expense shows `-$240`.
    var signedAmountString: String {
        let sign = type == .income ? "+" : "-"
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        f.maximumFractionDigits = 2
        f.minimumFractionDigits = 0
        return sign + (f.string(from: NSNumber(value: amount)) ?? "$\(amount)")
    }
}
