import SwiftUI
import FocalsAPI
import FocalsDesign
import FocalsModels

struct DayCell: View {
    let date: Date
    let isInMonth: Bool
    let isToday: Bool
    let isSelected: Bool
    let projects: [Project]

    private static let calendar = Calendar.iso8601MondayFirst

    var body: some View {
        VStack(spacing: 2) {
            // Pick a different Inter face for emphasis instead of layering
            // .fontWeight on top of Inter-Regular — that combination spams
            // "Unable to update Font Descriptor's weight" in the console
            // because Inter-Regular isn't a variable-axis font.
            Text("\(Self.calendar.component(.day, from: date))")
                .font(isToday || isSelected ? .tokens.semibold(14) : .tokens.body(14))
                .foregroundStyle(numberColor)
                .opacity(isInMonth ? 1 : 0.5)
                .frame(width: 28, height: 28)
                .background(
                    Circle()
                        .fill(isSelected ? Color.tokens.accentMuted : .clear)
                )
                .overlay(
                    Circle()
                        .stroke(isToday ? Color.tokens.accent : .clear, lineWidth: 1)
                )

            // Up to 3 colored dots — visually identical to the web's 4×4 px swatches.
            HStack(spacing: 2) {
                ForEach(Array(projects.prefix(3).enumerated()), id: \.offset) { _, project in
                    Circle()
                        .fill((project.status ?? .inquiry).barColor)
                        .frame(width: 4, height: 4)
                }
            }
            .frame(height: 4)

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 56)
        .padding(.top, 6)
        .contentShape(Rectangle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityLabelText)
        .accessibilityHint(projects.isEmpty ? "" : "Double-tap to view projects")
    }

    private var accessibilityLabelText: String {
        let dayString = date.formatted(.dateTime.weekday(.wide).month().day())
        let projectsLabel = projects.isEmpty
            ? "no projects"
            : "\(projects.count) project\(projects.count == 1 ? "" : "s")"
        if isToday { return "Today, \(dayString), \(projectsLabel)" }
        return "\(dayString), \(projectsLabel)"
    }

    private var numberColor: Color {
        if !isInMonth {        return Color.tokens.textTertiary }
        if isSelected || isToday { return Color.tokens.accent }
        return Color.tokens.textPrimary
    }
}
