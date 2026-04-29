# Task 13 — Native-Only Features

## Goal

Layer on the iOS-only capabilities that justify a native app over the responsive web: Home Screen widgets, Siri Shortcuts / App Intents, Live Activities for the next upcoming project, a Share Extension for receiving URLs/text, push notifications wired to a server-side trigger, and Universal Links so `focals-base.vercel.app/...` URLs open the app.

This is the largest task in the plan because it spans **five extension targets** plus a small server-side change in `my-app/`. Each section below describes one piece; they can be done in any order after the parity work in Tasks 06–12 is done.

---

## Section A — WidgetKit

### A.1 — Create the extension target

In Xcode → File → New → Target → Widget Extension. Name: `FocalsWidgets`. Bundle ID: `com.[APP_NAME].ios.widgets`.

Add to:
- The same App Group `group.com.[APP_NAME].ios` as the main app (Step 1 of Task 05)
- Link `FocalsKit` SPM products: `FocalsModels`, `FocalsCache`, `FocalsDesign`

### A.2 — Today's Schedule widget (small + medium)

Reads cached projects filtered to those whose `shoot_date` falls on today.

```swift
import WidgetKit
import SwiftUI
import SwiftData
import FocalsModels
import FocalsCache
import FocalsDesign

struct TodayScheduleEntry: TimelineEntry {
    let date: Date
    let projects: [Project]   // projects with shoot_date in today
}

struct TodayScheduleProvider: TimelineProvider {
    func placeholder(in: Context) -> TodayScheduleEntry {
        TodayScheduleEntry(date: .now, projects: [.preview, .preview])
    }

    func getSnapshot(in: Context, completion: @escaping (TodayScheduleEntry) -> Void) {
        Task { @MainActor in completion(await loadEntry()) }
    }

    func getTimeline(in: Context, completion: @escaping (Timeline<TodayScheduleEntry>) -> Void) {
        Task { @MainActor in
            let entry = await loadEntry()
            // Refresh every 15 minutes; iOS may throttle further
            let next = Calendar.current.date(byAdding: .minute, value: 15, to: .now)!
            completion(Timeline(entries: [entry], policy: .after(next)))
        }
    }

    @MainActor
    private func loadEntry() async -> TodayScheduleEntry {
        guard let userId = SharedAuth.currentUserId() else {
            return TodayScheduleEntry(date: .now, projects: [])
        }
        let context = ModelContext(try! CacheContainer.make(for: userId))
        let allCached = (try? ProjectsCacheRepository.shared.cached(in: context)) ?? []
        let today = allCached.filter { p in
            guard let d = p.shootDate else { return false }
            return Calendar.current.isDateInToday(d)
        }
        return TodayScheduleEntry(date: .now, projects: today)
    }
}

struct TodayScheduleWidgetView: View {
    let entry: TodayScheduleEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:  smallView
        case .systemMedium: mediumView
        default:            smallView
        }
    }

    private var smallView: some View {
        VStack(alignment: .leading) {
            Text("TODAY")
                .font(.tokens.body(10))
                .foregroundStyle(.tokens.textTertiary)
            Text("\(entry.projects.count)")
                .font(.tokens.display(36))
                .foregroundStyle(.tokens.textPrimary)
            Text(entry.projects.count == 1 ? "project" : "projects")
                .font(.tokens.body(13))
                .foregroundStyle(.tokens.textSecondary)
            Spacer()
            if let next = entry.projects
                .sorted(by: { ($0.shootDate ?? .distantFuture) < ($1.shootDate ?? .distantFuture) })
                .first,
               let when = next.shootDate
            {
                Text(next.title).font(.tokens.medium(11)).lineLimit(1)
                Text(when.formatted(.dateTime.hour().minute()))
                    .font(.tokens.body(11)).foregroundStyle(.tokens.textTertiary)
            }
        }
        .containerBackground(Color.tokens.bg, for: .widget)
    }

    private var mediumView: some View { /* project list, up to 3 rows */ }
}

@main
struct FocalsWidgets: WidgetBundle {
    var body: some Widget {
        TodayScheduleWidget()
        RevenueMTDWidget()
    }
}

struct TodayScheduleWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TodaySchedule", provider: TodayScheduleProvider()) {
            TodayScheduleWidgetView(entry: $0)
        }
        .configurationDisplayName("Today's Schedule")
        .description("Your scheduled projects for today.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### A.3 — Revenue MTD widget (small)

Same pattern, reads `CachedFinance` filtered to current month, renders KPI in big editorial type.

### A.4 — `SharedAuth` helper

Widgets can't run the supabase-swift auth flow directly. They need `currentUserId` from a shared App Group `UserDefaults`:

```swift
public enum SharedAuth {
    private static let suiteName = "group.com.[APP_NAME].ios"
    private static let key = "currentUserId"

