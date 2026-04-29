import Foundation

public struct Link: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let title: String
    public let url: String
    public let category: String?
    public let notes: String?
    public let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title, url, category, notes
        case createdAt = "created_at"
    }
}
