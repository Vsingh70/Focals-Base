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

    public init(
        id: UUID,
        userId: UUID,
        fullName: String,
        email: String?,
        phone: String?,
        notes: String?,
        source: String?,
        createdAt: Date,
        updatedAt: Date
    ) {
        self.id = id
        self.userId = userId
        self.fullName = fullName
        self.email = email
        self.phone = phone
        self.notes = notes
        self.source = source
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case fullName = "full_name"
        case email, phone, notes, source
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
