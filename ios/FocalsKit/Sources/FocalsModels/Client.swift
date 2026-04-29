import Foundation

public struct Client: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let fullName: String
    public let email: String?
    public let phone: String?
    public let notes: String?
    public let source: String?
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case fullName = "full_name"
        case email, phone, notes, source
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
