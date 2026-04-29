import Foundation

public struct Contract: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let title: String
    public let body: String
    public let status: ContractStatus?
    public let templateId: UUID?
    public let projectId: UUID?
    public let clientId: UUID?
    public let customFields: [String: String]?
    public let sentAt: Date?
    public let signedAt: Date?
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title, body, status
        case templateId = "template_id"
        case projectId = "project_id"
        case clientId = "client_id"
        case customFields = "custom_fields"
        case sentAt = "sent_at"
        case signedAt = "signed_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
