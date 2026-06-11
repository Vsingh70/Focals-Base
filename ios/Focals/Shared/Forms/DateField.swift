import SwiftUI
import FocalsDesign

/// Optional date+time picker with a clear affordance. Components default to
/// `[.date, .hourAndMinute]` to mirror the web's `datetime-local` input.
struct DateField: View {
    @Binding var date: Date?
    let label: String
    var allowsClear: Bool = true
    var components: DatePicker.Components = [.date, .hourAndMinute]

    var body: some View {
        FormRow(label) {
            HStack {
                if date != nil {
                    DatePicker(
                        "",
                        selection: Binding(
                            get: { date ?? .now },
                            set: { date = $0 }
                        ),
                        displayedComponents: components
                    )
                    .labelsHidden()
                } else {
                    Button {
                        date = defaultValue
                    } label: {
                        Text("Set date")
                            .font(.tokens.body(14))
                            .foregroundStyle(Color.tokens.accent)
                    }
                    .buttonStyle(.plain)
                }

                Spacer()

                if allowsClear, date != nil {
                    Button(role: .destructive) {
                        date = nil
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(Color.tokens.textTertiary)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    /// Default to 10:00 AM today when the user opts in to setting a date —
    /// matches the web calendar's "+ Add" prefill.
    private var defaultValue: Date {
        var comps = Calendar.current.dateComponents([.year, .month, .day], from: .now)
        comps.hour = 10
        comps.minute = 0
        return Calendar.current.date(from: comps) ?? .now
    }
}
