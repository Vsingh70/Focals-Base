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

    public init(
        id: UUID,
        userId: UUID,
        name: String,
        email: String?,
        phone: String?,
        shootType: String?,
        preferredDate: String?,
        message: String?,
        source: String,
        sourceHandle: String?,
        status: InquiryStatus?,
        rawPayload: AnyCodable?,
        convertedClientId: UUID?,
        convertedProjectId: UUID?,
        createdAt: Date,
        updatedAt: Date
    ) {
        self.id = id
        self.userId = userId
        self.name = name
        self.email = email
        self.phone = phone
        self.shootType = shootType
        self.preferredDate = preferredDate
        self.message = message
        self.source = source
        self.sourceHandle = sourceHandle
        self.status = status
        self.rawPayload = rawPayload
        self.convertedClientId = convertedClientId
        self.convertedProjectId = convertedProjectId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

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
