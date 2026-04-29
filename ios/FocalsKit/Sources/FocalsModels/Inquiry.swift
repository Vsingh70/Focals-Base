import Foundation

public struct Inquiry: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let name: String
    public let email: String?
    public let phone: String?
    public let shootType: String?
    public let preferredDate: String?
    public let message: String?
    public let source: String
    public let sourceHandle: String?
    public let status: InquiryStatus?
    public let rawPayload: AnyCodable?
    public let convertedClientId: UUID?
    public let convertedProjectId: UUID?
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name, email, phone
        case shootType = "shoot_type"
        case preferredDate = "preferred_date"
        case message, source
        case sourceHandle = "source_handle"
        case status
        case rawPayload = "raw_payload"
        case convertedClientId = "converted_client_id"
        case convertedProjectId = "converted_project_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
