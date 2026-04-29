import Foundation

public struct InquirySource: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let label: String
    public let type: String
    public let isActive: Bool?
    public let config: AnyCodable?
    public let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case label, type
        case isActive = "is_active"
        case config
        case createdAt = "created_at"
    }
}
