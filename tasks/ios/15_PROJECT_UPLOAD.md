# Task 15 — Project Upload (LLM-Extracted Project Creation)

## Goal

Mirror the web's [file-upload feature](../../my-app/src/components/projects/ProjectsUploadDialog.tsx) on iOS. User taps "Import from file" on the Projects screen, picks a PDF/CSV/XLSX/DOCX/TXT or image (camera/library), Claude Haiku extracts proposed projects, the user reviews/edits/skips inline, and committing creates the projects (and any new clients) in one shot. Same backend, same review-pane semantics, native iOS picker UX.

> **Background**: shipped on the web in commit `5e23068` (2026-04-28). The server endpoint `POST /api/projects/upload` and the commit action `commitUploadedProjects` already exist; iOS just builds the native client. BYO Anthropic key per user (Task 12 documents the Settings UI). Storage is the existing `user_integrations` + `project_upload_jobs` tables.

References:
- Web entry: [my-app/src/components/projects/ProjectsUploadDialog.tsx](../../my-app/src/components/projects/ProjectsUploadDialog.tsx)
- Web API: [my-app/src/app/api/projects/upload/route.ts](../../my-app/src/app/api/projects/upload/route.ts)
- Commit action: [my-app/src/lib/actions/projects.ts](../../my-app/src/lib/actions/projects.ts) (function `commitUploadedProjects`)
- LLM prompt: [my-app/src/lib/upload/extractProjects.ts](../../my-app/src/lib/upload/extractProjects.ts)

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ × Import projects from a file                               │
│ ─────────────────────────────────────────────────────────── │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  📄  Choose file                                          │ │
│ │      PDF, CSV, XLSX, DOCX, TXT, JPG, PNG, HEIC · max 10MB│ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  📷  Take a photo                                         │ │
│ │      Of a contract, booking form, or notebook page       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Files are processed by Anthropic's Claude API; the original │
│ file is discarded after extraction.                         │
└─────────────────────────────────────────────────────────────┘
                              ↓ after extract
┌─────────────────────────────────────────────────────────────┐
│ × 4 projects extracted from "spring_2026.csv"               │
│ ─────────────────────────────────────────────────────────── │
│ ☑ Sarah J · Wedding · Jun 14 2026 · $4,500       [edit ▾] │
│   "from row 2: Sarah Johnson, Wedding, 2026-06-14, ..."     │
│   Client: Sarah Johnson ✓ existing                          │
│ ☑ Mike R · Portrait · Apr 02 2026 · $850         [edit ▾] │
│   Client: ⚠ ambiguous — pick: ◉ Mike Reyes  ○ Mike Robles  │
│ ☑ Alex T · Family   · May 10 2026 · $1,200       [edit ▾] │
│   Client: + Create new "Alex Trujillo"                      │
│ ☐ Lin K · Editorial · ?       · $—               [edit ▾] │
│   ⚠ skipped — no shoot date detected                        │
│ ─────────────────────────────────────────────────────────── │
│                              [ Cancel ]  [ Create 3 ▶ ]     │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1 — Entry points

### From the Projects screen

Add a toolbar action in `ProjectsScreen` (Task 09) — a `Menu` item next to the existing "+ New project" button:

```swift
.toolbar {
    ToolbarItem(placement: .topBarTrailing) {
        Menu {
            Button("New project", systemImage: "plus") {
                AppRouter.shared.presentedSheet = .createProject(presetShootDate: nil)
            }
            Button("Import from file", systemImage: "square.and.arrow.down") {
                AppRouter.shared.presentedSheet = .projectUpload
            }
        } label: {
            Image(systemName: "plus")
        }
    }
}
```

### From the Share Extension (Task 13 Section D)

The Share Extension can pass through a file via Universal Link `focals://upload?fileURL=…`. The deep-link router (Task 04) opens the upload sheet pre-loaded with that file.

---

## Step 2 — Network types in `FocalsAPI`

Mirror the server's response shape so the iOS dialog can parse it directly.

