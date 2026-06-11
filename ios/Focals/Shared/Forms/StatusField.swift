import SwiftUI
import FocalsDesign
import FocalsModels

/// Generic enum picker — works for any RawRepresentable+CaseIterable enum
/// keyed by String (project status, payment status, etc.).
struct StatusField<S: RawRepresentable & CaseIterable & Hashable>: View
where S.RawValue == String, S.AllCases: RandomAccessCollection {
    @Binding var value: S
    let label: String
    let display: (S) -> String

    init(
        value: Binding<S>,
        label: String,
        display: @escaping (S) -> String = { $0.rawValue }
    ) {
        self._value = value
        self.label = label
        self.display = display
    }

    var body: some View {
        FormRow(label) {
            Menu {
                ForEach(Array(S.allCases), id: \.self) { option in
                    Button {
                        value = option
                    } label: {
                        Text(display(option))
                    }
                }
            } label: {
                HStack {
                    Text(display(value))
                        .font(.tokens.body(14))
                        .foregroundStyle(Color.tokens.textPrimary)
                    Spacer()
                    Image(systemName: "chevron.up.chevron.down")
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
            .buttonStyle(.plain)
        }
    }
}
