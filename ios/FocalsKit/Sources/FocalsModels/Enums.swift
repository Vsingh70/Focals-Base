import Foundation

public enum ProjectStatus: String, Codable, CaseIterable, Sendable {
    case inquiry
    case booked
    case inProgress = "in_progress"
    case editing
    case delivered
    case completed
    case cancelled

    /// Human-readable label for UI. Always render this, never the rawValue —
    /// "in_progress" leaks the snake_case Postgres convention to users.
    public var displayName: String {
        rawValue
            .split(separator: "_")
            .map { $0.prefix(1).uppercased() + $0.dropFirst() }
            .joined(separator: " ")
    }
}

public enum PaymentStatus: String, Codable, CaseIterable, Sendable {
    case unpaid
    case partial
    case paid
}

public enum InquiryStatus: String, Codable, CaseIterable, Sendable {
    case new
    case read
    case replied
    case converted
    case archived

    /// Title-cased label for UI. Matches the web inbox's filter labels exactly.
    public var displayName: String {
        rawValue.prefix(1).uppercased() + rawValue.dropFirst()
    }
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
