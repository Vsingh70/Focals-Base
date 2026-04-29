import Foundation

public struct Form: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let name: String
    public let fields: [FormField]
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name, fields
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

public struct FormField: Codable, Hashable, Sendable {
    public let id: String
    public let label: String
    public let type: FormFieldType
    public let required: Bool?
    public let hoverPreview: Bool?

    enum CodingKeys: String, CodingKey {
        case id, label, type, required
        case hoverPreview = "hover_preview"
    }
}
