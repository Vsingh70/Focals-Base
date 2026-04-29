# Task 01 — Project Setup, Folder Structure & Design Tokens

## Goal

Bootstrap the Xcode project, folder layout, design-token system, signing, and a CI-ready build. After this task, the app launches to a blank screen on simulator and the design-token gallery preview renders. Nothing else works yet — but the foundation is in place for every later task.

---

## Step 1 — Xcode project

1. Create directory: `/Users/vs/Desktop/Code/personal/Focals-Base/ios/`.
2. In Xcode: **File → New → Project → iOS → App**:
   - Product Name: `Focals`
   - Team: <your Apple Developer team>
   - Organization Identifier: `com.[APP_NAME]`
   - Bundle Identifier: `com.[APP_NAME].ios`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **None** (we add SwiftData manually in Task 05)
   - Include Tests: ✅
3. Save into `/Users/vs/Desktop/Code/personal/Focals-Base/ios/`. Resulting layout:
   ```
   ios/
   ├── Focals.xcodeproj
   ├── Focals/
   │   ├── FocalsApp.swift
   │   ├── ContentView.swift           ← delete in Step 4
   │   └── Assets.xcassets
   ├── FocalsTests/
   └── FocalsUITests/
   ```
4. Set **Deployment Target** to **iOS 17.0** under Project → General → Minimum Deployments.
5. Under Project → Signing & Capabilities, set Team and verify automatic signing works for the iPhone 15 simulator.

## Step 2 — Folder layout

Inside `ios/Focals/`, create groups (right-click → New Group) matching:

```
ios/Focals/
├── App/                   # FocalsApp.swift, RootView.swift, AppRouter.swift
├── Design/                # Color+Tokens, Font+Tokens, Spacing, Radius, ViewModifiers
├── Auth/                  # (filled in Task 03)
├── Navigation/            # (filled in Task 04)
├── Modules/               # (filled in Tasks 06–12, 15)
│   ├── Dashboard/
│   ├── Inbox/
│   ├── Calendar/
│   ├── Projects/
│   ├── Clients/
│   ├── Finances/
│   ├── Contracts/
│   ├── Gear/
│   ├── Forms/
│   ├── Links/
│   ├── Help/
│   ├── Settings/
│   └── LLM/               # File-upload review pane (Task 15)
├── Shared/                # BottomSheet, EmptyState, KPICard, FormFields, StatusPill (Task 04)
└── Resources/
    ├── Assets.xcassets    # already exists
    ├── Localizable.xcstrings
    └── Fonts/             # custom font files (Task 01 Step 6)
```

Move `FocalsApp.swift` into `App/`. Delete the auto-generated `ContentView.swift` (we replace with `RootView.swift` in Step 4).

## Step 3 — Local SPM package: `FocalsKit`

Create at `ios/FocalsKit/` with this `Package.swift`:

```swift
// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "FocalsKit",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "FocalsModels", targets: ["FocalsModels"]),
        .library(name: "FocalsAPI",    targets: ["FocalsAPI"]),
        .library(name: "FocalsCache",  targets: ["FocalsCache"]),
        .library(name: "FocalsDesign", targets: ["FocalsDesign"]),
    ],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
    ],
    targets: [
        .target(name: "FocalsModels"),
        .target(name: "FocalsAPI",    dependencies: ["FocalsModels", .product(name: "Supabase", package: "supabase-swift")]),
        .target(name: "FocalsCache",  dependencies: ["FocalsModels", "FocalsAPI"]),
        .target(name: "FocalsDesign"),
    ]
)
```

Add the local package to the app target: **File → Add Package Dependencies → Add Local → select `ios/FocalsKit/`**. Add all four products to the `Focals` target.

## Step 4 — App entry point

Replace `FocalsApp.swift`:

```swift
import SwiftUI
import FocalsDesign

@main
struct FocalsApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark)        // editorial dark-first
                .tint(.tokens.accent)                // global accent
        }
    }
}
```

Create `App/RootView.swift`:

```swift
import SwiftUI
import FocalsDesign

struct RootView: View {
    var body: some View {
        // Replaced with auth-gated shell in Task 03/04
        DesignTokenGallery()
    }
}
```

## Step 5 — Remote SPM dependencies

Add via **File → Add Package Dependencies**:

| Package | Min version | Used in |
|---|---|---|
| `https://github.com/supabase/supabase-swift` | 2.0.0 | `FocalsAPI` (already declared in `FocalsKit/Package.swift`) |
| `https://github.com/onevcat/Kingfisher` | 7.10.0 | App target — avatar caching |
| `https://github.com/gonzalezreal/swift-markdown-ui` | 2.3.0 | App target — help docs (Task 12) |

