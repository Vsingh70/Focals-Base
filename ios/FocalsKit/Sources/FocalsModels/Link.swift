import Foundation

public struct Link: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let title: String
    public let url: String
    public let category: String?
    public let notes: String?
    public let createdAt: Date

    public init(
        id: UUID,
        userId: UUID,
        title: String,
        url: String,
        category: String?,
        notes: String?,
        createdAt: Date
    ) {
        self.id = id
        self.userId = userId
        self.title = title
        self.url = url
        self.category = category
        self.notes = notes
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title, url, category, notes
        case createdAt = "created_at"
    }
}
