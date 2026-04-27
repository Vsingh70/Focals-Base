# Task 14 — Testing, Accessibility & Release

## Goal

Get the app from "feature-complete" to "shipped on TestFlight, ready for App Store review." Tests, accessibility audit, localization scaffold, telemetry, privacy manifest, App Store Connect setup, screenshots, archive + upload pipeline, App Review submission.

After this task, the user has a TestFlight build distributed to internal testers and the app is either approved or has documented rejection reasons being addressed.

---

## Section A — Tests

### A.1 — Unit tests (`FocalsTests/`)

Required coverage:

| Suite | What it tests |
|---|---|
| `ModelDecodingTests` | All 12 fixture JSON files decode + round-trip (Task 02) |
| `DashboardCalculationsTests` | KPI math matches web for 10+ scenarios (Task 06) |
| `MoneyFormattingTests` | Currency formatting in en-US, en-GB, de-DE locales |
| `StatusEnumTests` | All raw values match DB strings exactly |
| `DeepLinkParsingTests` | `focals://inquiry/{uuid}` and Universal Link variants resolve to correct `Route` |
| `EventKitMirrorTests` | Mock `EKEventStore`, verify create/update/delete logic |
| `CalendarMathTests` | Month-cell generation correct for DST + leap-year edge cases |
| `OfflineMutationTests` | Mutations throw `FocalsAPIError.offline` when `ConnectivityMonitor.isOffline` |
| `CacheRefreshTests` | Delta cursor advances correctly; double-refresh doesn't dupe |

Target: **70% line coverage** of `FocalsKit` package, lower bar acceptable on `Focals` app target (UI is harder to unit-test).

Run via `xcodebuild test`; CI fails on any test failure.

### A.2 — UI tests (`FocalsUITests/`)

Smoke tests, not exhaustive:

1. Launch app → see login → tap "Continue with Apple" → verify Apple Sign In sheet appears
2. Bypass auth in test env (mock `SessionStore`), launch directly to Dashboard → assert KPI cards render
3. Tap Projects tab → assert list shows ≥1 row from fixture data → tap first row → assert detail screen
4. Tap "+" on Projects → assert form sheet appears → fill required fields → tap Save → assert sheet dismisses + new row appears
5. Open Settings → tap Sign out → assert returns to LoginView

Run on iPhone 15 simulator, iOS 17.5.

### A.3 — Snapshot tests (optional but recommended)

If time permits, add `swift-snapshot-testing` for key views:
- `DashboardScreen` with empty state vs. populated
- `MobileCalendarView` parity check vs. saved baseline screenshots from web

---

## Section B — Accessibility

### B.1 — Manual audit checklist

Walk through every screen with:
- ✅ **Dynamic Type** at AX1, AX3, AX5 — text wraps, doesn't truncate, doesn't overflow card edges
- ✅ **VoiceOver** — every interactive element announces correctly (KPI cards: "Revenue MTD, $4,500"; calendar cells: "Tuesday April 14, 2 shoots scheduled")
- ✅ **Reduce Motion** — calendar scroll respects preference; live activities don't pulse
- ✅ **Reduce Transparency** — no glass effects break readability
- ✅ **Color contrast** — `BrandTextSecondary` on `BrandBg` passes WCAG AA (4.5:1) for body text, AAA (7:1) preferred. Verify with [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/) using the actual hex values from `globals.css`.
- ✅ **Bold Text** — system Bold setting renders correctly with custom Inter weights

### B.2 — Code-level fixes

Add explicit accessibility labels to custom views:

```swift
KPICard(label: "Revenue MTD", value: "$4,500")
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("Revenue this month, $4,500")

DayCell(date: date, ...)
    .accessibilityLabel("\(date.formatted(.dateTime.weekday(.wide).month().day())), \(shoots.count) shoots")
    .accessibilityHint("Double-tap to view shoots")
```

---

## Section C — Localization scaffold

v1 is English-only, but **every visible string** goes through `String(localized:)`:

```swift
Text(String(localized: "inbox.empty.title", defaultValue: "No inquiries yet"))
```

Generate `Localizable.xcstrings` (Xcode 15 string catalog format) — Xcode auto-extracts on build. Don't translate yet; just ensure no string is hardcoded.

