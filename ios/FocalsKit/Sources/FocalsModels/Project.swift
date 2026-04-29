import Foundation

public struct Project: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let title: String
    public let clientId: UUID?
    public let category: String?
    // status is nullable in Postgres (default 'inquiry' but legacy rows can be null)
    public let status: ProjectStatus?
    // shoot_date is timestamptz after the 20260429180000 migration — full
    // ISO 8601 timestamp with timezone.
    public let shootDate: Date?
    public let location: String?
    public let packagePrice: Double?
    public let amountPaid: Double?
    public let paymentStatus: PaymentStatus?
    public let notes: String?
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title
        case clientId = "client_id"
        case category, status
        case shootDate = "shoot_date"
        case location
        case packagePrice = "package_price"
        case amountPaid = "amount_paid"
        case paymentStatus = "payment_status"
        case notes
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
