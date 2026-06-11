import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct InboxScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedInquiry.createdAt, order: .reverse) private var cached: [CachedInquiry]

    @State private var filter: InquiryFilter = .all
    @State private var search = ""
    @State private var hasLoadedOnce = false
    @State private var actionError: String?

    var body: some View {
        Group {
            if cached.isEmpty && hasLoadedOnce {
                EmptyState(
                    symbol: "tray",
                    title: "No inquiries yet",
                    description: "Inquiries from your widget, email, and manual entries will appear here."
                )
            } else if cached.isEmpty {
                SkeletonList(count: 5)
            } else {
                inquiryList
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Inbox")
        .toolbar { toolbarContent }
        .searchable(text: $search, prompt: "Search inquiries")
        .refreshable { await refresh() }
        .task {
            if !hasLoadedOnce {
                await refresh()
            }
        }
        .alert("Couldn't update", isPresented: actionErrorBinding, presenting: actionError) { _ in
            Button("OK", role: .cancel) {}
        } message: { error in
            Text(error)
        }
    }

    private var inquiryList: some View {
        List {
            filterSection
            ForEach(visibleGrouped, id: \.0) { status, inquiries in
                Section {
                    ForEach(inquiries) { inquiry in
                        Button {
                            Haptics.tap()
                            AppRouter.shared.navigate(to: .inquiryDetail(inquiry.id))
                        } label: {
                            InquiryRow(inquiry: inquiry)
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(rowBackground(for: inquiry))
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                Task { await delete(inquiry) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }

                            if (inquiry.status ?? .new) != .replied {
                                Button {
                                    Haptics.medium()
                                    Task { await markStatus(inquiry, .replied) }
                                } label: {
                                    Label("Replied", systemImage: "envelope.open")
                                }
                                .tint(Color.tokens.warning)
                            }

                            if (inquiry.status ?? .new) != .archived {
                                Button {
                                    Haptics.medium()
                                    Task { await markStatus(inquiry, .archived) }
                                } label: {
                                    Label("Archive", systemImage: "archivebox")
                                }
                                .tint(Color.tokens.textTertiary)
                            }
                        }
                    }
                } header: {
                    HStack {
                        Text(status.displayName)
                            .font(.tokens.medium(11))
                            .textCase(.uppercase)
                            .tracking(0.7)
                            .foregroundStyle(Color.tokens.textTertiary)
                        Spacer()
                        Text("\(inquiries.count)")
                            .font(.tokens.body(11))
                            .foregroundStyle(Color.tokens.textTertiary)
                            .monospacedDigit()
                    }
                }
            }
        }
        .listStyle(.plain)
    }

    @ViewBuilder
    private var filterSection: some View {
        Section {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Spacing.xs) {
                    ForEach(InquiryFilter.allCases, id: \.self) { option in
                        FilterChip(
                            label: option.label,
                            badge: badgeCount(for: option),
                            isSelected: option == filter
                        ) {
                            Haptics.tap()
                            filter = option
                        }
                    }
                }
                .padding(.horizontal, Spacing.md)
                .padding(.vertical, Spacing.xs)
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                AppRouter.shared.presentedSheet = .createInquiry
            } label: {
                Image(systemName: "plus")
            }
            .accessibilityLabel("Manual inquiry")
        }
    }

    // MARK: - Data

    private var modelInquiries: [Inquiry] {
        cached.map { $0.toModel() }
    }

    private var visibleGrouped: [(InquiryStatus, [Inquiry])] {
        modelInquiries
            .filter { filter.matches($0) }
            .matching(search: search.trimmingCharacters(in: .whitespacesAndNewlines))
            .groupedByStatus()
    }

    private func badgeCount(for option: InquiryFilter) -> Int? {
        switch option {
        case .all:                return nil
        case .status(.new):
            let count = modelInquiries.lazy.filter { ($0.status ?? .new) == .new }.count
            return count > 0 ? count : nil
        default:                  return nil
        }
    }

    private func rowBackground(for inquiry: Inquiry) -> Color {
        (inquiry.status ?? .new) == .new ? Color.tokens.bgTertiary : Color.tokens.bgSecondary
    }

    // MARK: - Mutations

    private func refresh() async {
        defer { hasLoadedOnce = true }
        do {
            try await InquiriesCacheRepository.shared.refresh(in: context)
        } catch {
            // Silent — list keeps showing whatever's cached.
        }
    }

    private func markStatus(_ inquiry: Inquiry, _ status: InquiryStatus) async {
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
        do {
            _ = try await InquiriesCacheRepository.shared.update(updated, in: context)
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }

    private func delete(_ inquiry: Inquiry) async {
        do {
            try await InquiriesCacheRepository.shared.delete(id: inquiry.id, in: context)
            Haptics.medium()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }

    private var actionErrorBinding: Binding<Bool> {
        Binding(
            get: { actionError != nil },
            set: { if !$0 { actionError = nil } }
        )
    }
}

private struct FilterChip: View {
    let label: String
    let badge: Int?
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.xs) {
                Text(label)
                    .font(.tokens.medium(12))
                if let badge {
                    Text("\(badge)")
                        .font(.tokens.medium(10))
                        .foregroundStyle(Color.tokens.bg)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 1)
                        .background(Color.tokens.accent)
                        .clipShape(Capsule())
                }
            }
            .foregroundStyle(isSelected ? Color.tokens.textPrimary : Color.tokens.textSecondary)
            .padding(.horizontal, Spacing.sm)
            .padding(.vertical, 6)
            .background(isSelected ? Color.tokens.bgTertiary : Color.clear)
            .overlay(
                Capsule().stroke(
                    isSelected ? Color.tokens.borderSecondary : Color.tokens.border,
                    lineWidth: 0.5
                )
            )
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
