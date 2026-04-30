import Foundation
import SwiftData
import FocalsModels

@Model
public final class CachedInquiry {
    @Attribute(.unique) public var serverId: UUID
    public var userId: UUID
    public var name: String
    public var email: String?
    public var phone: String?
    public var shootType: String?
    public var preferredDate: String?
    public var message: String?
    public var source: String
    public var sourceHandle: String?
    /// `InquiryStatus.rawValue`.
    public var status: String?
    /// JSON-encoded `AnyCodable`. SwiftData has no native union type, so the
    /// raw_payload column round-trips through JSONEncoder/Decoder.supabase.
    /// nil when the server row is null.
    public var rawPayloadJSON: String?
    public var convertedClientId: UUID?
    public var convertedProjectId: UUID?
    public var createdAt: Date
    public var updatedAt: Date
    public var lastSyncedAt: Date

    public init(from model: Inquiry) {
        self.serverId = model.id
        self.userId = model.userId
        self.name = model.name
        self.email = model.email
        self.phone = model.phone
        self.shootType = model.shootType
        self.preferredDate = model.preferredDate
        self.message = model.message
        self.source = model.source
        self.sourceHandle = model.sourceHandle
        self.status = model.status?.rawValue
        self.rawPayloadJSON = Self.encode(model.rawPayload)
        self.convertedClientId = model.convertedClientId
        self.convertedProjectId = model.convertedProjectId
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    public func applyServer(_ model: Inquiry) {
        self.userId = model.userId
        self.name = model.name
        self.email = model.email
        self.phone = model.phone
        self.shootType = model.shootType
        self.preferredDate = model.preferredDate
        self.message = model.message
        self.source = model.source
        self.sourceHandle = model.sourceHandle
        self.status = model.status?.rawValue
        self.rawPayloadJSON = Self.encode(model.rawPayload)
        self.convertedClientId = model.convertedClientId
        self.convertedProjectId = model.convertedProjectId
        self.createdAt = model.createdAt
        self.updatedAt = model.updatedAt
        self.lastSyncedAt = .now
    }

    public func toModel() -> Inquiry {
        Inquiry(
            id: serverId,
            userId: userId,
            name: name,
            email: email,
            phone: phone,
            shootType: shootType,
            preferredDate: preferredDate,
            message: message,
            source: source,
            sourceHandle: sourceHandle,
            status: status.flatMap { InquiryStatus(rawValue: $0) },
            rawPayload: Self.decode(rawPayloadJSON),
            convertedClientId: convertedClientId,
            convertedProjectId: convertedProjectId,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }

    private static func encode(_ value: AnyCodable?) -> String? {
        guard let value else { return nil }
        guard let data = try? JSONEncoder.supabase.encode(value),
              let string = String(data: data, encoding: .utf8) else { return nil }
        return string
    }

    private static func decode(_ string: String?) -> AnyCodable? {
        guard let string, let data = string.data(using: .utf8) else { return nil }
        return try? JSONDecoder.supabase.decode(AnyCodable.self, from: data)
    }
}
