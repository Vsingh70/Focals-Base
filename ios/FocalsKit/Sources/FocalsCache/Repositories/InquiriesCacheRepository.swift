import Foundation
import SwiftData
import FocalsModels
import FocalsAPI

@MainActor
public struct InquiriesCacheRepository: CacheRepository {
    public typealias Model = Inquiry
    public typealias Cached = CachedInquiry
    public static let shared = InquiriesCacheRepository()

    public func cached(in context: ModelContext) throws -> [Inquiry] {
        var descriptor = FetchDescriptor<CachedInquiry>(
            sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
        )
        descriptor.fetchLimit = 500
        return try context.fetch(descriptor).map { $0.toModel() }
    }

    public func refresh(in context: ModelContext) async throws {
        let page = try await InquiriesRepository.shared.list(.init(limit: 100))
        for inquiry in page.items {
            try upsert(inquiry, in: context)
        }
        try context.save()
    }

    public func create(_ payload: Inquiry, in context: ModelContext) async throws -> Inquiry {
        try requireOnline()
        let saved = try await InquiriesRepository.shared.create(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func update(_ payload: Inquiry, in context: ModelContext) async throws -> Inquiry {
        try requireOnline()
        let saved = try await InquiriesRepository.shared.update(payload)
        try upsert(saved, in: context)
        try context.save()
        return saved
    }

    public func delete(id: UUID, in context: ModelContext) async throws {
        try requireOnline()
        try await InquiriesRepository.shared.delete(id: id)
        try removeFromCache(id: id, in: context)
        try context.save()
    }

    /// Convert an inquiry into a Client (and optionally a Project), mirroring
    /// the web `convertInquiry` server action in
    /// `my-app/src/lib/actions/inquiries.ts`.
    ///
    /// 1) Insert a new client pre-filled from inquiry fields, with
    ///    `source: 'inquiry'` (this is the new client's *source*, not the
    ///    original inquiry source — same as the web).
    /// 2) Optionally insert a project linked to the new client, with status
    ///    `.inquiry`, `category` from `shoot_type`, `shootDate` from
    ///    `preferred_date`, and the inquiry message stashed in `notes`.
    /// 3) Mark the inquiry `.converted` with `converted_client_id` /
    ///    `converted_project_id` populated.
    ///
    /// All three writes go through the standard cache repos so the local
    /// SwiftData store stays in sync; the network calls happen sequentially
    /// because each step depends on the previous one's id. If any step
    /// fails the previously-created rows are left in place — same as the
    /// web action, which doesn't wrap the inserts in a transaction.
    @discardableResult
    public func convert(
        _ inquiry: Inquiry,
        creatingProject: Bool,
        projectTitle: String? = nil,
        in context: ModelContext
    ) async throws -> InquiryConversionResult {
        try requireOnline()

        if inquiry.status == .converted, inquiry.convertedClientId != nil {
            throw FocalsAPIError.unknown(message: "Inquiry already converted")
        }

        // 1) Client
        let clientPayload = Client(
            id: UUID(),
            userId: inquiry.userId,
            fullName: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            notes: nil,
            source: "inquiry",
            createdAt: .now,
            updatedAt: .now
        )
        let savedClient = try await ClientsCacheRepository.shared.create(
            clientPayload,
            in: context
        )

        // 2) Optional project
        var savedProject: Project?
        if creatingProject {
            let title = projectTitle
                ?? inquiry.shootType
                ?? "Project for \(inquiry.name)"
            // preferred_date is YYYY-MM-DD wall-clock; parse as midnight in the
            // user's calendar so the value lines up with how the web stores it
            // (the web inserts the raw string and Postgres anchors it at UTC
            // midnight; here we reach for the same wall-clock value).
            let shootDate = inquiry.preferredDate.flatMap(Self.parsePreferredDate)
            let projectPayload = Project(
                id: UUID(),
                userId: inquiry.userId,
                title: title,
                clientId: savedClient.id,
                category: inquiry.shootType,
                status: .inquiry,
                shootDate: shootDate,
                location: nil,
                packagePrice: nil,
                amountPaid: nil,
                paymentStatus: nil,
                notes: inquiry.message,
                createdAt: .now,
                updatedAt: .now
            )
            savedProject = try await ProjectsCacheRepository.shared.create(
                projectPayload,
                in: context
            )
        }

        // 3) Mark inquiry converted
        let updatedInquiry = Inquiry(
            id: inquiry.id,
            userId: inquiry.userId,
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            shootType: inquiry.shootType,
            preferredDate: inquiry.preferredDate,
            message: inquiry.message,
            source: inquiry.source,
            sourceHandle: inquiry.sourceHandle,
            status: .converted,
            rawPayload: inquiry.rawPayload,
            convertedClientId: savedClient.id,
            convertedProjectId: savedProject?.id,
            createdAt: inquiry.createdAt,
            updatedAt: .now
        )
        let savedInquiry = try await update(updatedInquiry, in: context)

        return InquiryConversionResult(
            client: savedClient,
            project: savedProject,
            inquiry: savedInquiry
        )
    }

    static func parsePreferredDate(_ raw: String) -> Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = .current
        return formatter.date(from: String(raw.prefix(10)))
    }

    private func upsert(_ inquiry: Inquiry, in context: ModelContext) throws {
        let id = inquiry.id
        let descriptor = FetchDescriptor<CachedInquiry>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            existing.applyServer(inquiry)
        } else {
            context.insert(CachedInquiry(from: inquiry))
        }
    }

    private func removeFromCache(id: UUID, in context: ModelContext) throws {
        let descriptor = FetchDescriptor<CachedInquiry>(
            predicate: #Predicate { $0.serverId == id }
        )
        if let existing = try context.fetch(descriptor).first {
            context.delete(existing)
        }
    }
}
