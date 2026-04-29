import Foundation

public struct Shoot: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let title: String
    public let scheduledAt: Date
    public let durationMinutes: Int?
    public let location: String?
    public let status: ShootStatus?
    public let notes: String?
    public let projectId: UUID?
    public let clientId: UUID?
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title
        case scheduledAt = "scheduled_at"
        case durationMinutes = "duration_minutes"
        case location, status, notes
        case projectId = "project_id"
        case clientId = "client_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