    public static func currentUserId() -> UUID? {
        let defaults = UserDefaults(suiteName: suiteName)!
        guard let str = defaults.string(forKey: key), let uuid = UUID(uuidString: str) else {
            return nil
        }
        return uuid
    }

    public static func setCurrentUserId(_ id: UUID?) {
        let defaults = UserDefaults(suiteName: suiteName)!
        if let id { defaults.set(id.uuidString, forKey: key) }
        else { defaults.removeObject(forKey: key) }
    }
}
```

In `SessionStore`, call `SharedAuth.setCurrentUserId(user?.id)` whenever auth state changes.

After every cache mutation, call `WidgetCenter.shared.reloadAllTimelines()` so widgets reflect the new state.

---

## Section B — App Intents (Siri / Shortcuts / Spotlight)

### B.1 — Create the extension target

Xcode → File → New → Target → App Intents Extension. Name: `FocalsIntents`. Same App Group + `FocalsKit` deps as widgets.

### B.2 — Intents

`LogExpenseIntent` already drafted in Task 10. Round it out and add three more:

```swift
struct LogMileageIntent: AppIntent {
    static let title: LocalizedStringResource = "Log Mileage"
    @Parameter(title: "Miles") var miles: Double
    @Parameter(title: "Description") var description: String?
    func perform() async throws -> some IntentResult { /* creates expense at IRS rate */ }
}

struct AddInquiryIntent: AppIntent {
    static let title: LocalizedStringResource = "Add Inquiry"
    @Parameter(title: "Name") var name: String
    @Parameter(title: "Email") var email: String?
    @Parameter(title: "Message") var message: String?
    func perform() async throws -> some IntentResult { /* creates inquiry */ }
}

struct OpenTodayScheduleIntent: AppIntent {
    static let title: LocalizedStringResource = "Open Today's Schedule"
    static let openAppWhenRun: Bool = true
    // Deep-links into the project detail if there's exactly one project today,
    // otherwise into the projects list filtered to today's shoot_date.
    func perform() async throws -> some IntentResult { ... }
}
```

### B.3 — Shortcuts donations

In `RootView`, on `.task`, donate the most likely intents:

```swift
import AppIntents

.task {
    AppShortcuts.updateAppShortcutParameters()
}

struct FocalsAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: LogExpenseIntent(), phrases: [
            "Log expense in \(.applicationName)",
            "Add expense to \(.applicationName)"
        ], shortTitle: "Log Expense", systemImageName: "minus.circle")
        AppShortcut(intent: AddInquiryIntent(), phrases: [
            "Add inquiry to \(.applicationName)"
        ], shortTitle: "Add Inquiry", systemImageName: "envelope.badge")
    }
}
```

Spotlight surfaces these intents automatically. Siri voice phrases work after one app run.

---

## Section C — Live Activity (Dynamic Island next-project countdown)

### C.1 — Create the extension target

Xcode → File → New → Target → Widget Extension → ✅ "Include Live Activity". Name: `FocalsLiveActivity`. Bundle ID: `com.[APP_NAME].ios.liveactivity`. Same App Group.

### C.2 — Activity definition

```swift
import ActivityKit
import WidgetKit
import SwiftUI

public struct ProjectCountdownAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var minutesUntilStart: Int
        public var status: String
    }
    public var projectId: String
    public var title: String
    public var clientName: String?
    public var location: String?
    public var shootDate: Date
}

