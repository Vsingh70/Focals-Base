import Testing
import Foundation
@testable import FocalsAPI
@testable import FocalsModels

/// Pins the inbox grouping/filtering helpers used by `InboxScreen`. The
/// status enum and labels must stay in sync with the web's
/// `inquiryStatusEnum` and `InboxClient` filter labels — the parity tests
/// below catch drift early.
struct InquiryGroupingTests {

    private func inquiry(
        name: String = "Sarah",
        email: String? = nil,
        message: String? = nil,
        shootType: String? = nil,
        status: InquiryStatus? = .new,
        createdAt: Date = .now
    ) -> Inquiry {
        Inquiry(
            id: UUID(),
            userId: UUID(),
            name: name,
            email: email,
            phone: nil,
            shootType: shootType,
            preferredDate: nil,
            message: message,
            source: "manual",
            sourceHandle: nil,
            status: status,
            rawPayload: nil,
            convertedClientId: nil,
            convertedProjectId: nil,
            createdAt: createdAt,
            updatedAt: createdAt
        )
    }

    // MARK: - 1. Status display names match web filter labels

    @Test func statusDisplayNamesMatchWebLabels() {
        // Mirrors `filters` in my-app/src/components/inbox/InboxClient.tsx.
        let expected: [(InquiryStatus, String)] = [
            (.new,       "New"),
            (.read,      "Read"),
            (.replied,   "Replied"),
            (.converted, "Converted"),
            (.archived,  "Archived"),
        ]
        for (status, label) in expected {
            #expect(status.displayName == label)
        }
    }

    // MARK: - 2. Filter `.allCases` includes All + every status

    @Test func filterAllCasesContainsEveryStatus() {
        let cases = InquiryFilter.allCases
        #expect(cases.count == InquiryStatus.allCases.count + 1)
        #expect(cases.first == .all)
        let statuses: [InquiryStatus] = cases.compactMap {
            if case .status(let s) = $0 { return s } else { return nil }
        }
        #expect(statuses == InquiryStatus.allCases)
    }

    // MARK: - 3. Grouping puts statuses in canonical order, drops empties

    @Test func groupingIsInCanonicalOrderAndDropsEmpty() {
        let inquiries: [Inquiry] = [
            inquiry(status: .replied),
            inquiry(status: .new),
            inquiry(status: .converted),
            inquiry(status: .new),
        ]
        let groups = inquiries.groupedByStatus()
        let order = groups.map { $0.0 }
        #expect(order == [.new, .replied, .converted])
        #expect(groups.first(where: { $0.0 == .read }) == nil)
        #expect(groups.first(where: { $0.0 == .archived }) == nil)
    }

    // MARK: - 4. Within a group, newest-first sort

    @Test func groupingSortsNewestFirstWithinGroup() {
        let now = Date(timeIntervalSince1970: 1_780_000_000)
        let inquiries: [Inquiry] = [
            inquiry(name: "Old",   status: .new, createdAt: now.addingTimeInterval(-1000)),
            inquiry(name: "Newer", status: .new, createdAt: now),
            inquiry(name: "Mid",   status: .new, createdAt: now.addingTimeInterval(-500)),
        ]
        let groups = inquiries.groupedByStatus()
        let names = groups.first(where: { $0.0 == .new })?.1.map(\.name)
        #expect(names == ["Newer", "Mid", "Old"])
    }

    // MARK: - 5. Nil status falls into `.new` (matches web fallback)

    @Test func nilStatusBucketsAsNew() {
        let groups = [inquiry(status: nil)].groupedByStatus()
        #expect(groups.count == 1)
        #expect(groups.first?.0 == .new)
    }

    // MARK: - 6. Search matches name / email / message / shootType

    @Test func searchMatchesAcrossKeyFields() {
        let inquiries: [Inquiry] = [
            inquiry(name: "Sarah Johnson"),
            inquiry(name: "Mike",  email: "wedding@example.com"),
            inquiry(name: "Alex",  message: "Looking for a wedding photographer"),
            inquiry(name: "Riley", shootType: "Wedding"),
            inquiry(name: "Pat"),
        ]
        let matches = inquiries.matching(search: "wedding")
        // Should hit Mike (email), Alex (message), Riley (shootType) — but not
        // Sarah (no field contains "wedding") or Pat.
        let names = Set(matches.map(\.name))
        #expect(names == ["Mike", "Alex", "Riley"])
    }

    // MARK: - 7. Search is case-insensitive

    @Test func searchIsCaseInsensitive() {
        let inquiries = [inquiry(name: "Sarah JOHNSON")]
        #expect(inquiries.matching(search: "johnson").count == 1)
    }

    // MARK: - 8. Empty needle returns input unchanged

    @Test func emptyNeedleReturnsInputUnchanged() {
        let inquiries: [Inquiry] = [inquiry(name: "A"), inquiry(name: "B")]
        #expect(inquiries.matching(search: "").count == inquiries.count)
    }

    // MARK: - 9. Filter.matches honours `.all` and `.status`

    @Test func filterMatchesByCase() {
        let target = inquiry(status: .replied)
        #expect(InquiryFilter.all.matches(target))
        #expect(InquiryFilter.status(.replied).matches(target))
        #expect(!InquiryFilter.status(.new).matches(target))
    }

    // MARK: - 10. Pill tones map to expected cases

    @Test func pillTonesAreStable() {
        #expect(InquiryStatus.new.pillTone == .accent)
        #expect(InquiryStatus.read.pillTone == .neutral)
        #expect(InquiryStatus.replied.pillTone == .warning)
        #expect(InquiryStatus.converted.pillTone == .success)
        #expect(InquiryStatus.archived.pillTone == .neutral)
    }
}
