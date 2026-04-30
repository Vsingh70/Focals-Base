import Foundation
import SwiftData
import FocalsModels

@Model
public final class CachedFinance {
    @Attribute(.unique) public var serverId: UUID
    public var userId: UUID
    /// `FinanceType.rawValue`. Non-optional on the server.
    public var type: String
    public var amount: Double
    /// Server stores `date` (no time). Keep as String to avoid a TZ shift —
    /// the column is a calendar date, not a timestamp.
    public var date: String
    public var category: String?
    public var desc: String?
    public var paymentMethod: String?
    public var projectId: UUID?
    public var createdAt: Date
    public var lastSyncedAt: Date

    public init(from model: Finance) {
        self.serverId = model.id
        self.userId = model.userId
        self.type = model.type.rawValue
        self.amount = model.amount
        self.date = model.date
        self.category = model.category
        self.desc = model.description
        self.paymentMethod = model.paymentMethod
        self.projectId = model.projectId
        self.createdAt = model.createdAt
        self.lastSyncedAt = .now
    }

    public func applyServer(_ model: Finance) {
        self.userId = model.userId
        self.type = model.type.rawValue
        self.amount = model.amount
        self.date = model.date
        self.category = model.category
        self.desc = model.description
        self.paymentMethod = model.paymentMethod
        self.projectId = model.projectId
        self.createdAt = model.createdAt
        self.lastSyncedAt = .now
    }

    public func toModel() -> Finance {
        Finance(
            id: serverId,
            userId: userId,
            type: FinanceType(rawValue: type) ?? .expense,
            amount: amount,
            date: date,
            category: category,
            description: desc,
            paymentMethod: paymentMethod,
            projectId: projectId,
            createdAt: createdAt
        )
    }
}
