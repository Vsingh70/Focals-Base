import Foundation
import FocalsModels

/// CSV export helper. Writes a temporary `.csv` file in the system tmp dir
/// and hands the URL to `ShareLink`. The header row matches the columns the
/// web's "Export CSV" button (when it lands) is expected to produce.
enum FinancesCSVExport {
    static func write(transactions: [Finance]) -> URL {
        let header = "Date,Type,Amount,Category,Description,Payment Method,Project ID\n"
        let rows = transactions.map { tx -> String in
            let cols: [String] = [
                tx.date,
                tx.type.rawValue,
                String(format: "%.2f", tx.amount),
                tx.category ?? "",
                escape(tx.description ?? ""),
                tx.paymentMethod ?? "",
                tx.projectId?.uuidString ?? "",
            ]
            return cols.joined(separator: ",")
        }
        let csv = header + rows.joined(separator: "\n")

        let stamp = ISO8601DateFormatter().string(from: .now)
            .replacingOccurrences(of: ":", with: "-")
        let filename = "finances-\(stamp).csv"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        try? csv.write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    private static func escape(_ value: String) -> String {
        // RFC 4180: wrap in quotes if value contains comma, quote, or newline;
        // double any inner quotes.
        guard value.contains(where: { $0 == "," || $0 == "\"" || $0 == "\n" }) else {
            return value
        }
        let doubled = value.replacingOccurrences(of: "\"", with: "\"\"")
        return "\"\(doubled)\""
    }
}