Don't add Sentry yet — that comes in Task 14.

## Step 6 — Custom fonts

1. Download Inter (`Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`) from https://fonts.google.com/specimen/Inter.
2. Place in `ios/Focals/Resources/Fonts/`.
3. Add to Xcode target (drag in, ensure "Copy items if needed" + Focals target membership).
4. In `Info.plist`, add `UIAppFonts` array with each filename.
5. Display face: per Open Item #2 in master prompt, this depends on web brand font licensing. For now, fall back to `.serif` system face for `editorialHeadline()`. Replace once licensing confirmed.

## Step 7 — Asset catalog: brand colors

In `Assets.xcassets`, create a Color Set for each web token. Open [my-app/src/app/globals.css](../../my-app/src/app/globals.css) and copy the `:root` block values exactly:

| Color Set name | Dark (`Any Appearance`) | Light (`Light` variant) |
|---|---|---|
| `BrandBg` | `--color-bg` | `--color-bg` light override |
| `BrandBgSecondary` | `--color-bg-secondary` | … |
| `BrandBgTertiary` | `--color-bg-tertiary` | … |
| `BrandBorder` | `--color-border` | … |
| `BrandBorderSecondary` | `--color-border-secondary` | … |
| `BrandTextPrimary` | `--color-text-primary` | … |
| `BrandTextSecondary` | `--color-text-secondary` | … |
| `BrandTextTertiary` | `--color-text-tertiary` | … |
| `BrandAccent` | `--color-accent` | … |
| `BrandAccentMuted` | `--color-accent-muted` | … |
| `BrandSuccess` | `--color-success` | … |
| `BrandWarning` | `--color-warning` | … |
| `BrandDanger` | `--color-danger` | … |

App icon: placeholder geometric mark for now — replace before TestFlight (Task 14).

Set `AccentColor` asset to match `BrandAccent`.

## Step 8 — Design token module

Create `ios/FocalsKit/Sources/FocalsDesign/` files:

**`Color+Tokens.swift`:**

```swift
import SwiftUI

public extension Color {
    enum Tokens {
        public static let bg               = Color("BrandBg",               bundle: .module)
        public static let bgSecondary      = Color("BrandBgSecondary",      bundle: .module)
        public static let bgTertiary       = Color("BrandBgTertiary",       bundle: .module)
        public static let border           = Color("BrandBorder",           bundle: .module)
        public static let borderSecondary  = Color("BrandBorderSecondary",  bundle: .module)
        public static let textPrimary      = Color("BrandTextPrimary",      bundle: .module)
        public static let textSecondary    = Color("BrandTextSecondary",    bundle: .module)
        public static let textTertiary     = Color("BrandTextTertiary",     bundle: .module)
        public static let accent           = Color("BrandAccent",           bundle: .module)
        public static let accentMuted      = Color("BrandAccentMuted",      bundle: .module)
        public static let success          = Color("BrandSuccess",          bundle: .module)
        public static let warning          = Color("BrandWarning",          bundle: .module)
        public static let danger           = Color("BrandDanger",           bundle: .module)
    }
    static let tokens = Tokens.self
}
```

The colors live in the **app** asset catalog, not the package. Either: (a) ship a tiny resource bundle with the package containing the same color set, or (b) re-declare these colors as Swift literals in `FocalsDesign` for use in widgets. Recommended: (a) — use `.process("Resources")` on the target.

**`Font+Tokens.swift`:**

```swift
import SwiftUI

public extension Font {
    enum Tokens {
        public static func body(_ size: CGFloat = 15) -> Font {
            .custom("Inter-Regular", size: size)
        }
        public static func medium(_ size: CGFloat = 15) -> Font {
            .custom("Inter-Medium", size: size)
        }
        public static func semibold(_ size: CGFloat = 15) -> Font {
            .custom("Inter-SemiBold", size: size)
        }
        public static func display(_ size: CGFloat = 24) -> Font {
            // TODO: replace with brand display face once licensed
            .system(size: size, weight: .medium, design: .serif)
        }
    }
    static let tokens = Tokens.self
}
```

**`Spacing.swift`:**

```swift
public enum Spacing {
    public static let xs:  CGFloat = 4
    public static let sm:  CGFloat = 8
    public static let md:  CGFloat = 16
    public static let lg:  CGFloat = 24
    public static let xl:  CGFloat = 32
    public static let xxl: CGFloat = 48
}
```

**`Radius.swift`:**

```swift
public enum Radius {
    public static let sm: CGFloat = 4
    public static let md: CGFloat = 8
    public static let lg: CGFloat = 12
}
```

