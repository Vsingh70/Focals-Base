import SwiftUI
import FocalsDesign
import FocalsModels

/// Pipeline phases the Projects list groups by. Collapses the 7 raw
/// `ProjectStatus` values into the 5 stages a photographer actually thinks
/// in: inquiry → upcoming → active → delivered (+ cancelled at the bottom).
enum ProjectPhase: String, CaseIterable, Identifiable {
    case inquiry, upcoming, active, delivered, cancelled
    var id: String { rawValue }

    var title: String {
        switch self {
        case .inquiry:   return "Inquiries"
        case .upcoming:  return "Upcoming"
        case .active:    return "In progress"
        case .delivered: return "Delivered"
        case .cancelled: return "Cancelled"
        }
    }

    /// Colored tick beside the section header.
    var color: Color {
        switch self {
        case .inquiry:   return .tokens.textSecondary
        case .upcoming:  return .tokens.accent
        case .active:    return .tokens.warning
        case .delivered: return .tokens.success
        case .cancelled: return .tokens.danger
        }
    }

    static func of(_ status: ProjectStatus) -> ProjectPhase {
        switch status {
        case .inquiry:               return .inquiry
        case .booked:                return .upcoming
        case .inProgress, .editing:  return .active
        case .delivered, .completed: return .delivered
        case .cancelled:             return .cancelled
        }
    }
}