struct ProjectCountdownActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ProjectCountdownAttributes.self) { context in
            // Lock screen
            VStack(alignment: .leading) {
                Text(context.attributes.title).font(.tokens.medium(15))
                if let client = context.attributes.clientName {
                    Text(client).font(.tokens.body(13)).foregroundStyle(.tokens.textSecondary)
                }
                Text("\(context.state.minutesUntilStart) min")
                    .font(.tokens.display(28))
                    .foregroundStyle(.tokens.accent)
            }
            .padding()
            .activityBackgroundTint(Color.tokens.bg)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { Image(systemName: "camera") }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.minutesUntilStart)m").font(.tokens.medium(17))
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.attributes.title).font(.tokens.medium(13))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if let location = context.attributes.location {
                        Label(location, systemImage: "mappin.and.ellipse").font(.tokens.body(12))
                    }
                }
            } compactLeading: {
                Image(systemName: "camera")
            } compactTrailing: {
                Text("\(context.state.minutesUntilStart)m").font(.tokens.medium(13))
            } minimal: {
                Image(systemName: "camera")
            }
            .keylineTint(Color.tokens.accent)
        }
    }
}
```

### C.3 — Activity orchestration

In the main app, `ProjectCountdownActivityManager`:

```swift
import ActivityKit

@MainActor
public final class ProjectCountdownActivityManager {
    public static let shared = ProjectCountdownActivityManager()

    public func startActivityIfNeeded(for project: Project) async {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        guard let start = project.shootDate else { return }
        let minutes = Int(start.timeIntervalSinceNow / 60)
        guard minutes > 0 && minutes <= 240 else { return }   // start 4h before

        // Don't double-start
        if Activity<ProjectCountdownAttributes>.activities.contains(where: { $0.attributes.projectId == project.id.uuidString }) {
            return
        }

        let attrs = ProjectCountdownAttributes(
            projectId: project.id.uuidString,
            title: project.title,
            clientName: nil,
            location: project.location,
            shootDate: start
        )
        let initial = ProjectCountdownAttributes.ContentState(
            minutesUntilStart: minutes,
            status: project.status.rawValue
        )
        do {
            _ = try Activity.request(attributes: attrs, content: .init(state: initial, staleDate: nil))
        } catch {
            // Activities limit per app: 8. Catch + ignore.
        }
    }

    public func updateLoop() async {
        // Run every minute while there's an activity; updates minutesUntilStart
        for activity in Activity<ProjectCountdownAttributes>.activities {
            let minutes = Int(activity.attributes.shootDate.timeIntervalSinceNow / 60)
            if minutes <= 0 {
                await activity.end(
                    .init(state: .init(minutesUntilStart: 0, status: "starting"), staleDate: nil),
                    dismissalPolicy: .after(.now + 600)
                )
            } else {
                await activity.update(
                    .init(state: .init(minutesUntilStart: minutes, status: activity.content.state.status), staleDate: nil)
                )
            }
        }
    }
}
```

Hook into:
- `RootView.task` — start any eligible activities on app launch
- `ProjectsCacheRepository.create/update` — start/update activity for the affected project
- A `Timer.publish(every: 60)` while the app is foregrounded to drive `updateLoop()`
- Background — Live Activities update via push or the `staleDate` mechanism. v1: just rely on app open + push from server (Section E)

`Info.plist`:
```xml
<key>NSSupportsLiveActivities</key>
<true/>
<key>NSSupportsLiveActivitiesFrequentUpdates</key>
<true/>
```

---

## Section D — Share Extension

### D.1 — Create the target

Xcode → File → New → Target → Share Extension. Name: `FocalsShare`. Same App Group + `FocalsKit`.

### D.2 — Use cases

When the user shares from any app, present:
- **URL or text** → "Save as Link" (creates a `links` row)
- **URL** → "Create Inquiry from URL" (extracts metadata, creates `inquiries` row with `source: "shared"`)
- **Image** → "Attach to expense" (creates a draft `finances` row with the image as receipt)

### D.3 — Implementation sketch

```swift
import UIKit
import Social
import UniformTypeIdentifiers

class ShareViewController: SLComposeServiceViewController {
    override func isContentValid() -> Bool { true }

