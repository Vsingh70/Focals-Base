import Foundation

public struct Finance: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let type: FinanceType
    public let amount: Double
    public let date: String
    public let category: String?
    public let description: String?
    public let paymentMethod: String?
    public let projectId: UUID?
    public let createdAt: Date

    public init(
        id: UUID,
        userId: UUID,
        type: FinanceType,
        amount: Double,
        date: String,
        category: String?,
        description: String?,
        paymentMethod: String?,
        projectId: UUID?,
        createdAt: Date
    ) {
        self.id = id
        self.userId = userId
        self.type = type
        self.amount = amount
        self.date = date
        self.category = category
        self.description = description
        self.paymentMethod = paymentMethod
        self.projectId = projectId
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case type, amount, date, category, description
        case paymentMethod = "payment_method"
        case projectId = "project_id"
        case createdAt = "created_at"
    }
}
