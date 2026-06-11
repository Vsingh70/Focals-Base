import EventKit
import Foundation
import UIKit
import FocalsAPI
import FocalsCache
import FocalsModels

/// One-way mirror of projects → iOS Calendar.
///
/// Truth lives in Supabase. If the user edits the iOS Calendar event directly,
/// those changes are NOT pushed back. v1.1 plan: detect divergence in
/// `EKEventStoreChanged` notifications and surface a "Push back to Focals?"
/// banner. Until then, bidirectional sync is documented as out-of-scope so
/// users don't lose changes by editing the mirrored event in iOS Calendar.
@MainActor
public final class EventKitMirror: ProjectMutationObserver {
    public static let shared = EventKitMirror()

    public func projectDidUpsert(_ project: Project) async { await mirror(project) }
    public func projectDidDelete(id: UUID) async { await remove(projectId: id) }

    public static let calendarTitle = "Focals"
    /// Default duration when projects don't carry one. Matches `DEFAULT_DURATION_MIN`
    /// in MobileCalendarView and the iCal feed at `/api/calendar/<userId>`.
    public static let defaultDurationMinutes = 60

    private static let enabledKey = "EventKitMirrorEnabled"
    private let store = EKEventStore()

    public enum AccessState: Equatable {
        case notDetermined
        case denied
        case authorized
    }

    private init() {}

    // MARK: - Toggle

    public var isEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: Self.enabledKey) }
        set { UserDefaults.standard.set(newValue, forKey: Self.enabledKey) }
    }

    public var accessState: AccessState {
        let status: EKAuthorizationStatus
        if #available(iOS 17.0, *) {
            status = EKEventStore.authorizationStatus(for: .event)
            switch status {
            case .notDetermined:                       return .notDetermined
            case .denied, .restricted:                 return .denied
            case .fullAccess, .writeOnly, .authorized: return .authorized
            @unknown default:                          return .notDetermined
            }
        } else {
            status = EKEventStore.authorizationStatus(for: .event)
            switch status {
            case .notDetermined:        return .notDetermined
            case .denied, .restricted:  return .denied
            case .authorized:           return .authorized
            @unknown default:           return .notDetermined
            }
        }
    }

    /// Prompt for full access. Returns true on grant; throws on system error.
    /// Caller should consult `accessState` afterwards if false is returned.
    @discardableResult
    public func requestAccess() async throws -> Bool {
        if #available(iOS 17.0, *) {
            return try await store.requestFullAccessToEvents()
        } else {
            return try await withCheckedThrowingContinuation { continuation in
                store.requestAccess(to: .event) { granted, error in
                    if let error {
                        continuation.resume(throwing: error)
                    } else {
                        continuation.resume(returning: granted)
                    }
                }
            }
        }
    }

    // MARK: - Sync API

    /// Idempotent: creates or updates the EventKit event matching `project`.
    /// No-ops when the toggle is off, the project has no shoot date, or the
    /// user hasn't granted access.
    public func mirror(_ project: Project) async {
        guard isEnabled, project.shootDate != nil else { return }
        guard accessState == .authorized else { return }
        do {
            let calendar = try ensureCalendarExists()
            let existing = findEvent(for: project, in: calendar)
            try saveEvent(for: project, into: calendar, existing: existing)
        } catch {
            // Mirror is best-effort; never surface as a project-mutation failure.
            #if DEBUG
            print("[EventKitMirror] mirror failed: \(error)")
            #endif
        }
    }

    /// Idempotent removal. No-op if the event isn't present.
    public func remove(projectId: UUID) async {
        guard isEnabled, accessState == .authorized else { return }
        do {
            let calendar = try ensureCalendarExists()
            if let event = findEvent(forProjectId: projectId, in: calendar) {
                try store.remove(event, span: .thisEvent)
            }
        } catch {
            #if DEBUG
            print("[EventKitMirror] remove failed: \(error)")
            #endif
        }
    }

    /// Re-syncs every supplied project. Useful after the user flips the
    /// mirror toggle on for the first time.
    public func bulkMirror(_ projects: [Project]) async {
        guard isEnabled, accessState == .authorized else { return }
        for project in projects {
            await mirror(project)
        }
    }

    // MARK: - Internals

    private func ensureCalendarExists() throws -> EKCalendar {
        if let existing = store.calendars(for: .event)
            .first(where: { $0.title == Self.calendarTitle }) {
            return existing
        }
        let new = EKCalendar(for: .event, eventStore: store)
        new.title = Self.calendarTitle
        new.cgColor = UIColor(named: "AccentColor")?.cgColor
            ?? UIColor.systemBrown.cgColor
        new.source = preferredSource()
        try store.saveCalendar(new, commit: true)
        return new
    }

    /// Pick a writable source. Prefer iCloud (CalDAV), fall back to local —
    /// using `defaultCalendarForNewEvents.source` would inherit a read-only
    /// subscribed source (e.g. the iCal feed) and the saveCalendar call would
    /// throw immediately.
    private func preferredSource() -> EKSource {
        let sources = store.sources
        if let calDAV = sources.first(where: { $0.sourceType == .calDAV && $0.title.lowercased().contains("icloud") }) {
            return calDAV
        }
        if let calDAV = sources.first(where: { $0.sourceType == .calDAV }) {
            return calDAV
        }
        if let local = sources.first(where: { $0.sourceType == .local }) {
            return local
        }
        return store.defaultCalendarForNewEvents?.source ?? sources[0]
    }

    private func saveEvent(
        for project: Project,
        into calendar: EKCalendar,
        existing: EKEvent?
    ) throws {
        guard let raw = project.shootDate else { return }
        // The web stores wall-clock timestamps; mirror the same wall-clock to
        // the user's iOS Calendar so a project saved as "8:30 AM" appears at
        // 8:30 AM regardless of the device's timezone.
        let start = CalendarMath.wallClockDate(from: raw) ?? raw
        let end = start.addingTimeInterval(TimeInterval(Self.defaultDurationMinutes * 60))

        let event = existing ?? EKEvent(eventStore: store)
        event.calendar = calendar
        event.title = project.title
        event.startDate = start
        event.endDate = end
        event.location = project.location
        event.notes = project.notes
        event.url = Self.eventURL(for: project.id)

        try store.save(event, span: .thisEvent)
    }

    private func findEvent(for project: Project, in calendar: EKCalendar) -> EKEvent? {
        findEvent(forProjectId: project.id, in: calendar)
    }

    private func findEvent(forProjectId id: UUID, in calendar: EKCalendar) -> EKEvent? {
        // Search a wide window (±1 year from now) — enough to cover the
        // 12-month calendar grid without making `events(matching:)` slow.
        let now = Date.now
        let windowStart = now.addingTimeInterval(-365 * 24 * 60 * 60)
        let windowEnd = now.addingTimeInterval(365 * 24 * 60 * 60)
        let predicate = store.predicateForEvents(
            withStart: windowStart,
            end: windowEnd,
            calendars: [calendar]
        )
        let target = Self.eventURL(for: id)
        return store.events(matching: predicate).first(where: { $0.url == target })
    }

    static func eventURL(for projectId: UUID) -> URL? {
        URL(string: "focals://project/\(projectId.uuidString)")
    }
}
