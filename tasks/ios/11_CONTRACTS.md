# Task 11 — Contracts

## Goal

Build the contracts module: contract list, template picker, PDF preview via `PDFKit`, native share sheet, and PencilKit on-device signing on iPad. After this task, every contract generated on the web renders correctly on iOS, and an iPad-equipped photographer can capture an in-person signature without printing.

References:
- [my-app/src/app/(dashboard)/contracts/](../../my-app/src/app/(dashboard)/contracts/)
- [my-app/src/app/api/contracts/[id]/pdf/route.ts](../../my-app/src/app/api/contracts/%5Bid%5D/pdf/route.ts)

---

## Layout

```
┌──────────────────────────────────────────┐
│ ← Contracts        [Templates] [+ New]   │
│ ──────────────────────────────────────── │
│ Sarah J Wedding Agreement                │
│   SIGNED · Apr 12 · Sent Apr 5           │
│ ──────────────────────────────────────── │
│ Mike R Portrait Contract                 │
│   SENT · Apr 18                           │
│ ──────────────────────────────────────── │
│ Alex T Family Session                    │
│   DRAFT                                   │
└──────────────────────────────────────────┘
```

Tap row → contract detail with embedded PDF viewer + actions.

---

## Step 1 — `ContractsScreen` (list)

```swift
struct ContractsScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedContract.updatedAt, order: .reverse) private var cached: [CachedContract]

    var body: some View {
        List {
            ForEach(cached) { contract in
                ContractRow(contract: contract.toModel())
                    .onTapGesture {
                        AppRouter.shared.navigate(to: .contractDetail(contract.id))
                    }
            }
            .onDelete { offsets in /* delete with confirm */ }
        }
        .listStyle(.plain)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                NavigationLink("Templates", value: Route.contractTemplates)
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button(action: { AppRouter.shared.navigate(to: .contractNew) }) {
                    Image(systemName: "plus")
                }
            }
        }
        .navigationTitle("Contracts")
        .refreshable {
            try? await ContractsCacheRepository.shared.refresh(in: context)
        }
    }
}
```

`ContractRow`: title, status pill, sent_at / signed_at dates.

## Step 2 — `ContractNewScreen` (create flow)

Three-step wizard, presented as a `NavigationStack` push:

### Step 1: Pick template

```swift
@Query(sort: \CachedContractTemplate.name) private var templates: [CachedContractTemplate]

var body: some View {
    List {
        ForEach(templates) { template in
            Button(action: { selectedTemplate = template }) {
                VStack(alignment: .leading) {
                    Text(template.name).font(.tokens.medium(15))
                    Text("Last edited \(template.updatedAt.formatted(.relative(presentation: .named)))")
                        .font(.tokens.body(12))
                        .foregroundStyle(.tokens.textTertiary)
                }
            }
        }
    }
}
```

### Step 2: Fill merge fields

After selecting a template, parse `template.body` for placeholders matching `{{client_name}}`, `{{project_title}}`, `{{shoot_date}}`, etc. (Same convention as web — read [my-app/src/lib/actions/contracts.ts](../../my-app/src/lib/actions/contracts.ts) for the exact regex.)

```swift
struct MergeFieldEditor: View {
    @Binding var values: [String: String]   // placeholder → user-entered value
    let placeholders: [String]
    @Query private var clients: [CachedClient]
    @Query private var projects: [CachedProject]

    var body: some View {
        Form {
            ForEach(placeholders, id: \.self) { key in
                if key == "client_name" {
                    Picker("Client", selection: clientBinding) {
                        ForEach(clients) { Text($0.fullName).tag($0.fullName as String?) }
                    }
                } else {
                    TextField(key.replacingOccurrences(of: "_", with: " ").capitalized, text: bindingFor(key))
                }
            }
        }
    }
}
```

### Step 3: Preview

