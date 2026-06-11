import Foundation
import FocalsModels

/// Result of `InquiriesCacheRepository.convert` — handed back so the caller
/// can navigate to the new project / client without re-fetching the rows.
public struct InquiryConversionResult: Sendable {
    public let client: Client
    public let project: Project?
    public let inquiry: Inquiry

    public init(client: Client, project: Project?, inquiry: Inquiry) {
        self.client = client
        self.project = project
        self.inquiry = inquiry
    }
}
