import Foundation
import ActivityKit

/// `ActivityAttributes` for the next-project Live Activity. Lives in the
/// main app target *and* the Live Activity widget extension target — same
/// type, same Codable shape, exchanged between processes via ActivityKit.
///
/// The widget extension target hasn't been created yet (see USER_TODO).
/// Until it is, the manager will still call `Activity.request(...)` and
/// the system will silently drop it. Wiring the extension is the only
/// missing piece for the activity to actually render.
public struct ProjectCountdownAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable, Sendable {
        public var minutesUntilStart: Int
        public var status: String

        public init(minutesUntilStart: Int, status: String) {
            self.minutesUntilStart = minutesUntilStart
            self.status = status
        }
    }

    public var projectId: String
    public var title: String
    public var clientName: String?
    public var location: String?
    public var shootDate: Date

    public init(
        projectId: String,
        title: String,
        clientName: String?,
        location: String?,
        shootDate: Date
    ) {
        self.projectId = projectId
        self.title = title
        self.clientName = clientName
        self.location = location
        self.shootDate = shootDate
    }
}