    override func didSelectPost() {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachment = item.attachments?.first else {
            extensionContext?.completeRequest(returningItems: [])
            return
        }

        Task {
            if attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                let url = try await attachment.loadItem(forTypeIdentifier: UTType.url.identifier) as? URL
                await saveLink(url: url, title: contentText)
            } else if attachment.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                // ... handle image
            }
            extensionContext?.completeRequest(returningItems: [])
        }
    }

    @MainActor
    private func saveLink(url: URL?, title: String?) async {
        guard let url, let userId = SharedAuth.currentUserId() else { return }
        let link = Link(
            id: UUID(),
            userId: userId,
            title: title ?? url.host ?? "Shared link",
            url: url.absoluteString,
            category: "shared",
            notes: nil,
            createdAt: .now
        )
        // Use a shared SwiftData context — share extension can't reach the main app
        // Strategy: write to outbox in App Group; main app drains on next launch.
        await OutboxStore.shared.enqueue(.createLink(link))
    }
}
```

`OutboxStore` is a small SwiftData container in the App Group that the main app drains via `OutboxRepository.processAll()` on launch. This is the only "outbox-like" thing in v1 — necessary because the share extension can't run network code reliably (memory limit ~120MB).

---

## Section E — Push Notifications

This section spans iOS + a small server-side change.

### E.1 — APNs setup (Apple Developer)

Document in USER_TODO.md:
1. Apple Developer → Certificates, Identifiers & Profiles → Keys → create APNs Auth Key. Note Key ID + Team ID.
2. Bundle ID `com.[APP_NAME].ios` → Capabilities → Push Notifications enabled
3. Same for `com.[APP_NAME].ios.widgets` (NOT needed unless updating widgets via push)

### E.2 — Main app: register for push

```swift
import UserNotifications

@MainActor
final class PushManager {
    static let shared = PushManager()

    func requestAndRegister() async {
        let center = UNUserNotificationCenter.current()
        let granted = (try? await center.requestAuthorization(options: [.alert, .badge, .sound])) ?? false
        if granted {
            await UIApplication.shared.registerForRemoteNotifications()
        }
    }

    func handleDeviceToken(_ data: Data) async {
        let token = data.map { String(format: "%02x", $0) }.joined()
        // Store on profiles.push_token (NEW COLUMN — schema change needed)
        try? await ProfileRepository.shared.updatePushToken(token)
    }
}
```

### E.3 — Schema change in `my-app/`

Add migration: `profiles.push_token TEXT`. (Single new column; document in USER_TODO.md.)

Update `Profile` Codable struct + repository. Backfill: NULL on existing rows.

### E.4 — Server-side trigger (Supabase Edge Function)

Create `my-app/supabase/functions/send-push/index.ts`:

```ts
// Triggered by webhook on inquiries INSERT and via cron for upcoming projects
import { createClient } from '@supabase/supabase-js'
import { sign } from 'jsonwebtoken'

interface PushPayload {
  type: 'new_inquiry' | 'project_reminder'
  userId: string
  title: string
  body: string
  data: Record<string, string>     // deep-link URL etc.
}

