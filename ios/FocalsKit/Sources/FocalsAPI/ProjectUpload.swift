import Foundation
import FocalsModels

/// Wire types for `/api/projects/upload` and `/api/projects/upload/commit`.
/// Mirrors the web's `AnnotatedProposedProject` / `UploadResponse` /
/// `CommitProjectRow` shapes verbatim — any drift will surface as a JSON
/// decode failure on iOS.

public struct UploadResponse: Codable, Sendable {
    public let jobId: String
    public let filename: String
    public let projects: [AnnotatedProposedProject]
    public let warnings: [String]
    public let truncated: Bool
}

public struct AnnotatedProposedProject: Codable, Sendable, Identifiable {
    public let rowKey: String
    public var id: String { rowKey }

    public let title: String
    public let clientName: String?
    public let category: String?
    public let status: ProjectStatus?
    public let shootDate: String?
    public let location: String?
    public let packagePrice: Double?
    public let amountPaid: Double?
    public let paymentStatus: PaymentStatus?
    public let notes: String?
    public let sourceExcerpt: String?
    public let clientMatch: ClientMatch

    enum CodingKeys: String, CodingKey {
        case rowKey
        case title
        case clientName = "client_name"
        case category
        case status
        case shootDate = "shoot_date"
        case location
        case packagePrice = "package_price"
        case amountPaid = "amount_paid"
        case paymentStatus = "payment_status"
        case notes
        case sourceExcerpt
        case clientMatch
    }
}

public struct ClientMatch: Codable, Sendable {
    public let kind: Kind
    public let clientId: UUID?
    public let matchedName: String?
    public let score: Double?
    public let candidates: [ScoredCandidate]?
    public let suggestedName: String?

    public enum Kind: String, Codable, Sendable {
        case confident
        case ambiguous
        case none
    }
}

public struct ScoredCandidate: Codable, Sendable, Identifiable {
    public let id: UUID
    public let fullName: String
    public let score: Double
}

/// Commit payload — what iOS sends to `/api/projects/upload/commit`.
public struct CommitProjectRow: Codable, Sendable {
    public let rowKey: String
    public let title: String
    public let category: String?
    public let status: ProjectStatus?
    public let shoot_date: String?
    public let location: String?
    public let package_price: Double?
    public let amount_paid: Double?
    public let payment_status: PaymentStatus?
    public let notes: String?
    public let clientDecision: ClientDecision

    public init(
        rowKey: String,
        title: String,
        category: String?,
        status: ProjectStatus?,
        shoot_date: String?,
        location: String?,
        package_price: Double?,
        amount_paid: Double?,
        payment_status: PaymentStatus?,
        notes: String?,
        clientDecision: ClientDecision
    ) {
        self.rowKey = rowKey
        self.title = title
        self.category = category
        self.status = status
        self.shoot_date = shoot_date
        self.location = location
        self.package_price = package_price
        self.amount_paid = amount_paid
        self.payment_status = payment_status
        self.notes = notes
        self.clientDecision = clientDecision
    }

    public struct ClientDecision: Codable, Sendable {
        public let kind: Kind
        public let clientId: UUID?
        public let full_name: String?
        public let email: String?
        public let phone: String?

        public enum Kind: String, Codable, Sendable {
            case existing, create, none
        }

        public static func existing(_ id: UUID) -> ClientDecision {
            .init(kind: .existing, clientId: id, full_name: nil, email: nil, phone: nil)
        }

        public static func create(fullName: String, email: String? = nil, phone: String? = nil) -> ClientDecision {
            .init(kind: .create, clientId: nil, full_name: fullName, email: email, phone: phone)
        }

        public static let none = ClientDecision(
            kind: .none, clientId: nil, full_name: nil, email: nil, phone: nil
        )
    }
}

public struct CommitProjectError: Codable, Sendable {
    public let rowKey: String
    public let message: String
}

public struct CommitProjectsResult: Codable, Sendable {
    public let jobId: String?
    public let createdProjectCount: Int
    public let createdClientCount: Int
    public let errors: [CommitProjectError]
}
