import Foundation

/// Per-user encrypted API key for an external LLM provider.
///
/// IMPORTANT: the underlying `encrypted_key` column is `bytea` and lives only
/// on the server. The iOS client never reads or writes it. We surface only
/// the fields the client legitimately needs — provider, masked hint, and
/// last-used timestamp — by listing them in the Codable contract.
public struct UserIntegration: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let provider: String       // "anthropic" today, "openai" later
    public let keyHint: String        // e.g. "sk-ant-…XYZ"
    public let isActive: Bool
    public let lastUsedAt: Date?
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case provider
        case keyHint = "key_hint"
        case isActive = "is_active"
        case lastUsedAt = "last_used_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
