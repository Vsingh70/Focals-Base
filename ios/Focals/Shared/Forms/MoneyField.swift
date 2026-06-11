import SwiftUI
import FocalsDesign

/// Decimal-typed currency input. Stores nil when the user clears the field;
/// the value is whatever the user types (no symbol enforcement) and is
/// formatted with `.currency` only when not focused.
struct MoneyField: View {
    @Binding var value: Double?
    let label: String

    @State private var raw: String = ""
    @FocusState private var focused: Bool

    var body: some View {
        FormRow(label) {
            TextField(
                "$0",
                text: Binding(
                    get: { focused ? raw : displayString },
                    set: { newValue in
                        raw = newValue
                        value = parse(newValue)
                    }
                )
            )
            .keyboardType(.decimalPad)
            .focused($focused)
            .padding(.vertical, 4)
            .onAppear {
                if let value, raw.isEmpty {
                    raw = String(value)
                }
            }
            .onChange(of: focused) { _, isFocused in
                if !isFocused, let value {
                    raw = String(value)
                }
            }
        }
    }

    private var displayString: String {
        guard let value else { return "" }
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        f.maximumFractionDigits = 2
        f.minimumFractionDigits = 0
        return f.string(from: NSNumber(value: value)) ?? "$\(value)"
    }

    private func parse(_ string: String) -> Double? {
        let trimmed = string
            .replacingOccurrences(of: "$", with: "")
            .replacingOccurrences(of: ",", with: "")
            .trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty { return nil }
        return Double(trimmed)
    }
}
