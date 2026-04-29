import Foundation

/// Audit record for a single LLM-extracted file upload.
///
/// The original file content is NOT stored — only the metadata and the
/// outcome. Users can see a history of their imports and how many
/// projects each one produced.
public struct ProjectUploadJob: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let filename: String
    public let mimeType: String
    public let sizeBytes: Int
    public let status: String         // pending | extracted | committed | failed
    public let error: String?
    public let extractedCount: Int?
    public let committedCount: Int?
    public let inputTokens: Int?
    public let outputTokens: Int?
    public let createdAt: Date
    public let completedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case filename
        case mimeType = "mime_type"
        case sizeBytes = "size_bytes"
        case status
        case error
        case extractedCount = "extracted_count"
        case committedCount = "committed_count"
        case inputTokens = "input_tokens"
        case outputTokens = "output_tokens"
        case createdAt = "created_at"
        case completedAt = "completed_at"
    }
}
