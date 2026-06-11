import Foundation
import ActivityKit
import FocalsModels

/// Lifecycle owner for the next-project Live Activity.
///
/// Strategy:
/// - When the app launches or returns to foreground, `refresh()` looks for
///   the next project starting in the next 4 hours and (if not already
///   live) requests an Activity.
/// - A `Timer` ticked from the foreground app drives `tick()` once a minute,
///   updating the displayed `minutesUntilStart` and ending the activity
///   10 minutes after the shoot starts.
/// - Background updates require a push to the activity push token; that's a
///   v1.1 feature once the Live Activity widget extension is wired up.
@MainActor
public final class ProjectCountdownActivityManager {
    public static let shared = ProjectCountdownActivityManager()

    /// Start an activity at most this many minutes before the shoot.
    private static let leadTimeMinutes = 240
    /// End the activity this many minutes after the shoot was scheduled to
    /// start. Gives the user a few minutes after the shoot kicks off to
    /// glance at the lock screen.
    private static let trailingMinutes = 10

    private init() {}

    /// Call from `RootView.task` and after successful project mutations.
    /// Idempotent — picks the project we should be tracking, ends any
    /// activities for projects we're no longer tracking, and updates the
    /// active activity's content state.
    public func refresh(projects: [Project]) async {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let target = Self.upcomingProject(in: projects)

        // End any activity that no longer matches the target.
        for activity in Activity<ProjectCountdownAttributes>.activities {
            if activity.attributes.projectId != target?.id.uuidString {
                await endActivity(activity)
            }
        }

        guard let project = target,
              let shootDate = project.shootDate else { return }

        let minutes = Int(shootDate.timeIntervalSinceNow / 60)
        let stateNow = ProjectCountdownAttributes.ContentState(
            minutesUntilStart: max(0, minutes),
            status: project.status?.rawValue ?? "booked"
        )

        if let activity = Activity<ProjectCountdownAttributes>.activities
            .first(where: { $0.attributes.projectId == project.id.uuidString }) {
            await activity.update(.init(state: stateNow, staleDate: nil))
        } else {
            do {
                _ = try Activity.request(
                    attributes: ProjectCountdownAttributes(
                        projectId: project.id.uuidString,
                        title: project.title,
                        clientName: nil,
                        location: project.location,
                        shootDate: shootDate
                    ),
                    content: .init(state: stateNow, staleDate: nil),
                    pushType: nil
                )
            } catch {
                // Activities limit is 8 per app on iOS 17, plus user-disabled
                // states. Best-effort only.
                #if DEBUG
                print("[ProjectCountdownActivity] request failed: \(error)")
                #endif
            }
        }
    }

    /// Drive once a minute from a foreground Timer to update the visible
    /// counter. End any activity whose shoot has been over for more than
    /// `trailingMinutes`.
    public func tick() async {
        for activity in Activity<ProjectCountdownAttributes>.activities {
            let minutes = Int(activity.attributes.shootDate.timeIntervalSinceNow / 60)
            if minutes < -Self.trailingMinutes {
                await endActivity(activity)
            } else {
                let state = ProjectCountdownAttributes.ContentState(
                    minutesUntilStart: max(0, minutes),
                    status: activity.content.state.status
                )
                await activity.update(.init(state: state, staleDate: nil))
            }
        }
    }

    /// End all active activities. Call on sign-out so the next user doesn't
    /// see the previous user's project on their lock screen.
    public func endAll() async {
        for activity in Activity<ProjectCountdownAttributes>.activities {
            await endActivity(activity)
        }
    }

    private func endActivity(_ activity: Activity<ProjectCountdownAttributes>) async {
        await activity.end(activity.content, dismissalPolicy: .immediate)
    }

    /// Pick the soonest project starting in [now, now + 4h]. Skips projects
    /// without a shoot date and projects already past their shoot time.
    static func upcomingProject(in projects: [Project], now: Date = .now) -> Project? {
        let cutoff = now.addingTimeInterval(TimeInterval(leadTimeMinutes * 60))
        return projects
            .compactMap { project -> (Project, Date)? in
                guard let date = project.shootDate else { return nil }
                guard date >= now, date <= cutoff else { return nil }
                guard project.status != .cancelled else { return nil }
                return (project, date)
            }
            .min(by: { $0.1 < $1.1 })?
            .0
    }
}
