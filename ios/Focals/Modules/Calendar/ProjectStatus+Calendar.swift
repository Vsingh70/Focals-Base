import SwiftUI
import FocalsDesign
import FocalsModels

extension ProjectStatus {
    /// Bar swatch under the day cell + left border on the per-day list card.
    /// Mirrors `STATUS_BAR_COLOR` in MobileCalendarView.tsx.
    var barColor: Color {
        switch self {
        case .inquiry:                  return Color.tokens.textTertiary
        case .booked:                   return Color.tokens.accent
        case .inProgress, .editing:     return Color.tokens.warning
        case .delivered, .completed:    return Color.tokens.success
        case .cancelled:                return Color.tokens.danger
        }
    }

    /// Pill tone for the per-project list cards. Mirrors `statusToneMap`.
    var calendarPillTone: StatusPill.Tone {
        switch self {
        case .inquiry:                  return .neutral
        case .booked:                   return .accent
        case .inProgress, .editing:     return .warning
        case .delivered, .completed:    return .success
        case .cancelled:                return .danger
        }
    }
}
