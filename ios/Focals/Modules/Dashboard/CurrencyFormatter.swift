import Foundation

/// Whole-dollar currency formatter shared across the dashboard. The `.currency`
/// FormatStyle on Decimal would also work, but on `_$0` accounts we want the
/// "$0" form rather than "—" or empty, and we want consistent rounding across
/// the KPI tiles, so we centralize it here.
enum CurrencyFormatter {
    static let whole: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        f.maximumFractionDigits = 0
        f.minimumFractionDigits = 0
        return f
    }()
}

extension Decimal {
    /// Whole-dollar string ("$1,250") — matches the web dashboard's KPI tiles.
    var dashboardCurrencyString: String {
        let nsNumber = NSDecimalNumber(decimal: self)
        return CurrencyFormatter.whole.string(from: nsNumber) ?? "$0"
    }
}
