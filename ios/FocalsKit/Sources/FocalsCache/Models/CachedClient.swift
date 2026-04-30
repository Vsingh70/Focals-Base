import Foundation
import SwiftData
import FocalsModels

@Model
public final class CachedClient {
    @Attribute(.unique) public var serverId: UUID
    public var userId: UUID
    public var fullName: String
    public var email: String?
    public var phone: String?
    public var notes: String?
    public var source: String?
    public var createdAt: Date
    public var updatedAt: Date
    public var lastSyncedAt: Date

    public init(from model: Client) {
        self.serverId = model.id
        self.userId = model.userId
        self.fullName = model.fullName
        self.email = model.email
        self.phone = model.phone
        self.notes = model.notes
        self.source = model.source
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    public func applyServer(_ model: Client) {
        self.userId = model.userId
        self.fullName = model.fullName
        self.email = model.email
        self.phone = model.phone
        self.notes = model.notes
        self.source = model.source
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    public func toModel() -> Client {
        Client(
            id: serverId,
            userId: userId,
            fullName: fullName,
            email: email,
            phone: phone,
            notes: notes,
            source: source,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }
}