Audit with: `rg 'Text\("' ios/Focals` — every hit should be either `Text(String(localized: ...))` or a SwiftUI binding (`Text(person.name)`).

---

## Section D — Telemetry (Sentry, opt-in)

Add Sentry SPM dep. Initialize **only if** the user opts in via Settings → "Send crash reports":

```swift
import Sentry

@MainActor
func setupSentryIfOptedIn() {
    guard UserDefaults.standard.bool(forKey: "SentryOptIn") else { return }
    SentrySDK.start { options in
        options.dsn = "https://...@sentry.io/..."
        options.tracesSampleRate = 0.1
        options.attachScreenshot = false       // privacy: never
        options.attachViewHierarchy = false
        options.beforeSend = { event in
            // Strip any user PII from breadcrumbs
            event.user?.email = nil
            return event
        }
    }
}
```

Settings toggle calls `setupSentryIfOptedIn()` on flip-on, `SentrySDK.close()` on flip-off.

Default OFF. Document in privacy policy.

---

## Section E — Privacy manifest

iOS 17 requires `PrivacyInfo.xcprivacy` for SDKs that touch privacy-sensitive APIs. Create at `ios/Focals/PrivacyInfo.xcprivacy`:

```xml
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeName</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <!-- ...email, phone, photos (only if attached to an expense), contacts (only when user explicitly links) -->
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>C617.1</string></array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>CA92.1</string></array>
    </dict>
  </array>
</dict>
</plist>
```

Verify each third-party SDK (supabase-swift, Kingfisher, MarkdownUI, Sentry) ships its own bundled `PrivacyInfo.xcprivacy`. If not, document the omission and consider replacing the SDK or pinging the maintainer.

---

## Section F — App Store Connect setup

### F.1 — App record

1. App Store Connect → My Apps → `+` → New App
2. Bundle ID: `com.[APP_NAME].ios`
3. SKU: `[APP_NAME]-ios-1`
4. User Access: Limited (just yourself for v1)
5. Primary category: Productivity (or Photo & Video — depends on positioning)

### F.2 — App Privacy declarations

In App Store Connect → App → App Privacy:

| Data Type | Linked to user? | Used for tracking? | Purposes |
|---|---|---|---|
| Name | Yes | No | App functionality |
| Email | Yes | No | App functionality |
| Phone | Yes | No | App functionality |
| Photos (receipts) | Yes | No | App functionality |
| Calendar events (mirror) | Yes | No | App functionality |
| Contacts (link to system) | Yes | No | App functionality |
| Crash data (Sentry, opt-in) | No | No | Diagnostics |
| Identifiers (push token) | Yes | No | App functionality |

### F.3 — Required capabilities (Xcode → Signing & Capabilities)

- App Groups: `group.com.[APP_NAME].ios`
- Push Notifications
- Sign in with Apple
- Associated Domains: `applinks:focals-base.vercel.app`
- Background Modes: `remote-notification`
- iCloud → CloudKit: **NOT enabled** (we use Supabase, not CloudKit)

### F.4 — Screenshots

Required sizes for App Store:
- iPhone 6.7" (15 Pro Max): 1290×2796
- iPhone 6.5" (11 Pro Max): 1284×2778 (or 1242×2688)
- iPad 12.9" (M2): 2048×2732

Recommended set (5–10 screenshots):
1. Dashboard (Today, KPIs)
2. Inbox with several inquiries grouped by status
3. Calendar (stacked month view, with detail panel)
4. Project detail showing payment progress + linked shoots
5. Contracts list with PDF preview behind it
6. iPad: split-view with Sidebar + Calendar
7. Live Activity on lock screen
8. Widget on home screen
9. Settings showing inquiry sources + EventKit toggle

Generate via simulator screenshots + Figma overlays for marketing copy.

### F.5 — App description, keywords, support URL

Draft in `tasks/ios/STORE_LISTING.md` (created during this task — not in plan above). Include:
- Subtitle (30 chars)
- Description (4000 chars)
- Keywords (100 chars, comma-separated)
- Support URL: `https://focals-base.vercel.app/help`
- Marketing URL: `https://focals-base.vercel.app`
- Privacy policy URL: `https://focals-base.vercel.app/privacy` (add this page to web — small TODO)

---

## Section G — Archive + TestFlight

### G.1 — Archive script

