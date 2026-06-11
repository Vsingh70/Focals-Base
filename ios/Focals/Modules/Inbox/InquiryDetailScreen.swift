import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct InquiryDetailScreen: View {
    let id: UUID

    @Environment(\.modelContext) private var context
    @Query private var matches: [CachedInquiry]

    @State private var isMutating = false
    @State private var actionError: String?
    @State private var didMarkRead = false

    init(id: UUID) {
        self.id = id
        _matches = Query(
            filter: #Predicate<CachedInquiry> { $0.serverId == id },
            sort: \CachedInquiry.createdAt
        )
    }

    var body: some View {
        Group {
            if let inquiry = matches.first?.toModel() {
                content(for: inquiry)
            } else {
                EmptyState(
                    symbol: "tray",
                    title: "Inquiry unavailable",
                    description: "This inquiry might have been deleted or hasn't been synced yet."
                )
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Inquiry")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Couldn't update", isPresented: actionErrorBinding, presenting: actionError) { _ in
            Button("OK", role: .cancel) {}
        } message: { error in
            Text(error)
        }
    }

    private func content(for inquiry: Inquiry) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                header(for: inquiry)
                contactSection(for: inquiry)
                if let message = inquiry.message, !message.isEmpty {
                    messageBlock(message)
                }
                actionRow(for: inquiry)
                if inquiry.status != .converted {
                    convertSection(for: inquiry)
                } else {
                    convertedFooter(for: inquiry)
                }
                if inquiry.rawPayload != nil {
                    rawPayloadDisclosure(for: inquiry)
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.lg)
        }
        .task(id: inquiry.id) { await markReadIfNeeded(inquiry) }
    }

    // MARK: - Sections

    private func header(for inquiry: Inquiry) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(inquiry.name)
                .editorialHeadline()
                .frame(maxWidth: .infinity, alignment: .leading)
            HStack(spacing: Spacing.xs) {
                StatusPill(
                    (inquiry.status ?? .new).displayName,
                    tone: tone(for: inquiry.status ?? .new)
                )
                StatusPill(
                    inquiry.source.replacingOccurrences(of: "_", with: " ").capitalized,
                    tone: .neutral
                )
                Spacer()
                Text(inquiry.createdAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.textTertiary)
            }
        }
    }

    @ViewBuilder
    private func contactSection(for inquiry: Inquiry) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            sectionLabel("Details")

            VStack(alignment: .leading, spacing: Spacing.sm) {
                if let email = inquiry.email, !email.isEmpty {
                    contactRow(symbol: "envelope", label: email) {
                        if let url = URL(string: "mailto:\(email)") {
                            UIApplication.shared.open(url)
                        }
                    }
                }
                if let phone = inquiry.phone, !phone.isEmpty {
                    contactRow(symbol: "phone", label: phone) {
                        let stripped = phone.filter { "+0123456789".contains($0) }
                        if let url = URL(string: "tel:\(stripped)") {
                            UIApplication.shared.open(url)
                        }
                    }
                }
                if let shootType = inquiry.shootType, !shootType.isEmpty {
                    detailRow(symbol: "camera", label: "Shoot type", value: shootType)
                }
                if let preferred = InquiryRow.preferredDateLabel(inquiry.preferredDate) {
                    detailRow(symbol: "calendar", label: "Preferred date", value: preferred)
                }
                if let handle = inquiry.sourceHandle, !handle.isEmpty {
                    detailRow(symbol: "link", label: "Source handle", value: handle)
                }
            }
            .padding(Spacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.tokens.bgSecondary)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.md)
                    .stroke(Color.tokens.border, lineWidth: 0.5)
            )
            .clipShape(RoundedRectangle(cornerRadius: Radius.md))
        }
    }

    private func messageBlock(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            sectionLabel("Message")
            Text(message)
                .font(.tokens.body(14))
                .foregroundStyle(Color.tokens.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(Spacing.md)
                .background(Color.tokens.bgSecondary)
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.md)
                        .stroke(Color.tokens.border, lineWidth: 0.5)
                )
                .clipShape(RoundedRectangle(cornerRadius: Radius.md))
        }
    }

    private func actionRow(for inquiry: Inquiry) -> some View {
        HStack(spacing: Spacing.sm) {
            secondaryButton(
                "Mark replied",
                symbol: "envelope.open",
                disabled: inquiry.status == .replied || isMutating
            ) {
                Task { await markStatus(inquiry, .replied) }
            }
            secondaryButton(
                "Archive",
                symbol: "archivebox",
                disabled: inquiry.status == .archived || isMutating
            ) {
                Task { await markStatus(inquiry, .archived) }
            }
        }
    }

    private func convertSection(for inquiry: Inquiry) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            sectionLabel("Convert")
            Button {
                Task { await convert(inquiry, withProject: true) }
            } label: {
                Label("Convert to Client + Project", systemImage: "person.fill.badge.plus")
                    .frame(maxWidth: .infinity, minHeight: 50)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.tokens.accent)
            .disabled(isMutating)

            Button {
                Task { await convert(inquiry, withProject: false) }
            } label: {
                Label("Convert to Client only", systemImage: "person.crop.circle.badge.plus")
                    .frame(maxWidth: .infinity, minHeight: 44)
            }
            .buttonStyle(.bordered)
            .tint(Color.tokens.accent)
            .disabled(isMutating)
        }
    }

    private func convertedFooter(for inquiry: Inquiry) -> some View {
        VStack(alignment: .leading, spacing: Spacing.xs) {
            sectionLabel("Converted")
            if let projectId = inquiry.convertedProjectId {
                Button {
                    AppRouter.shared.navigate(to: .projectDetail(projectId))
                } label: {
                    Label("Open project", systemImage: "folder")
                }
                .buttonStyle(.bordered)
                .tint(Color.tokens.accent)
            }
            if let clientId = inquiry.convertedClientId {
                Button {
                    AppRouter.shared.navigate(to: .clientDetail(clientId))
                } label: {
                    Label("Open client", systemImage: "person")
                }
                .buttonStyle(.bordered)
                .tint(Color.tokens.accent)
            }
        }
    }

    private func rawPayloadDisclosure(for inquiry: Inquiry) -> some View {
        DisclosureGroup {
            ScrollView(.horizontal, showsIndicators: false) {
                Text(prettyRawPayload(inquiry.rawPayload) ?? "—")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(Color.tokens.textSecondary)
                    .textSelection(.enabled)
                    .padding(Spacing.sm)
            }
            .background(Color.tokens.bgSecondary)
            .clipShape(RoundedRectangle(cornerRadius: Radius.md))
        } label: {
            Text("Raw payload")
                .font(.tokens.medium(13))
                .foregroundStyle(Color.tokens.textSecondary)
        }
    }

    // MARK: - Mutations

    private func markReadIfNeeded(_ inquiry: Inquiry) async {
        guard !didMarkRead, (inquiry.status ?? .new) == .new else { return }
        didMarkRead = true
        await markStatus(inquiry, .read, swallowOffline: true)
    }

    private func markStatus(
        _ inquiry: Inquiry,
        _ status: InquiryStatus,
        swallowOffline: Bool = false
    ) async {
        let updated = Inquiry(
            id: inquiry.id,
            userId: inquiry.userId,
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            shootType: inquiry.shootType,
            preferredDate: inquiry.preferredDate,
            message: inquiry.message,
            source: inquiry.source,
            sourceHandle: inquiry.sourceHandle,
            status: status,
            rawPayload: inquiry.rawPayload,
            convertedClientId: inquiry.convertedClientId,
            convertedProjectId: inquiry.convertedProjectId,
            createdAt: inquiry.createdAt,
            updatedAt: .now
        )
        isMutating = true
        defer { isMutating = false }
        do {
            _ = try await InquiriesCacheRepository.shared.update(updated, in: context)
            if status != .read {
                Haptics.success()
            }
        } catch {
            let focals = error.asFocalsError()
            if swallowOffline, case .offline = focals { return }
            Haptics.error()
            actionError = focals.errorDescription
        }
    }

    private func convert(_ inquiry: Inquiry, withProject: Bool) async {
        isMutating = true
        defer { isMutating = false }
        do {
            let result = try await InquiriesCacheRepository.shared.convert(
                inquiry,
                creatingProject: withProject,
                in: context
            )
            Haptics.success()
            if let project = result.project {
                AppRouter.shared.popCurrentStack()
                AppRouter.shared.navigate(to: .projectDetail(project.id))
            } else {
                AppRouter.shared.popCurrentStack()
                AppRouter.shared.navigate(to: .clientDetail(result.client.id))
            }
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }

    // MARK: - Helpers

    private var actionErrorBinding: Binding<Bool> {
        Binding(
            get: { actionError != nil },
            set: { if !$0 { actionError = nil } }
        )
    }

    private func tone(for status: InquiryStatus) -> StatusPill.Tone {
        switch status.pillTone {
        case .accent:  return .accent
        case .success: return .success
        case .warning: return .warning
        case .neutral: return .neutral
        }
    }

    private func sectionLabel(_ text: String) -> some View {
        Text(text)
            .font(.tokens.medium(11))
            .textCase(.uppercase)
            .tracking(0.7)
            .foregroundStyle(Color.tokens.textTertiary)
    }

    private func contactRow(symbol: String, label: String, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            HStack(spacing: Spacing.sm) {
                Image(systemName: symbol)
                    .frame(width: 18)
                    .foregroundStyle(Color.tokens.textTertiary)
                Text(label)
                    .font(.tokens.body(14))
                    .foregroundStyle(Color.tokens.accent)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textTertiary)
            }
        }
        .buttonStyle(.plain)
    }

    private func detailRow(symbol: String, label: String, value: String) -> some View {
        HStack(alignment: .top, spacing: Spacing.sm) {
            Image(systemName: symbol)
                .frame(width: 18)
                .foregroundStyle(Color.tokens.textTertiary)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textTertiary)
                Text(value)
                    .font(.tokens.body(14))
                    .foregroundStyle(Color.tokens.textPrimary)
            }
            Spacer()
        }
    }

    private func secondaryButton(
        _ title: String,
        symbol: String,
        disabled: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            Label(title, systemImage: symbol)
                .frame(maxWidth: .infinity, minHeight: 44)
        }
        .buttonStyle(.bordered)
        .tint(Color.tokens.accent)
        .disabled(disabled)
    }

    private func prettyRawPayload(_ payload: AnyCodable?) -> String? {
        guard let payload else { return nil }
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(payload),
              let string = String(data: data, encoding: .utf8) else { return nil }
        return string
    }
}
