import SwiftUI
import SwiftData
import UIKit
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct ClientDetailScreen: View {
    let id: UUID

    @Environment(\.modelContext) private var context
    @Query private var matches: [CachedClient]
    @Query private var allProjects: [CachedProject]
    @Query private var inquiries: [CachedInquiry]

    @State private var actionError: String?
    @State private var showDeleteConfirm = false
    @State private var contactsToast: String?

    init(id: UUID) {
        self.id = id
        _matches = Query(
            filter: #Predicate<CachedClient> { $0.serverId == id },
            sort: \CachedClient.fullName
        )
        _allProjects = Query(
            filter: #Predicate<CachedProject> { $0.clientId == id },
            sort: \CachedProject.updatedAt,
            order: .reverse
        )
        _inquiries = Query(
            filter: #Predicate<CachedInquiry> { $0.convertedClientId == id },
            sort: \CachedInquiry.createdAt,
            order: .reverse
        )
    }

    var body: some View {
        Group {
            if let cached = matches.first {
                content(client: cached.toModel())
            } else {
                EmptyState(
                    symbol: "person",
                    title: "Client unavailable",
                    description: "This client may have been deleted or hasn't synced yet."
                )
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle(matches.first?.fullName ?? "Client")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let client = matches.first?.toModel() {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        AppRouter.shared.presentedSheet = .editClient(client)
                    } label: {
                        Image(systemName: "pencil")
                    }
                    .accessibilityLabel("Edit client")
                }
            }
        }
        .alert(
            "Couldn't update",
            isPresented: Binding(
                get: { actionError != nil },
                set: { if !$0 { actionError = nil } }
            ),
            presenting: actionError
        ) { _ in
            Button("OK", role: .cancel) {}
        } message: { error in
            Text(error)
        }
        .confirmationDialog(
            "Delete this client?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete client", role: .destructive) {
                Task { await delete() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Linked projects keep their data; their reference to this client will be cleared.")
        }
        .overlay(alignment: .top) {
            if let toast = contactsToast {
                Text(toast)
                    .font(.tokens.medium(13))
                    .foregroundStyle(Color.tokens.textPrimary)
                    .padding(.horizontal, Spacing.md)
                    .padding(.vertical, Spacing.sm)
                    .background(Color.tokens.bgTertiary)
                    .clipShape(Capsule())
                    .padding(.top, Spacing.sm)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }

    @ViewBuilder
    private func content(client: Client) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                header(client)
                contactSection(client)
                actionsSection(client)
                projectsSection
                inquiriesSection
                if let notes = client.notes, !notes.isEmpty {
                    notesSection(notes)
                }
                deleteRow
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.lg)
        }
    }

    private func header(_ client: Client) -> some View {
        HStack(spacing: Spacing.md) {
            ClientAvatar(name: client.fullName, size: 56)
            VStack(alignment: .leading, spacing: 2) {
                Text(client.fullName)
                    .editorialHeadline()
                if let source = client.source, !source.isEmpty {
                    StatusPill(source.replacingOccurrences(of: "_", with: " ").capitalized, tone: .neutral)
                }
            }
            Spacer()
        }
    }

    @ViewBuilder
    private func contactSection(_ client: Client) -> some View {
        if client.email != nil || client.phone != nil {
            FormSection("Contact") {
                if let email = client.email, !email.isEmpty {
                    contactRow(symbol: "envelope", label: email) {
                        if let url = URL(string: "mailto:\(email)") {
                            UIApplication.shared.open(url)
                        }
                    }
                }
                if let phone = client.phone, !phone.isEmpty {
                    contactRow(symbol: "phone", label: phone) {
                        let stripped = phone.filter { "+0123456789".contains($0) }
                        if let url = URL(string: "tel:\(stripped)") {
                            UIApplication.shared.open(url)
                        }
                    }
                }
            }
        }
    }

    private func actionsSection(_ client: Client) -> some View {
        Button {
            Task { await addToContacts(client) }
        } label: {
            Label("Add to Contacts", systemImage: "person.crop.circle.badge.plus")
                .frame(maxWidth: .infinity, minHeight: 44)
        }
        .buttonStyle(.bordered)
        .tint(Color.tokens.accent)
    }

    private var projectsSection: some View {
        Group {
            if !allProjects.isEmpty {
                FormSection("Projects") {
                    ForEach(allProjects, id: \.serverId) { cached in
                        Button {
                            AppRouter.shared.navigate(to: .projectDetail(cached.serverId))
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(cached.title)
                                        .font(.tokens.body(14))
                                        .foregroundStyle(Color.tokens.textPrimary)
                                        .lineLimit(1)
                                    if let raw = cached.shootDate,
                                       let wallClock = CalendarMath.wallClockDate(from: raw) {
                                        Text(wallClock.formatted(.dateTime.month(.abbreviated).day().year()))
                                            .font(.tokens.body(11))
                                            .foregroundStyle(Color.tokens.textTertiary)
                                    }
                                }
                                Spacer()
                                if let status = cached.status.flatMap(ProjectStatus.init(rawValue:)) {
                                    StatusPill(status.displayName, tone: status.calendarPillTone)
                                }
                                Image(systemName: "chevron.right")
                                    .font(.tokens.body(11))
                                    .foregroundStyle(Color.tokens.textTertiary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var inquiriesSection: some View {
        Group {
            if !inquiries.isEmpty {
                FormSection("Linked inquiries") {
                    ForEach(inquiries, id: \.serverId) { cached in
                        Button {
                            AppRouter.shared.navigate(to: .inquiryDetail(cached.serverId))
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(cached.name)
                                        .font(.tokens.body(14))
                                        .foregroundStyle(Color.tokens.textPrimary)
                                    Text(cached.createdAt.formatted(.dateTime.month(.abbreviated).day().year()))
                                        .font(.tokens.body(11))
                                        .foregroundStyle(Color.tokens.textTertiary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.tokens.body(11))
                                    .foregroundStyle(Color.tokens.textTertiary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private func notesSection(_ notes: String) -> some View {
        FormSection("Notes") {
            Text(notes)
                .font(.tokens.body(14))
                .foregroundStyle(Color.tokens.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var deleteRow: some View {
        Button(role: .destructive) {
            showDeleteConfirm = true
        } label: {
            Label("Delete client", systemImage: "trash")
                .frame(maxWidth: .infinity, minHeight: 44)
        }
        .buttonStyle(.bordered)
        .tint(Color.tokens.danger)
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

    // MARK: - Mutations

    private func addToContacts(_ client: Client) async {
        do {
            _ = try await ContactsBridge.shared.upsertContact(from: client)
            Haptics.success()
            await showToast("Added to Contacts")
        } catch let error as ContactsBridge.AccessError {
            Haptics.error()
            actionError = error.errorDescription
        } catch {
            Haptics.error()
            actionError = error.localizedDescription
        }
    }

    private func showToast(_ message: String) async {
        withAnimation { contactsToast = message }
        try? await Task.sleep(for: .seconds(2))
        withAnimation { contactsToast = nil }
    }

    private func delete() async {
        do {
            try await ClientsCacheRepository.shared.delete(id: id, in: context)
            Haptics.medium()
            try? await ProjectsCacheRepository.shared.refresh(in: context)
            AppRouter.shared.popCurrentStack()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }
}
