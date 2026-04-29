import Foundation

public enum ProjectStatus: String, Codable, CaseIterable, Sendable {
    case inquiry
    case booked
    case inProgress = "in_progress"
    case editing
    case delivered
    case completed
    case cancelled
}

public enum PaymentStatus: String, Codable, CaseIterable, Sendable {
    case unpaid
    case partial
    case paid
}

public enum ShootStatus: String, Codable, CaseIterable, Sendable {
    case scheduled
    case completed
    case cancelled
    case rescheduled
}

public enum InquiryStatus: String, Codable, CaseIterable, Sendable {
    case new
    case read
    case replied
    case converted
    case archived
}

public enum ContractStatus: String, Codable, CaseIterable, Sendable {
    case draft
    case sent
    case signed
    case void
}

public enum FinanceType: String, Codable, CaseIterable, Sendable {
    case income
    case expense
}

public enum GearStatus: String, Codable, CaseIterable, Sendable {
    case owned
    case wishlist
    case sold
    case rented
}

public enum FormFieldType: String, Codable, CaseIterable, Sendable {
    case text
    case date
    case currency
    case contact
    case checkbox
}