```swift
public struct UploadResponse: Codable, Sendable {
    public let jobId: UUID
    public let filename: String
    public let projects: [AnnotatedProposedProject]
    public let warnings: [String]
    public let truncated: Bool
}

public struct AnnotatedProposedProject: Codable, Sendable, Identifiable {
    public let rowKey: String                    // server-assigned, stable per row
    public var id: String { rowKey }
    public let title: String
    public let clientName: String?               // raw extracted name
    public let category: String?
    public let status: ProjectStatus?
    public let shootDate: String?                // ISO string or null
    public let location: String?
    public let packagePrice: Double?
    public let amountPaid: Double?
    public let paymentStatus: PaymentStatus?
    public let notes: String?
    public let sourceExcerpt: String
    public let clientMatch: ClientMatch
}

public enum ClientMatch: Codable, Sendable {
    case confident(clientId: UUID, matchedName: String, score: Double)
    case ambiguous(candidates: [ScoredCandidate])
    case none(suggestedName: String)
}

public struct ScoredCandidate: Codable, Sendable {
    public let id: UUID
    public let fullName: String
    public let score: Double
}
```

## Step 3 — `ProjectUploadService`

Wraps the multipart POST to `/api/projects/upload` and exposes the commit call.

```swift
public actor ProjectUploadService {
    public static let shared = ProjectUploadService()

    public func upload(_ file: URL, mimeType: String) async throws -> UploadResponse {
        let baseURL = URL(string: SUPABASE_URL_FROM_INFO_PLIST)!
            .deletingLastPathComponent()             // strip /supabase, replace w/ web URL
        let endpoint = URL(string: "\(SITE_URL)/api/projects/upload")!

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        let session = try await FocalsClient.shared.supabase.auth.session
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.append("--\(boundary)\r\n".utf8)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(file.lastPathComponent)\"\r\n".utf8)
        body.append("Content-Type: \(mimeType)\r\n\r\n".utf8)
        body.append(try Data(contentsOf: file))
        body.append("\r\n--\(boundary)--\r\n".utf8)

        let (data, response) = try await URLSession.shared.upload(for: request, from: body)
        try validate(response)
        return try JSONDecoder.supabase.decode(UploadResponse.self, from: data)
    }

    /// Commits the user's edited rows. Calls the existing commitUploadedProjects
    /// server action (exposed via a thin RPC route, since iOS can't call
    /// 'use server' directly).
    public func commit(jobId: UUID, rows: [CommitProjectRow]) async throws -> CommitProjectsResult {
        // POST to /api/projects/upload/commit (new route — see below)
    }
}
```

The web's `commitUploadedProjects` is currently a Next.js server action — iOS can't invoke server actions over HTTP. **One small web change required**: add a thin `POST /api/projects/upload/commit` route under `my-app/` that authenticates the user, validates the body, and calls `commitUploadedProjects` internally. Document in this task as a prerequisite. See the "Web prerequisite" section below.

## Step 4 — `ProjectUploadSheet` (review pane)

```swift
struct ProjectUploadSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    @State private var phase: Phase = .pick
    @State private var jobId: UUID?
    @State private var filename: String?
    @State private var rows: [RowState] = []
    @State private var warnings: [String] = []
    @State private var error: String?

    @Query private var clients: [CachedClient]
    @State private var session = SessionStore.shared

    enum Phase {
        case pick, extracting, review, committing
    }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Import projects")
                .toolbar { ... }
                .background(Color.tokens.bg)
        }
    }

    @ViewBuilder
    private var content: some View {
        if !session.hasAiKey {
            ConnectAiKeyEmptyState()
        } else {
            switch phase {
            case .pick:        FilePickerView(onFile: handleFile)
            case .extracting:  ExtractingView(filename: filename ?? "")
            case .review:      ReviewListView(
                                  filename: filename ?? "",
                                  warnings: warnings,
                                  rows: $rows,
                                  clients: clients.map { $0.toModel() }
                              )
            case .committing:  CommittingView()
            }
        }
    }
}
```

