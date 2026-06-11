import SwiftUI
import SwiftData
import PhotosUI
import UniformTypeIdentifiers
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

/// AI-extracted project import. User picks a file (PDF/CSV/XLSX/DOCX/TXT or
/// image), the webapp calls Anthropic to extract proposed projects, the
/// review pane lets the user skip rows and pick client decisions, then
/// commit creates the projects + new clients in one shot.
///
/// Per-row inline editing of every field is intentionally **not** in v1 —
/// users can edit the project after creation. v1 covers the 80% case:
/// review the AI output, untick what's wrong, accept the rest.
struct ProjectUploadSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedClient.fullName, order: .forward) private var cachedClients: [CachedClient]

    enum Phase: Equatable {
        case pick
        case extracting(filename: String)
        case review
        case committing
    }

    @State private var phase: Phase = .pick
    @State private var jobId: String?
    @State private var filename: String = ""
    @State private var warnings: [String] = []
    @State private var truncated = false
    @State private var rows: [RowDraft] = []
    @State private var error: String?

    @State private var showDocumentPicker = false
    @State private var pickedPhoto: PhotosPickerItem?

    var body: some View {
        DetailSheet(title: "Import projects") {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.lg) {
                    switch phase {
                    case .pick:
                        pickerView
                    case .extracting(let name):
                        extractingView(filename: name)
                    case .review:
                        reviewView
                    case .committing:
                        committingView
                    }
                    if let error {
                        Text(error)
                            .font(.tokens.body(13))
                            .foregroundStyle(Color.tokens.danger)
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.tokens.bg)
        }
        .sheet(isPresented: $showDocumentPicker) {
            DocumentPicker(
                onPick: { url in
                    showDocumentPicker = false
                    Task { await handlePickedFile(url) }
                },
                onCancel: { showDocumentPicker = false }
            )
        }
        .onChange(of: pickedPhoto) { _, item in
            guard let item else { return }
            Task { await handlePickedPhoto(item) }
        }
    }

    // MARK: - Pick phase

    private var pickerView: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Import projects from a file")
                .editorialHeadline()

            pickerCard(
                symbol: "doc",
                title: "Choose file",
                subtitle: "PDF, CSV, XLSX, DOCX, TXT, JPG, PNG, HEIC · max 10 MB"
            ) {
                showDocumentPicker = true
            }

            PhotosPicker(selection: $pickedPhoto, matching: .images) {
                pickerCardLabel(
                    symbol: "photo",
                    title: "Pick a photo",
                    subtitle: "From your library"
                )
            }
            .buttonStyle(.plain)

            Text("Files are processed by Anthropic's Claude API to extract project data, then discarded. You'll review every proposed project before anything is saved.")
                .font(.tokens.body(11))
                .foregroundStyle(Color.tokens.textTertiary)
        }
    }

    private func pickerCard(
        symbol: String,
        title: String,
        subtitle: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            pickerCardLabel(symbol: symbol, title: title, subtitle: subtitle)
        }
        .buttonStyle(.plain)
    }

    private func pickerCardLabel(
        symbol: String,
        title: String,
        subtitle: String
    ) -> some View {
        HStack(spacing: Spacing.md) {
            Image(systemName: symbol)
                .font(.system(size: 22))
                .foregroundStyle(Color.tokens.accent)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.tokens.medium(15))
                    .foregroundStyle(Color.tokens.textPrimary)
                Text(subtitle)
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.textTertiary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.tokens.body(11))
                .foregroundStyle(Color.tokens.textTertiary)
        }
        .padding(Spacing.md)
        .background(Color.tokens.bgSecondary)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.md)
                .stroke(Color.tokens.border, lineWidth: 0.5)
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.md))
    }

    // MARK: - Extracting phase

    private func extractingView(filename: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Extracting projects")
                .editorialHeadline()
            HStack(spacing: Spacing.sm) {
                ProgressView()
                Text("Reading \(filename)…")
                    .font(.tokens.body(13))
                    .foregroundStyle(Color.tokens.textSecondary)
            }
            .padding(Spacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.tokens.bgSecondary)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md))

            Text("Keep this screen open. Larger files take 10–30 seconds.")
                .font(.tokens.body(11))
                .foregroundStyle(Color.tokens.textTertiary)
        }
    }

    // MARK: - Review phase

    private var reviewView: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text(headerLabel)
                .editorialHeadline()

            if !warnings.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(warnings, id: \.self) { warning in
                        Label(warning, systemImage: "exclamationmark.triangle")
                            .font(.tokens.body(12))
                            .foregroundStyle(Color.tokens.warning)
                    }
                }
                .padding(Spacing.sm)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.tokens.warning.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: Radius.sm))
            }

            VStack(spacing: Spacing.sm) {
                ForEach($rows) { $row in
                    rowView(for: $row)
                }
            }

            HStack {
                Button("Cancel", role: .cancel) {
                    resetToPicker()
                }
                .buttonStyle(.bordered)

                Spacer()

                Button {
                    Task { await commit() }
                } label: {
                    Text("Create \(selectedCount) project\(selectedCount == 1 ? "" : "s")")
                        .frame(minWidth: 160)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.tokens.accent)
                .disabled(selectedCount == 0)
            }
        }
    }

    private var headerLabel: String {
        let count = rows.count
        return "\(count) project\(count == 1 ? "" : "s") extracted from \(filename)"
    }

    private var selectedCount: Int {
        rows.filter(\.selected).count
    }

    private func rowView(for rowBinding: Binding<RowDraft>) -> some View {
        RowView(row: rowBinding, clients: cachedClients)
    }

    private struct RowView: View {
        @Binding var row: RowDraft
        let clients: [CachedClient]

        var body: some View {
            let original = row.original
            VStack(alignment: .leading, spacing: Spacing.xs) {
                HStack(alignment: .top, spacing: Spacing.sm) {
                    Toggle("", isOn: $row.selected)
                        .labelsHidden()
                    VStack(alignment: .leading, spacing: 2) {
                        Text(original.title)
                            .font(.tokens.medium(14))
                            .foregroundStyle(Color.tokens.textPrimary)
                        Text(metaLine(for: original))
                            .font(.tokens.body(12))
                            .foregroundStyle(Color.tokens.textSecondary)
                        if let excerpt = original.sourceExcerpt, !excerpt.isEmpty {
                            Text(excerpt)
                                .font(.tokens.body(11))
                                .foregroundStyle(Color.tokens.textTertiary)
                                .italic()
                                .lineLimit(2)
                        }
                    }
                    Spacer()
                }

                clientChooser(match: original.clientMatch)
            }
            .padding(Spacing.md)
            .background(Color.tokens.bgSecondary)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.md)
                    .stroke(Color.tokens.border, lineWidth: 0.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: Radius.md))
            .opacity(row.selected ? 1 : 0.55)
        }

        private func metaLine(for project: AnnotatedProposedProject) -> String {
            var parts: [String] = []
            if let date = project.shootDate { parts.append(date) }
            if let price = project.packagePrice { parts.append(String(format: "$%.0f", price)) }
            if let location = project.location, !location.isEmpty { parts.append(location) }
            if let category = project.category, !category.isEmpty { parts.append(category) }
            return parts.joined(separator: " · ")
        }

        private func clientChooser(match: ClientMatch) -> some View {
            VStack(alignment: .leading, spacing: 4) {
                Text("Client")
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textTertiary)
                Menu {
                    if case .ambiguous = match.kind, let candidates = match.candidates {
                        ForEach(candidates) { candidate in
                            Button(candidate.fullName) {
                                row.decision = .existing(candidate.id)
                            }
                        }
                        Divider()
                    }
                    ForEach(clients, id: \.serverId) { c in
                        Button(c.fullName) { row.decision = .existing(c.serverId) }
                    }
                    if let suggested = suggestedNewClientName(for: match, fallback: row.original.clientName),
                       !suggested.isEmpty {
                        Divider()
                        Button("Create new \"\(suggested)\"") {
                            row.decision = .create(fullName: suggested)
                        }
                    }
                    Button("No client") {
                        row.decision = .none
                    }
                } label: {
                    HStack {
                        Text(decisionLabel(row.decision))
                            .font(.tokens.body(13))
                            .foregroundStyle(Color.tokens.textPrimary)
                        Spacer()
                        Image(systemName: "chevron.up.chevron.down")
                            .font(.tokens.body(11))
                            .foregroundStyle(Color.tokens.textTertiary)
                    }
                    .padding(.vertical, 6)
                    .padding(.horizontal, 10)
                    .background(Color.tokens.bgTertiary)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sm))
                }
                .buttonStyle(.plain)
            }
        }

        private func suggestedNewClientName(for match: ClientMatch, fallback: String?) -> String? {
            if case .none = match.kind {
                return match.suggestedName ?? fallback
            }
            return fallback
        }

        private func decisionLabel(_ decision: CommitProjectRow.ClientDecision) -> String {
            switch decision.kind {
            case .existing:
                if let id = decision.clientId,
                   let match = clients.first(where: { $0.serverId == id }) {
                    return match.fullName
                }
                return "Existing client"
            case .create:
                return "+ Create \"\(decision.full_name ?? "")\""
            case .none:
                return "No client"
            }
        }
    }

    // MARK: - Committing phase

    private var committingView: some View {
        HStack(spacing: Spacing.sm) {
            ProgressView()
            Text("Creating projects…")
                .font(.tokens.body(13))
                .foregroundStyle(Color.tokens.textSecondary)
        }
        .padding(Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.tokens.bgSecondary)
        .clipShape(RoundedRectangle(cornerRadius: Radius.md))
    }

    // MARK: - Actions

    private func handlePickedFile(_ url: URL) async {
        let mime = mimeType(for: url)
        await runUpload {
            try await ProjectUploadService.shared.upload(fileURL: url, mimeType: mime)
        }
    }

    private func handlePickedPhoto(_ item: PhotosPickerItem) async {
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { return }
            let filename = "photo-\(UUID().uuidString.prefix(8)).jpg"
            await runUpload {
                try await ProjectUploadService.shared.upload(
                    fileData: data,
                    filename: filename,
                    mimeType: "image/jpeg"
                )
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func runUpload(_ work: () async throws -> UploadResponse) async {
        error = nil
        let originalFilename: String = {
            if case .extracting(let name) = phase { return name }
            return "file"
        }()
        phase = .extracting(filename: originalFilename)

        do {
            let response = try await work()
            jobId = response.jobId
            filename = response.filename
            warnings = response.warnings
            truncated = response.truncated
            rows = response.projects.map(RowDraft.init(original:))
            phase = .review
        } catch {
            self.error = error.localizedDescription
            phase = .pick
        }
    }

    private func commit() async {
        let payload = rows
            .filter { $0.selected }
            .map { $0.toCommitRow() }

        phase = .committing
        do {
            let result = try await ProjectUploadService.shared.commit(jobId: jobId, rows: payload)
            // Refresh local caches so the new projects + clients appear.
            try? await ProjectsCacheRepository.shared.refresh(in: context)
            if result.createdClientCount > 0 {
                try? await ClientsCacheRepository.shared.refresh(in: context)
            }

            if !result.errors.isEmpty {
                // Keep the failed rows visible for retry.
                let failedKeys = Set(result.errors.map { $0.rowKey })
                rows = rows.filter { failedKeys.contains($0.original.rowKey) }
                error = result.errors.map(\.message).joined(separator: "\n")
                phase = .review
            } else {
                Haptics.success()
                dismiss()
            }
        } catch {
            self.error = error.localizedDescription
            phase = .review
        }
    }

    private func resetToPicker() {
        rows = []
        warnings = []
        jobId = nil
        filename = ""
        error = nil
        phase = .pick
    }

    private func mimeType(for url: URL) -> String {
        let ext = url.pathExtension.lowercased()
        switch ext {
        case "pdf":  return "application/pdf"
        case "csv":  return "text/csv"
        case "txt":  return "text/plain"
        case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        case "jpg", "jpeg": return "image/jpeg"
        case "png":  return "image/png"
        case "heic": return "image/heic"
        default:     return "application/octet-stream"
        }
    }
}

/// Lightweight per-row state — selection + the user's client decision.
/// Field-level edits are deferred to v1.1; users can edit any project after
/// commit via `ProjectDetailScreen → Edit`.
struct RowDraft: Identifiable {
    let original: AnnotatedProposedProject
    var selected: Bool
    var decision: CommitProjectRow.ClientDecision

    var id: String { original.rowKey }

    init(original: AnnotatedProposedProject) {
        self.original = original

        // Initial select: skip rows the AI flagged as un-actionable. Right
        // now we approximate that with "no shoot date AND no title fragment".
        // Mirror the web's behaviour as it tightens.
        let unscheduled = (original.shootDate == nil) || (original.shootDate?.isEmpty == true)
        self.selected = !unscheduled || !original.title.isEmpty

        // Initial client decision per the match kind, mirroring the web's
        // `initialDecision` heuristic.
        switch original.clientMatch.kind {
        case .confident:
            if let id = original.clientMatch.clientId {
                self.decision = .existing(id)
            } else {
                self.decision = .none
            }
        case .ambiguous:
            if let first = original.clientMatch.candidates?.first {
                self.decision = .existing(first.id)
            } else {
                self.decision = .none
            }
        case .none:
            if let suggested = original.clientMatch.suggestedName, !suggested.isEmpty {
                self.decision = .create(fullName: suggested)
            } else if let raw = original.clientName, !raw.isEmpty {
                self.decision = .create(fullName: raw)
            } else {
                self.decision = .none
            }
        }
    }

    func toCommitRow() -> CommitProjectRow {
        CommitProjectRow(
            rowKey: original.rowKey,
            title: original.title,
            category: original.category,
            status: original.status,
            shoot_date: original.shootDate,
            location: original.location,
            package_price: original.packagePrice,
            amount_paid: original.amountPaid,
            payment_status: original.paymentStatus,
            notes: original.notes,
            clientDecision: decision
        )
    }
}
