import Foundation
import SwiftData
import FocalsModels

@Model
public final class CachedLink {
    @Attribute(.unique) public var serverId: UUID
    public var userId: UUID
    public var title: String
    public var url: String
    public var category: String?
    public var notes: String?
    public var createdAt: Date
    public var lastSyncedAt: Date

    public init(from model: Link) {
        self.serverId = model.id
        self.userId = model.userId
        self.title = model.title
        self.url = model.url
        self.category = model.category
        self.notes = model.notes
        self.createdAt = model.createdAt
        self.lastSyncedAt = .now
    }

    public func applyServer(_ model: Link) {
        self.userId = model.userId
        self.title = model.title
        self.url = model.url
        self.category = model.category
        self.notes = model.notes
        self.createdAt = model.createdAt
        self.lastSyncedAt = .now
    }

    public func toModel() -> Link {
        Link(
            id: serverId,
            userId: userId,
            title: title,
            url: url,
            category: category,
            notes: notes,
            createdAt: createdAt
        )
    }
}