Render the merged body in `Text(.markdown:)` (the web's body is markdown — keep parity), with a "Save Draft" button at bottom.

## Step 3 — `ContractDetailScreen` with PDFKit viewer

```swift
struct ContractDetailScreen: View {
    let id: UUID
    @State private var pdfData: Data?
    @State private var isLoading = true

    var body: some View {
        VStack {
            if let pdfData {
                PDFKitView(data: pdfData)
                    .ignoresSafeArea(edges: .bottom)
            } else if isLoading {
                ProgressView()
            }
        }
        .navigationTitle("Contract")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if let pdfData {
                    ShareLink(item: pdfData, preview: SharePreview("Contract.pdf"))
                }
                Menu {
                    Button("Sign in person") { showSignSheet = true }
                    Button("Mark sent") { Task { await markSent() } }
                    Button("Delete", role: .destructive) { /* confirm */ }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showSignSheet) {
            PencilSignatureSheet(contractId: id) { signedPdfData in
                pdfData = signedPdfData
            }
        }
        .task { await loadPdf() }
    }

    private func loadPdf() async {
        isLoading = true
        defer { isLoading = false }
        do {
            // Authenticated request to the existing /api/contracts/[id]/pdf endpoint
            var request = URLRequest(url: pdfURL(for: id))
            let session = try await FocalsClient.shared.supabase.auth.session
            request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
            let (data, _) = try await URLSession.shared.data(for: request)
            pdfData = data
        } catch {
            // Show error
        }
    }
}
```

`PDFKitView`:

```swift
import PDFKit
import SwiftUI

struct PDFKitView: UIViewRepresentable {
    let data: Data
    func makeUIView(context: Context) -> PDFView {
        let view = PDFView()
        view.autoScales = true
        view.displayMode = .singlePageContinuous
        view.displayDirection = .vertical
        view.document = PDFDocument(data: data)
        return view
    }
    func updateUIView(_ view: PDFView, context: Context) {
        view.document = PDFDocument(data: data)
    }
}
```

## Step 4 — PencilKit signature flow (iPad)

```swift
import PencilKit
import PDFKit

struct PencilSignatureSheet: View {
    let contractId: UUID
    let onSigned: (Data) -> Void

    @State private var canvas = PKCanvasView()
    @State private var saving = false

    var body: some View {
        NavigationStack {
            VStack {
                Text("Sign with Apple Pencil")
                    .editorialHeadline()
                CanvasRepresentable(canvas: $canvas)
                    .background(Color.white)
                    .border(Color.tokens.border)
                    .frame(maxHeight: 300)
                HStack {
                    Button("Clear") { canvas.drawing = PKDrawing() }
                    Spacer()
                    Button("Save signature") { Task { await save() } }
                        .buttonStyle(.borderedProminent)
                        .disabled(saving || canvas.drawing.bounds.isEmpty)
                }
                .padding(Spacing.md)
            }
            .padding()
            .navigationTitle("Sign Contract")
        }
    }

    private func save() async {
        saving = true
        defer { saving = false }
        let bounds = canvas.drawing.bounds
        let image = canvas.drawing.image(from: bounds, scale: UIScreen.main.scale)
        let imageData = image.pngData()!

        // 1. Render onto last page of contract PDF
        let signedPdf = await embedSignature(imageData, into: contractId)

        // 2. Upload to Supabase: store base64 in custom_fields JSONB for v1
        var contract = try! await ContractsRepository.shared.get(id: contractId)
        var fields = contract.customFields ?? [:]
        fields["signature_image_base64"] = imageData.base64EncodedString()
        fields["signed_at"] = Date.now.iso8601String
        contract.customFields = fields
        contract.signedAt = .now
        contract.status = .signed
        _ = try? await ContractsCacheRepository.shared.update(contract, in: context)

        Haptics.success()
        onSigned(signedPdf)
    }
}

struct CanvasRepresentable: UIViewRepresentable {
    @Binding var canvas: PKCanvasView
    func makeUIView(context: Context) -> PKCanvasView {
        canvas.drawingPolicy = .anyInput      // accept finger if no Pencil
        canvas.tool = PKInkingTool(.pen, color: .black, width: 4)
        return canvas
    }
    func updateUIView(_ uiView: PKCanvasView, context: Context) {}
}
```

`embedSignature(_:into:)` re-fetches the PDF, draws the signature image onto the last page, and returns the new bytes:

```swift
func embedSignature(_ pngData: Data, into contractId: UUID) async -> Data {
    var request = URLRequest(url: pdfURL(for: contractId))
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    let (originalPdf, _) = try! await URLSession.shared.data(for: request)
    guard let document = PDFDocument(data: originalPdf),
          let lastPage = document.page(at: document.pageCount - 1),
          let signatureImage = UIImage(data: pngData) else { return originalPdf }

    // Add image annotation in the lower-right
    let pageRect = lastPage.bounds(for: .mediaBox)
    let signatureBounds = CGRect(
        x: pageRect.width - 200 - 36,
        y: 60,
        width: 200,
        height: 80
    )
    let annotation = PDFAnnotation(bounds: signatureBounds, forType: .stamp, withProperties: nil)
    annotation.image = signatureImage
    lastPage.addAnnotation(annotation)

    return document.dataRepresentation() ?? originalPdf
}
```

`PDFAnnotation.image` requires a custom subclass on older iOS but on iOS 17 the `.stamp` type with `image` works directly via `setValue(_:forAnnotationKey:)`. Verify and adjust per actual SDK behavior.

Document v1.1 plan in `ios/Focals/Modules/Contracts/SIGNATURE_STORAGE.md`:

> v1: Signature stored as base64 PNG in `contracts.custom_fields.signature_image_base64`. Re-rendered onto PDF on the fly when viewing a signed contract.
>
> v1.1: introduce a `signatures` Storage bucket. Store URL in `contracts.signature_url`. Server-side PDF rendering (web) embeds the signature on render rather than client-side overlay. Migrate base64 records by extracting + uploading on first read.

## Step 5 — `ContractTemplatesScreen`

Read-only list for v1 — duplicating from the web-managed templates is enough. Editing deferred to v1.1.

```swift
struct ContractTemplatesScreen: View {
    @Query(sort: \CachedContractTemplate.name) private var templates: [CachedContractTemplate]

    var body: some View {
        List {
            ForEach(templates) { template in
                NavigationLink(value: Route.contractTemplateDetail(template.id)) {
                    VStack(alignment: .leading) {
                        Text(template.name).font(.tokens.medium(15))
                        Text(template.body)
                            .font(.tokens.body(13))
                            .foregroundStyle(.tokens.textTertiary)
                            .lineLimit(2)
                    }
                }
            }
        }
        .navigationTitle("Templates")
        .toolbar {
            // No "+" — creation is web-only in v1
        }
    }
}
```

Add a banner on first visit: "Templates are managed on the web. iOS shows them read-only for now."

## Step 6 — Status workflow

Tap into any contract → menu with:
- **Mark as sent** (status: draft → sent, set `sent_at`)
- **Mark as signed** (status: sent → signed, set `signed_at`) — same as completing PencilKit flow
- **Mark as declined** (status: sent → declined)
- **Delete** (with confirm)

Each is a one-call repository update.

---

## Acceptance Criteria

- [ ] Contract list shows status pill + sent/signed dates
- [ ] Create flow: pick template → fill merge fields → preview → save (draft)
- [ ] Merge fields auto-populate from selected client/project
- [ ] Detail screen renders the server-generated PDF in `PDFKit` (verified by saving a contract on web and viewing it on iOS)
- [ ] Share sheet exports PDF to Files / Mail / Messages
- [ ] iPad: PencilKit signature canvas captures Apple Pencil input
- [ ] Saving signature: status → signed, `signed_at` set, signature image base64 stored in `custom_fields`
- [ ] Re-opening a signed contract shows the signature embedded on the last page
- [ ] iPhone (no Pencil): canvas accepts finger input, but show a banner suggesting iPad for production use
- [ ] Templates list shows all server templates as read-only with a banner
- [ ] Status workflow buttons work: mark sent / signed / declined / delete
- [ ] Authentication header includes valid bearer token; expired session re-auths transparently
- [ ] Offline: list renders cached; mutations show error toast; PDF view shows "offline" message

## Depends on

- 03 (auth: bearer token from `SessionStore` for PDF endpoint)
- 04 (Shell, navigation)
- 05 (`ContractsCacheRepository`, `ContractTemplatesCacheRepository`)
