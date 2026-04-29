import Foundation

public struct ContractTemplate: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let name: String
    public let body: String
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name, body
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