Deno.serve(async (req: Request) => {
  const payload: PushPayload = await req.json()
  const supabase = createClient(/* admin */)

  // Look up push_token
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', payload.userId)
    .single()

  if (!profile?.push_token) return new Response('No token', { status: 200 })

  // APNs JWT auth
  const apnsToken = sign({}, APNS_KEY, {
    algorithm: 'ES256',
    keyid: APNS_KEY_ID,
    issuer: APNS_TEAM_ID,
    expiresIn: '1h',
  })

  await fetch(`https://api.push.apple.com/3/device/${profile.push_token}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${apnsToken}`,
      'apns-topic': 'com.[APP_NAME].ios',
      'apns-push-type': 'alert',
    },
    body: JSON.stringify({
      aps: {
        alert: { title: payload.title, body: payload.body },
        sound: 'default',
        'mutable-content': 1,
      },
      data: payload.data,
    }),
  })

  return new Response('OK')
})
```

### E.5 — Trigger configuration

**Inquiry insert** — Postgres trigger calls the Edge Function:

```sql
create or replace function notify_new_inquiry()
returns trigger as $$
begin
  perform net.http_post(
    'https://oqaqopkcpgmjgswaismm.functions.supabase.co/send-push',
    json_build_object(
      'type', 'new_inquiry',
      'userId', new.user_id,
      'title', 'New inquiry from ' || new.name,
      'body', coalesce(new.message, '(no message)'),
      'data', json_build_object('inquiryId', new.id)
    )::text,
    '{"Content-Type":"application/json"}'::jsonb
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_inquiry_insert
after insert on inquiries
for each row execute function notify_new_inquiry();
```

**Project reminder** — Supabase Cron (pg_cron) at 9pm daily, queries projects where `shoot_date::date = now()::date + interval '1 day' AND status != 'cancelled'` and POSTs one push per project.

### E.6 — Payload schema (document in this task)

```
{
  "aps": { "alert": { "title": ..., "body": ... }, "sound": "default" },
  "data": {
    "type": "new_inquiry" | "project_reminder",
    "inquiryId"?: UUID,
    "projectId"?: UUID
  }
}
```

iOS `UNUserNotificationCenterDelegate` reads `data.type` + ID, deep-links via `DeepLinkRouter`.

---

## Section F — Universal Links

### F.1 — Apple App Site Association

Add `my-app/src/app/.well-known/apple-app-site-association` (no extension! — must be served as `application/json`):

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID.com.[APP_NAME].ios"],
        "components": [
          { "/": "/inquiry/*" },
          { "/": "/upload" },
          { "/": "/project/*" },
          { "/": "/contract/*" }
        ]
      }
    ]
  }
}
```

Add a `next.config.mjs` rewrite or a route handler at `app/.well-known/apple-app-site-association/route.ts` that serves the JSON with `Content-Type: application/json` (no `charset=utf-8` suffix or Apple rejects it).

### F.2 — Associated Domains entitlement

In Xcode → Signing & Capabilities → Associated Domains → add: `applinks:focals-base.vercel.app` (and the custom domain when set).

### F.3 — Handle in app

```swift
.onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
    if let url = activity.webpageURL {
        DeepLinkRouter.shared.resolve(url)
    }
}
```

`DeepLinkRouter.resolve` already handles custom-scheme URLs (Task 04). Add Universal Link parsing: `focals-base.vercel.app/inquiry/{id}` → `Route.inquiryDetail(uuid)`.

---

## Acceptance Criteria

### Widgets
- [ ] Today's Schedule widget appears on home screen with live data (verified with cached fixture data)
- [ ] Revenue MTD widget shows correct number after a finance row mutation + `WidgetCenter.reloadAllTimelines()`
- [ ] Both widgets render correctly in light + dark mode
- [ ] Sign-out wipes the App Group `currentUserId` so widgets show "—" / empty

### App Intents
- [ ] "Log expense" via Siri voice creates a finance row
- [ ] "Add inquiry to [APP_NAME]" via Siri creates an inquiry
- [ ] Shortcuts app shows all four intents
- [ ] Spotlight search for "expense" surfaces "Log Expense" intent

### Live Activity
- [ ] App start with a project whose `shoot_date` is in the next 4 hours starts a Live Activity
- [ ] Activity appears on lock screen and Dynamic Island (iPhone 14 Pro+)
- [ ] Minutes-until counter updates while app is foregrounded
- [ ] Activity ends 10 minutes after `shoot_date`

### Share Extension
- [ ] Sharing a URL from Safari shows "Save as Link" option in share sheet
- [ ] Saving creates a `links` row visible in the main app after relaunch (via outbox)
- [ ] Sharing an image shows "Attach to expense" option
- [ ] Memory usage stays under 100MB (verified in Instruments)

### Push
- [ ] App registers for remote notifications on first launch (after permission grant)
- [ ] Device token persists to `profiles.push_token`
- [ ] Inserting an inquiry via web `/api/inquiry` triggers a push within 5 seconds (verified by Console.app + receiving notification on device)
- [ ] Tapping the notification deep-links to the inquiry detail
- [ ] Daily 9pm cron sends "project tomorrow" reminders for projects scheduled within 24h
- [ ] Notification denied → settings shows option to re-enable; in-app warning explains lost functionality

### Universal Links
- [ ] `https://focals-base.vercel.app/inquiry/<uuid>` from Safari opens the app to that inquiry detail
- [ ] Apple App Site Association serves valid JSON with correct content type (verified with `curl -I`)
- [ ] Same URL on a device without the app falls back to the web app

## Depends on

- 04 (DeepLinkRouter, AppRouter, sheet infrastructure)
- 05 (App Group, SwiftData container shared across targets)
- 06–12 (real data exists for widgets, activities, intents to read)
- A schema migration in `my-app/` (`profiles.push_token`) and a new Supabase Edge Function — document for user in USER_TODO.md