**`ViewModifiers.swift`:**

```swift
import SwiftUI

public extension View {
    func cardStyle() -> some View {
        self
            .padding(Spacing.md)
            .background(Color.tokens.bgSecondary)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.md)
                    .stroke(Color.tokens.border, lineWidth: 0.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: Radius.md))
    }

    func editorialHeadline() -> some View {
        self
            .font(.tokens.display(28))
            .foregroundStyle(Color.tokens.textPrimary)
            .tracking(-0.4)
    }
}

public struct StatusPill: View {
    public enum Tone { case accent, success, warning, danger, neutral }
    let text: String
    let tone: Tone
    public init(_ text: String, tone: Tone) {
        self.text = text
        self.tone = tone
    }
    public var body: some View {
        Text(text)
            .font(.tokens.medium(11))
            .textCase(.uppercase)
            .tracking(0.6)
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, Spacing.xs / 2)
            .foregroundStyle(foreground)
            .background(background)
            .clipShape(RoundedRectangle(cornerRadius: Radius.sm))
    }
    private var foreground: Color {
        switch tone {
        case .accent:  return .tokens.accent
        case .success: return .tokens.success
        case .warning: return .tokens.warning
        case .danger:  return .tokens.danger
        case .neutral: return .tokens.textTertiary
        }
    }
    private var background: Color {
        foreground.opacity(0.12)
    }
}
```

## Step 9 — Design token gallery (preview only, deleted later)

Create `App/DesignTokenGallery.swift` as a debug-only preview screen that shows all colors, typography, spacing, and the `StatusPill` in all tones. This is the smoke test for Task 01: when the app launches, you see a beautiful editorial gallery instead of "Hello, World!" Replaced in Task 04 by the real shell.

## Step 10 — Secrets management

Create `ios/Focals/Secrets.xcconfig` (gitignored):

```
SUPABASE_URL = https:/$()/oqaqopkcpgmjgswaismm.supabase.co
SUPABASE_ANON_KEY = <copy from my-app/.env.local>
GOOGLE_OAUTH_CLIENT_ID = <create in Google Cloud Console>
OAUTH_URL_SCHEME = com.[APP_NAME].ios
```

Note the `$()` escape — xcconfig treats `//` as a comment so `https://` must be split.

In **Project → Info → Configurations**, set the `Debug` and `Release` configs to use `Secrets.xcconfig`.

In `Info.plist`, add:

```xml
<key>SUPABASE_URL</key><string>$(SUPABASE_URL)</string>
<key>SUPABASE_ANON_KEY</key><string>$(SUPABASE_ANON_KEY)</string>
<key>GOOGLE_OAUTH_CLIENT_ID</key><string>$(GOOGLE_OAUTH_CLIENT_ID)</string>
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>$(OAUTH_URL_SCHEME)</string></array>
  </dict>
</array>
```

## Step 11 — `.gitignore`

Append to `/Users/vs/Desktop/Code/personal/Focals-Base/.gitignore`:

```
# iOS / Xcode
ios/**/xcuserdata/
ios/**/*.xcuserstate
ios/**/Secrets.xcconfig
ios/**/DerivedData/
ios/**/.swiftpm/
ios/**/build/
*.ipa
*.dSYM.zip
```

## Step 12 — CI build script

Create `ios/bin/build.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

xcodebuild \
  -project Focals.xcodeproj \
  -scheme Focals \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=17.5' \
  -configuration Debug \
  clean build \
  | xcbeautify || true
```

Make it executable: `chmod +x ios/bin/build.sh`. Install `xcbeautify` (`brew install xcbeautify`) for readable output.

---

## Acceptance Criteria

- [ ] Project builds clean on iPhone 15 simulator (`bin/build.sh` exits 0, zero warnings)
- [ ] `RootView` shows the `DesignTokenGallery` with all 13 brand colors, three font weights, all five `StatusPill` tones
- [ ] `Color.tokens.bg` resolves correctly in dark and light modes (toggle simulator appearance — colors swap)
- [ ] `Secrets.xcconfig` is gitignored (`git check-ignore ios/Focals/Secrets.xcconfig` exits 0)
- [ ] `Info.plist` reads all four secrets via `$(...)` substitution (verify with `Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL")` in a print statement)
- [ ] `FocalsKit` SPM package builds and is linked into the app target with all four products
- [ ] Custom Inter fonts render (test by printing `UIFont.familyNames.contains("Inter")` — should be `true`)
- [ ] No committed secrets — `git diff --cached` before any commit shows zero key material
- [ ] Bundle ID is `com.[APP_NAME].ios`, deployment target is iOS 17.0

## Depends on

None — this is the foundation.
