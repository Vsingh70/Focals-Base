import Foundation
import SwiftData
import FocalsModels

@Model
public final class CachedGear {
    @Attribute(.unique) public var serverId: UUID
    public var userId: UUID
    public var name: String
    public var category: String?
    public var brand: String?
    public var modelName: String?
    public var serialNumber: String?
    public var purchasePrice: Double?
    public var purchaseDate: String?
    /// `GearStatus.rawValue`.
    public var status: String?
    public var notes: String?
    public var createdAt: Date
    public var lastSyncedAt: Date

    public init(from model: Gear) {
        self.serverId = model.id
        self.userId = model.userId
        self.name = model.name
        self.category = model.category
        self.brand = model.brand
        self.modelName = model.model
        self.serialNumber = model.serialNumber
        self.purchasePrice = model.purchasePrice
        self.purchaseDate = model.purchaseDate
        self.status = model.status?.rawValue
        self.notes = model.notes
        self.createdAt = model.createdAt
        self.lastSyncedAt = .now
    }

    public func applyServer(_ model: Gear) {
        self.userId = model.userId
        self.name = model.name
        self.category = model.category
        self.brand = model.brand
        self.modelName = model.model
        self.serialNumber = model.serialNumber
        self.purchasePrice = model.purchasePrice
        self.purchaseDate = model.purchaseDate
        self.status = model.status?.rawValue
        self.notes = model.notes
        self.createdAt = model.createdAt
        self.lastSyncedAt = .now
    }

    public func toModel() -> Gear {
        Gear(
            id: serverId,
            userId: userId,
            name: name,
            category: category,
            brand: brand,
            model: modelName,
            serialNumber: serialNumber,
            purchasePrice: purchasePrice,
            purchaseDate: purchaseDate,
            status: status.flatMap { GearStatus(rawValue: $0) },
            notes: notes,
            createdAt: createdAt
        )
    }
}
