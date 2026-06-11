import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct DashboardScreen: View {
    @Environment(\.modelContext) private var context
    @State private var snapshot: DashboardSnapshot?
    @State private var isRefreshing = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.md) {
                Text(greeting)
                    .editorialHeadline()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, Spacing.xs)

                if let snapshot {
                    kpiGrid(snapshot)
                    RevenueChart(data: snapshot.revenueByMonth)
                    if !snapshot.projectStatusBreakdown.isEmpty {
                        ProjectStatusDonut(breakdown: snapshot.projectStatusBreakdown)
                    }
                    if !snapshot.nextSevenDaysProjects.isEmpty {
                        sectionHeader("Upcoming")
                        UpcomingProjectsStrip(projects: snapshot.nextSevenDaysProjects)
                            .padding(.horizontal, -Spacing.md)
                    }
                    sectionHeader("Quick actions")
                    QuickActions()
                } else {
                    SkeletonList(count: 4)
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.bottom, Spacing.lg)
        }
        .background(Color.tokens.bg)
        .navigationTitle("Today")
        .refreshable { await refresh() }
        .task { await refresh() }
    }

    private func refresh() async {
        guard !isRefreshing else { return }
        isRefreshing = true
        defer { isRefreshing = false }

        // Recompute from whatever's cached first so the UI shows numbers
        // immediately instead of waiting on the network round-trip.
        recomputeFromCache()

        // Refresh underlying caches in parallel. Errors are swallowed —
        // the cached snapshot stays on screen if the network is down.
        async let projectsRefresh: () = ProjectsCacheRepository.shared.refresh(in: context)
        async let financesRefresh: () = FinancesCacheRepository.shared.refresh(in: context)
        _ = try? await projectsRefresh
        _ = try? await financesRefresh

        recomputeFromCache()
    }

    private func recomputeFromCache() {
        let projects = (try? ProjectsCacheRepository.shared.cached(in: context)) ?? []
        let finances = (try? FinancesCacheRepository.shared.cached(in: context)) ?? []
        snapshot = DashboardCalculations.snapshot(projects: projects, finances: finances)
    }

    @ViewBuilder
    private func kpiGrid(_ s: DashboardSnapshot) -> some View {
        let trend = s.revenueByMonth.map { NSDecimalNumber(decimal: $0.income).doubleValue }
        LazyVGrid(
            columns: [GridItem(.flexible(), spacing: Spacing.sm),
                      GridItem(.flexible(), spacing: Spacing.sm)],
            spacing: Spacing.sm
        ) {
            KPICard(
                label: "Revenue MTD",
                value: s.revenueMTD.dashboardCurrencyString,
                trend: trend
            )
            KPICard(label: "Active Projects", value: "\(s.activeProjects)")
            KPICard(label: "Upcoming", value: "\(s.upcomingProjects)")
            KPICard(
                label: "Pending",
                value: s.pendingRevenue.dashboardCurrencyString,
                trendColor: Color.tokens.warning
            )
        }
    }

    @ViewBuilder
    private func sectionHeader(_ text: String) -> some View {
        Text(text)
            .font(.tokens.medium(13))
            .textCase(.uppercase)
            .tracking(0.7)
            .foregroundStyle(Color.tokens.textTertiary)
            .padding(.top, Spacing.sm)
    }

    private var greeting: String {
        Self.greeting(now: .now, profile: SessionStore.shared.profile)
    }

    /// Pulled out as a static so it's testable (mock `now`) without spinning
    /// up a SessionStore. Kept internal so future tests can call it.
    static func greeting(now: Date, profile: Profile?) -> String {
        let hour = Calendar.current.component(.hour, from: now)
        let phase: String
        switch hour {
        case 0..<5:    phase = "Working late"
        case 5..<12:   phase = "Good morning"
        case 12..<17:  phase = "Good afternoon"
        case 17..<22:  phase = "Good evening"
        default:       phase = "Working late"
        }
        let firstName = profile?.fullName?
            .split(separator: " ")
            .first
            .map(String.init) ?? ""
        return firstName.isEmpty ? phase : "\(phase), \(firstName)"
    }
}