## Step 5 — File pickers

Two entry points side-by-side: **document picker** for files, **photos picker / camera** for images.

### Document picker

Wrap `UIDocumentPickerViewController` in a `UIViewControllerRepresentable`:

```swift
struct DocumentPicker: UIViewControllerRepresentable {
    let onPick: (URL, String) -> Void
    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let supportedTypes: [UTType] = [
            .pdf, .commaSeparatedText, .plainText,
            UTType(filenameExtension: "xlsx")!,
            UTType(filenameExtension: "docx")!,
        ]
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: supportedTypes)
        picker.delegate = context.coordinator
        picker.allowsMultipleSelection = false
        return picker
    }
    // ... coordinator forwards to onPick
}
```

### Photos picker

Native `PhotosPicker` for choosing images from the library.

### Camera

`UIImagePickerController` wrapped likewise. After capture, write to a temp file with the right extension (`.jpg`, `.heic`) and pass through the same upload pipeline.

## Step 6 — `RowState` editor

Identical UX to `ProjectsUploadDialog.tsx`:
- Per-row checkbox to skip
- Inline disclosure to edit fields (reuses Task 09's `MoneyField`, `DateField`, `StatusField`, `RelatedRecordField`)
- Client decision:
  - `.confident` → preselected with "(change)" affordance
  - `.ambiguous` → radio group, one row per candidate, plus "Create new" option
  - `.none` → "Create new \"<name>\"" with optional manual override to existing client

```swift
struct RowState: Identifiable {
    let original: AnnotatedProposedProject
    var id: String { original.rowKey }

    var selected: Bool = true
    var edited: Edited
    var clientChoice: ClientChoice

    enum ClientChoice {
        case existing(clientId: UUID)
        case create(fullName: String)
        case none
    }

    struct Edited {
        var title: String
        var category: String
        var status: ProjectStatus
        var shootDate: Date?
        var location: String
        var packagePrice: Decimal?
        var amountPaid: Decimal
        var paymentStatus: PaymentStatus
        var notes: String
    }
}
```

Initialize from `AnnotatedProposedProject` using the same defaults the web uses (confident match → `.existing`, ambiguous → preselect first candidate, none with name → `.create`, no name → `.none`).

## Step 7 — Commit

Button at the bottom: "Create N projects" where N = `rows.filter { $0.selected }.count`. On tap:
1. Switch phase to `.committing`.
2. Build `[CommitProjectRow]` from selected rows.
3. Call `ProjectUploadService.shared.commit(jobId:, rows:)`.
4. On success: `Haptics.success()`, toast `"Created N projects"`, refresh `ProjectsCacheRepository`, dismiss sheet.
5. On per-row errors: keep the failed rows in the list with red error annotations; user can fix and retry.

## Step 8 — `ConnectAiKeyEmptyState`

Shown if `session.hasAiKey == false` (Task 12 caches this in `SessionStore`):

```swift
struct ConnectAiKeyEmptyState: View {
    var body: some View {
        VStack(spacing: Spacing.md) {
            Image(systemName: "sparkles")
                .font(.system(size: 36))
                .foregroundStyle(.tokens.accent)
            Text("Connect your Anthropic key")
                .font(.tokens.display(20))
            Text("File import uses Claude to extract project data. Add an API key in Settings.")
                .font(.tokens.body(13))
                .foregroundStyle(.tokens.textSecondary)
                .multilineTextAlignment(.center)
            Button("Open Settings") {
                AppRouter.shared.navigate(to: .settings)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(Spacing.xl)
    }
}
```

## Step 9 — Background URLSession (optional in v1, recommended for large files)

Large PDFs (5–10MB) take 10–30s to extract. To allow the user to background the app during extraction, use a background `URLSession`:

```swift
let config = URLSessionConfiguration.background(withIdentifier: "com.[APP_NAME].ios.upload")
config.allowsCellularAccess = true
let session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
```

Defer this to v1.1 if it adds complexity. v1 can use a regular `URLSession` and show a "keep this screen open" hint.

## Step 10 — Privacy manifest entry

Add to `PrivacyInfo.xcprivacy`:

```xml
<key>NSPrivacyCollectedDataTypes</key>
<array>
    <dict>
        <key>NSPrivacyCollectedDataType</key>
        <string>NSPrivacyCollectedDataTypeUserContent</string>
        <key>NSPrivacyCollectedDataTypeLinked</key>
        <true/>
        <key>NSPrivacyCollectedDataTypePurposes</key>
        <array>
            <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
        </array>
    </dict>
</array>
```

App Privacy declaration in App Store Connect: **User Content** → "Used for app functionality" → linked to user identity. Plain English: "Files you upload are sent to Anthropic for one-time text extraction and discarded."

---

## Web prerequisite (one small change before iOS work)

Add `my-app/src/app/api/projects/upload/commit/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { commitUploadedProjects, type CommitProjectRow } from '@/lib/actions/projects';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { jobId: string | null; rows: CommitProjectRow[] };
  const result = await commitUploadedProjects(body);
  if (result.error !== null) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result.data);
}
```

Two-line wrapper around the existing server action. Required because iOS can't call Next server actions directly over HTTP — they only work via the server action protocol from a Next.js client. Document in USER_TODO.md when iOS work begins.

---

## Acceptance Criteria

### Settings prerequisite
- [ ] AI file import card in Settings (from Task 12) reads `getIntegrationStatus()` and gates the upload sheet on `connected: true`

### Upload flow
- [ ] "Import from file" toolbar item on the Projects screen opens the upload sheet
- [ ] Document picker shows PDF, CSV, XLSX, DOCX, TXT — selecting one transitions to `.extracting`
- [ ] Photos picker accepts JPG/PNG/HEIC and routes to the same upload pipeline
- [ ] Camera capture writes a temp file and uploads it
- [ ] Files >10MB show a friendly client-side error before the network call
- [ ] Extraction call returns within ~30s for a 10-row CSV; UI shows a spinner with the filename
- [ ] On extraction success, review pane lists every proposed project with: title, date, price, location, source excerpt, client-match annotation
- [ ] Per-row checkbox toggles inclusion in the commit
- [ ] Per-row "Edit fields" disclosure shows the same controls as ProjectForm (`MoneyField`, `DateField`, `StatusField`)
- [ ] Confident client match shows the existing client name with a "(change)" affordance
- [ ] Ambiguous match shows a radio group with all candidates + a "Create new" option
- [ ] "Create new client" option creates the client server-side at commit time (composes `createClient` server action)
- [ ] "Create N projects" button label updates as the user toggles rows
- [ ] Commit creates projects + auto-syncs finance income rows (via the server-side trigger from migration `20260429000000`)
- [ ] Per-row errors keep failed rows in the dialog with annotations; successful rows disappear
- [ ] Network failure mid-upload surfaces an actionable error and keeps the file in memory for retry
- [ ] Backgrounding the app during extraction continues the request (background URLSession in v1, app-foreground hint otherwise)

### Privacy
- [ ] Privacy disclosure visible on the file-pick screen
- [ ] PrivacyInfo.xcprivacy declares User Content collection with purpose=app-functionality
- [ ] Failed extractions don't leak file content to logs (verify in Console.app)

### Web prerequisite
- [ ] `POST /api/projects/upload/commit` route exists and authenticates via Supabase cookie session
- [ ] Web continues to work via the existing server-action path (the new route is additive)

## Depends on

- 04 (Sheet infrastructure, AppRouter, deep-link router for Share Extension entry)
- 05 (`ProjectsCacheRepository`, `ClientsCacheRepository`)
- 09 (Shared `MoneyField`, `DateField`, `StatusField`, `RelatedRecordField`; ProjectForm pattern)
- 12 (AI file import section in Settings — provides the API key)
- One web addition (Step "Web prerequisite") — Next.js route exposing the commit action over HTTP
