import SwiftUI
import FocalsDesign

/// Foreign-key picker. Tap to open a searchable list sheet, pick → row collapses
/// back to the chosen record's display name. `Clear` is only available when
/// `allowsClear` is true.
struct RelatedRecordField<T: Identifiable & Hashable>: View where T.ID == UUID {
    @Binding var selectedId: UUID?
    let label: String
    let placeholder: String
    let options: [T]
    let display: (T) -> String
    let secondary: (T) -> String?
    var allowsClear: Bool = true

    @State private var showPicker = false

    var body: some View {
        FormRow(label) {
            Button {
                showPicker = true
            } label: {
                HStack {
                    Text(currentLabel)
                        .font(.tokens.body(14))
                        .foregroundStyle(currentLabel == placeholder ? Color.tokens.textTertiary : Color.tokens.textPrimary)
                    Spacer()
                    if allowsClear, selectedId != nil {
                        Button {
                            selectedId = nil
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundStyle(Color.tokens.textTertiary)
                        }
                        .buttonStyle(.plain)
                    } else {
                        Image(systemName: "chevron.right")
                            .foregroundStyle(Color.tokens.textTertiary)
                    }
                }
            }
            .buttonStyle(.plain)
        }
        .sheet(isPresented: $showPicker) {
            RelatedRecordPicker(
                title: label,
                options: options,
                display: display,
                secondary: secondary,
                selectedId: $selectedId
            )
        }
    }

    private var currentLabel: String {
        if let id = selectedId,
           let match = options.first(where: { $0.id == id }) {
            return display(match)
        }
        return placeholder
    }
}

private struct RelatedRecordPicker<T: Identifiable & Hashable>: View where T.ID == UUID {
    let title: String
    let options: [T]
    let display: (T) -> String
    let secondary: (T) -> String?
    @Binding var selectedId: UUID?

    @State private var search = ""
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                ForEach(filtered, id: \.id) { option in
                    Button {
                        selectedId = option.id
                        dismiss()
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(display(option))
                                    .font(.tokens.body(15))
                                    .foregroundStyle(Color.tokens.textPrimary)
                                if let secondary = secondary(option), !secondary.isEmpty {
                                    Text(secondary)
                                        .font(.tokens.body(12))
                                        .foregroundStyle(Color.tokens.textTertiary)
                                }
                            }
                            Spacer()
                            if option.id == selectedId {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(Color.tokens.accent)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .listStyle(.plain)
            .searchable(text: $search, prompt: "Search")
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private var filtered: [T] {
        let needle = search.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !needle.isEmpty else { return options }
        return options.filter { display($0).localizedCaseInsensitiveContains(needle) }
    }
}
