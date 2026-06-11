import Foundation
import FocalsModels

/// Filter values rendered as the inbox's chip row. `all` is a UI-only
/// pseudo-filter; the rest map 1:1 to `InquiryStatus` rawValues.
public enum InquiryFilter: Hashable, Sendable, CaseIterable {
    case all
    case status(InquiryStatus)

    public static var allCases: [InquiryFilter] {
        [.all] + InquiryStatus.allCases.map { .status($0) }
    }

    public var label: String {
        switch self {
        case .all:                return "All"
        case .status(let status): return status.displayName
        }
    }

    public func matches(_ inquiry: Inquiry) -> Bool {
        switch self {
        case .all:                return true
        case .status(let status): return inquiry.status == status
        }
    }
}

public extension Array where Element == Inquiry {
    /// Group inquiries by status in canonical order (`InquiryStatus.allCases`).
    /// Empty groups are dropped, and within each group the most-recent inquiry
    /// is first. Inquiries with a nil status (legacy rows) are bucketed into
    /// `.new` to match the web's `inq.status ?? 'new'` fallback in InboxClient.
    func groupedByStatus() -> [(InquiryStatus, [Inquiry])] {
        InquiryStatus.allCases.compactMap { status -> (InquiryStatus, [Inquiry])? in
            let items = filter { ($0.status ?? .new) == status }
                .sorted { $0.createdAt > $1.createdAt }
            return items.isEmpty ? nil : (status, items)
        }
    }

    /// Substring-match across name / email / message. Empty needle returns
    /// the original array unchanged.
    func matching(search needle: String) -> [Inquiry] {
        guard !needle.isEmpty else { return self }
        return filter { inquiry in
            inquiry.name.localizedCaseInsensitiveContains(needle)
                || (inquiry.email ?? "").localizedCaseInsensitiveContains(needle)
                || (inquiry.message ?? "").localizedCaseInsensitiveContains(needle)
                || (inquiry.shootType ?? "").localizedCaseInsensitiveContains(needle)
        }
    }
}

public extension InquiryStatus {
    /// Cosmetic tone for status pills shown next to inquiry rows.
    var pillTone: InquiryStatusTone {
        switch self {
        case .new:       return .accent
        case .read:      return .neutral
        case .replied:   return .warning
        case .converted: return .success
        case .archived:  return .neutral
        }
    }
}

/// Shadow of `StatusPill.Tone` so FocalsAPI doesn't depend on the app target.
/// The view layer maps each case to the real `StatusPill.Tone`.
public enum InquiryStatusTone: Sendable {
    case accent, success, warning, neutral
}
