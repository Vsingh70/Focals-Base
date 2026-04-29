import Foundation

public struct Profile: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let fullName: String?
    public let email: String?
    public let avatarUrl: String?
    public let businessName: String?
    public let website: String?
    public let instagramHandle: String?
    public let calendarToken: String
    public let tutorialProgress: TutorialProgress
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case fullName = "full_name"
        case email
        case avatarUrl = "avatar_url"
        case businessName = "business_name"
        case website
        case instagramHandle = "instagram_handle"
        case calendarToken = "calendar_token"
        case tutorialProgress = "tutorial_progress"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

public struct TutorialProgress: Codable, Hashable, Sendable {
    public let completedSteps: [String]?
    public let dismissed: Bool?

    public init(completedSteps: [String]? = nil, dismissed: Bool? = nil) {
        self.completedSteps = completedSteps
        self.dismissed = dismissed
    }

    enum CodingKeys: String, CodingKey {
        case completedSteps = "completed_steps"
        case dismissed
    }
}