`ios/bin/archive.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(plutil -extract CFBundleShortVersionString raw Focals/Info.plist)
BUILD=$(plutil -extract CFBundleVersion raw Focals/Info.plist)

xcodebuild \
  -project Focals.xcodeproj \
  -scheme Focals \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "build/Focals-${VERSION}-${BUILD}.xcarchive" \
  archive

xcodebuild \
  -exportArchive \
  -archivePath "build/Focals-${VERSION}-${BUILD}.xcarchive" \
  -exportOptionsPlist bin/ExportOptions.plist \
  -exportPath "build/Focals-${VERSION}-${BUILD}" \
  -allowProvisioningUpdates
```

`bin/ExportOptions.plist` — distribution method `app-store-connect`, signing automatic.

### G.2 — Upload

```bash
xcrun altool --upload-app \
  -f "build/Focals-${VERSION}-${BUILD}/Focals.ipa" \
  -t ios \
  -u "$APPLE_ID_EMAIL" \
  -p "@keychain:AC_PASSWORD"
```

Or use Transporter.app for first upload (UI confirms everything).

### G.3 — TestFlight

After upload + processing:
1. App Store Connect → TestFlight → select build
2. Add export compliance: encryption used? — only HTTPS standard, no custom crypto → "No"
3. Internal testing: add yourself + 1–2 trusted users
4. Submit a build to TestFlight beta review (24–48h turnaround for first build)
5. Distribute build link

---

## Section H — Pre-submission checklist

Before pressing "Submit for Review":

- [ ] All acceptance criteria from Tasks 01–13 still pass on the latest build
- [ ] Test suite green: `bin/test.sh` exits 0
- [ ] Manual smoke test on physical iPhone + iPad
- [ ] Sign in with both Apple AND Google works
- [ ] Sign out wipes everything
- [ ] Push notifications received on physical device
- [ ] Widgets render with real data
- [ ] EventKit mirror tested with real Calendar
- [ ] PencilKit signature flow on iPad with real Pencil
- [ ] All in-app purchases / subscriptions: NONE in v1 — confirm with App Review notes
- [ ] All required Info.plist usage descriptions present and human-readable
- [ ] Privacy manifest valid (Xcode warning panel clean)
- [ ] App Store screenshots uploaded for both iPhone and iPad
- [ ] App description, keywords, support URL filled in
- [ ] App Privacy declarations match actual data collection
- [ ] Build is **release** configuration with `-O` optimization, not Debug
- [ ] Sentry DSN is for production project (not your dev project)
- [ ] No `print` / `os_log` of secrets in any committed code
- [ ] `Secrets.xcconfig` is gitignored (`git check-ignore` passes)
- [ ] Version bumped to `1.0.0`, build to `1`

---

## Section I — Submit for Review

1. App Store Connect → My Apps → [APP_NAME] → 1.0 Prepare for Submission
2. Select TestFlight build
3. Review notes: provide a demo account or note "OAuth required — please use the Sign in with Apple flow with any Apple ID"
4. Submit
5. Average review time: 24–48 hours for first submission
6. If rejected, document reasons in USER_TODO.md, fix, resubmit

---

## Acceptance Criteria

- [ ] `bin/test.sh` passes with ≥70% coverage on `FocalsKit`
- [ ] All 5 UI test smoke flows pass on iPhone 15 simulator
- [ ] Accessibility audit checklist completed for every module screen
- [ ] All visible strings extracted to `Localizable.xcstrings`
- [ ] Sentry initialization is opt-in via Settings; default OFF
- [ ] `PrivacyInfo.xcprivacy` validates without warnings in Xcode
- [ ] App Store Connect record created with correct bundle ID
- [ ] All capabilities enabled (App Groups, Push, Sign in with Apple, Associated Domains, Background Modes)
- [ ] All 8 App Privacy data types declared accurately
- [ ] Screenshots uploaded for iPhone 6.7" + iPad 12.9"
- [ ] `bin/archive.sh` produces a signed `.ipa` ready for upload
- [ ] TestFlight build distributed to ≥1 internal tester (yourself counts)
- [ ] Internal tester can install + sign in + complete a basic happy path
- [ ] Submission to App Review either accepted, OR rejection reasons documented + addressed in a v1.0.1 build

## Depends on

- All previous tasks (01–13). This task ships what they built.
