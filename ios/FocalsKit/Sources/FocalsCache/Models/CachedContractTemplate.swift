import Foundation
import SwiftData
import FocalsModels

@Model
public final class CachedContractTemplate {
    @Attribute(.unique) public var serverId: UUID
    public var userId: UUID
    public var name: String
    public var body: String
    public var createdAt: Date
    public var updatedAt: Date
    public var lastSyncedAt: Date

    public init(from model: ContractTemplate) {
        self.serverId = model.id
        self.userId = model.userId
        self.name = model.name
        self.body = model.body
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    public func applyServer(_ model: ContractTemplate) {
        self.userId = model.userId
        self.name = model.name
        self.body = model.body
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    public func toModel() -> ContractTemplate {
        ContractTemplate(
            id: serverId,
            userId: userId,
            name: name,
            body: body,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }
}
