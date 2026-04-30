import Foundation
import SwiftData
import FocalsModels

/// SwiftData mirror of `Project`. SwiftData needs class-based @Model types,
/// so we can't share the struct from FocalsModels. The mapping is mechanical:
/// flatten enum-typed fields to rawValue strings, store everything that's
/// nullable as Swift Optionals.
@Model
public final class CachedProject {
    @Attribute(.unique) public var serverId: UUID
    public var userId: UUID
    public var title: String
    public var clientId: UUID?
    public var category: String?
    /// `ProjectStatus.rawValue`. nil when the server row has no status.
    public var status: String?
    public var shootDate: Date?
    public var location: String?
    public var packagePrice: Double?
    public var amountPaid: Double?
    /// `PaymentStatus.rawValue`.
    public var paymentStatus: String?
    public var notes: String?
    public var createdAt: Date
    public var updatedAt: Date
    /// Stamped each time the row is upserted from the server. Used as the
    /// delta cursor for the next refresh.
    public var lastSyncedAt: Date

    public init(from model: Project) {
        self.serverId = model.id
        self.userId = model.userId
        self.title = model.title
        self.clientId = model.clientId
        self.category = model.category
        self.status = model.status?.rawValue
        self.shootDate = model.shootDate
        self.location = model.location
        self.packagePrice = model.packagePrice
        self.amountPaid = model.amountPaid
        self.paymentStatus = model.paymentStatus?.rawValue
        self.notes = model.notes
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    /// In-place update of an existing cached row from a fresh server copy.
    public func applyServer(_ model: Project) {
        self.userId = model.userId
        self.title = model.title
        self.clientId = model.clientId
        self.category = model.category
        self.status = model.status?.rawValue
        self.shootDate = model.shootDate
        self.location = model.location
        self.packagePrice = model.packagePrice
        self.amountPaid = model.amountPaid
        self.paymentStatus = model.paymentStatus?.rawValue
        self.notes = model.notes
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    public func toModel() -> Project {
        Project(
            id: serverId,
            userId: userId,
            title: title,
            clientId: clientId,
            category: category,
            status: status.flatMap { ProjectStatus(rawValue: $0) },
            shootDate: shootDate,
            location: location,
            packagePrice: packagePrice,
            amountPaid: amountPaid,
            paymentStatus: paymentStatus.flatMap { PaymentStatus(rawValue: $0) },
            notes: notes,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }
}
