import Foundation
import SwiftData
import FocalsModels

@Model
public final class CachedContract {
    @Attribute(.unique) public var serverId: UUID
    public var userId: UUID
    public var title: String
    public var body: String
    /// `ContractStatus.rawValue`.
    public var status: String?
    public var templateId: UUID?
    public var projectId: UUID?
    public var clientId: UUID?
    /// JSON-encoded `[String: String]?` — round-tripped to avoid SwiftData's
    /// historical Optional-Dictionary edge cases on iOS 17.0.
    public var customFieldsJSON: String?
    public var sentAt: Date?
    public var signedAt: Date?
    public var createdAt: Date
    public var updatedAt: Date
    public var lastSyncedAt: Date

    public init(from model: Contract) {
        self.serverId = model.id
        self.userId = model.userId
        self.title = model.title
        self.body = model.body
        self.status = model.status?.rawValue
        self.templateId = model.templateId
        self.projectId = model.projectId
        self.clientId = model.clientId
        self.customFieldsJSON = Self.encode(model.customFields)
        self.sentAt = model.sentAt
        self.signedAt = model.signedAt
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    public func applyServer(_ model: Contract) {
        self.userId = model.userId
        self.title = model.title
        self.body = model.body
        self.status = model.status?.rawValue
        self.templateId = model.templateId
        self.projectId = model.projectId
        self.clientId = model.clientId
        self.customFieldsJSON = Self.encode(model.customFields)
        self.sentAt = model.sentAt
        self.signedAt = model.signedAt
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    public func toModel() -> Contract {
        Contract(
            id: serverId,
            userId: userId,
            title: title,
            body: body,
            status: status.flatMap { ContractStatus(rawValue: $0) },
            templateId: templateId,
            projectId: projectId,
            clientId: clientId,
            customFields: Self.decode(customFieldsJSON),
            sentAt: sentAt,
            signedAt: signedAt,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }

    private static func encode(_ value: [String: String]?) -> String? {
        guard let value else { return nil }
        guard let data = try? JSONEncoder().encode(value),
              let string = String(data: data, encoding: .utf8) else { return nil }
        return string
    }

    private static func decode(_ string: String?) -> [String: String]? {
        guard let string, let data = string.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode([String: String].self, from: data)
    }
}
