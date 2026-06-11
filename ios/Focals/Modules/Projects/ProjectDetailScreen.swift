import SwiftUI
import SwiftData
import MapKit
import CoreLocation
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct ProjectDetailScreen: View {
    let id: UUID

    @Environment(\.modelContext) private var context
    @Query private var matches: [CachedProject]
    @Query(sort: \CachedClient.fullName, order: .forward) private var cachedClients: [CachedClient]

    @State private var coordinate: CLLocationCoordinate2D?
    @State private var isMutating = false
    @State private var actionError: String?
    @State private var showDeleteConfirm = false
    @State private var showCalendarToast = false

    init(id: UUID) {
        self.id = id
        _matches = Query(
            filter: #Predicate<CachedProject> { $0.serverId == id },
            sort: \CachedProject.updatedAt
        )
    }

    var body: some View {
        Group {
            if let cached = matches.first {
                content(for: cached, project: cached.toModel())
            } else {
                EmptyState(
                    symbol: "folder",
                    title: "Project unavailable",
                    description: "This project may have been deleted or hasn't synced yet."
                )
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle(matches.first?.title ?? "Project")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { toolbarContent }
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
            "Delete this project?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete project", role: .destructive) {
                Task { await delete() }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Linked finances and contracts keep their data; their reference to this project will be cleared.")
        }
        .overlay(alignment: .top) {
            if showCalendarToast {
                Text("Added to iOS Calendar")
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

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        if let project = matches.first?.toModel() {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    AppRouter.shared.presentedSheet = .editProject(project)
                } label: {
                    Image(systemName: "pencil")
                }
                .accessibilityLabel("Edit project")
            }
        }
    }

    @ViewBuilder
    private func content(for cached: CachedProject, project: Project) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                header(for: project)
                summaryTiles(for: project)
                paymentSection(for: project)
                detailsSection(for: project)
                if let location = project.location, !location.isEmpty {
                    mapSection(for: cached, location: location)
                }
                if let notes = project.notes, !notes.isEmpty {
                    notesSection(notes)
                }
                actionsSection(for: project)
                deleteRow
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.lg)
        }
    }

    private func header(for project: Project) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(project.title)
                .editorialHeadline()
                .frame(maxWidth: .infinity, alignment: .leading)
            HStack(spacing: Spacing.sm) {
                if let status = project.status {
                    StatusPill(status.displayName, tone: status.calendarPillTone)
                }
                Text(subtitleLine(for: project))
                    .font(.tokens.body(14))
                    .foregroundStyle(Color.tokens.textSecondary)
                    .lineLimit(1)
            }
        }
    }

    private func subtitleLine(for project: Project) -> String {
        let client = clientName(for: project) ?? "No client"
        if let category = project.category, !category.isEmpty {
            return "\(client) · \(category)"
        }
        return client
    }

    private func clientName(for project: Project) -> String? {
        guard let id = project.clientId else { return nil }
        return cachedClients.first(where: { $0.serverId == id })?.fullName
    }

    // MARK: - Summary tiles

    private func summaryTiles(for project: Project) -> some View {
        let total = project.packagePrice ?? 0
        let paid = project.amountPaid ?? 0
        let balance = max(0, total - paid)
        let fraction = total > 0 ? min(1, max(0, paid / total)) : 0
        let wallClock = project.shootDate.flatMap { CalendarMath.wallClockDate(from: $0) }

        return HStack(spacing: Spacing.sm) {
            summaryTile(label: "Shoot") {
                VStack(alignment: .leading, spacing: 2) {
                    Text(wallClock.map(relativeShootText) ?? "—")
                        .font(.tokens.semibold(19))
                        .foregroundStyle(Color.tokens.textPrimary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(wallClock?.formatted(.dateTime.month(.abbreviated).day()) ?? "Not scheduled")
                        .font(.tokens.body(11))
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
            summaryTile(label: "Balance") {
                VStack(alignment: .leading, spacing: 2) {
                    Text(total > 0 ? money(balance) : "—")
                        .font(.tokens.semibold(19))
                        .foregroundStyle(
                            total > 0
                                ? (balance > 0 ? Color.tokens.warning : Color.tokens.success)
                                : Color.tokens.textPrimary
                        )
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(total > 0 ? (balance > 0 ? "due" : "settled") : "No price")
                        .font(.tokens.body(11))
                        .foregroundStyle(Color.tokens.textTertiary)
                }
            }
            summaryTile(label: "Paid") {
                HStack(spacing: Spacing.sm) {
                    ZStack {
                        Circle()
                            .stroke(Color.tokens.bgTertiary, lineWidth: 4)
                        Circle()
                            .trim(from: 0, to: fraction)
                            .stroke(
                                fraction >= 1 ? Color.tokens.success : Color.tokens.accent,
                                style: StrokeStyle(lineWidth: 4, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                    }
                    .frame(width: 34, height: 34)
                    Text("\(Int(fraction * 100))%")
                        .font(.tokens.semibold(19))
                        .foregroundStyle(Color.tokens.textPrimary)
                        .monospacedDigit()
                }
            }
        }
    }

    private func summaryTile(
        label: String,
        @ViewBuilder value: () -> some View
    ) -> some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text(label.uppercased())
                .font(.tokens.medium(11))
                .tracking(0.6)
                .foregroundStyle(Color.tokens.textTertiary)
            value()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color.tokens.bgSecondary)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.tokens.border, lineWidth: 0.5)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    /// "Today" / "Tomorrow" / "in 9d" for upcoming dates, short date for past.
    private func relativeShootText(_ wallClock: Date) -> String {
        let calendar = Calendar.current
        let days = calendar.dateComponents(
            [.day],
            from: calendar.startOfDay(for: .now),
            to: calendar.startOfDay(for: wallClock)
        ).day ?? 0
        switch days {
        case 0:     return "Today"
        case 1:     return "Tomorrow"
        case 2...:  return "in \(days)d"
        default:    return wallClock.formatted(.dateTime.month(.abbreviated).day())
        }
    }

    private func money(_ value: Double) -> String {
        value.formatted(.currency(code: "USD").precision(.fractionLength(0)))
    }

    private func paymentSection(for project: Project) -> some View {
        let total = project.packagePrice ?? 0
        let paid = project.amountPaid ?? 0
        let balance = max(0, total - paid)
        let fraction = total > 0 ? min(1, paid / total) : 0
        return FormSection("Payment") {
            FormRow("Package price") {
                Text(total, format: .currency(code: "USD"))
                    .font(.tokens.medium(15))
                    .foregroundStyle(Color.tokens.textPrimary)
            }
            FormRow("Amount paid") {
                Text(paid, format: .currency(code: "USD"))
                    .font(.tokens.medium(15))
                    .foregroundStyle(Color.tokens.textPrimary)
            }
            FormRow("Balance due") {
                Text(balance, format: .currency(code: "USD"))
                    .font(.tokens.medium(15))
                    .foregroundStyle(balance > 0 ? Color.tokens.warning : Color.tokens.success)
            }
            if total > 0 {
                GeometryReader { proxy in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.tokens.bgTertiary)
                        Capsule()
                            .fill(fraction >= 1 ? Color.tokens.success : Color.tokens.accent)
                            .frame(width: proxy.size.width * fraction)
                    }
                }
                .frame(height: 6)
            }
            if let status = project.paymentStatus {
                FormRow("Status") {
                    Text(status.rawValue.capitalized)
                        .font(.tokens.body(14))
                        .foregroundStyle(Color.tokens.textPrimary)
                }
            }
        }
    }

    private func detailsSection(for project: Project) -> some View {
        FormSection("Details") {
            if let id = project.clientId,
               let client = cachedClients.first(where: { $0.serverId == id }) {
                Button {
                    AppRouter.shared.navigate(to: .clientDetail(client.serverId))
                } label: {
                    FormRow("Client") {
                        HStack {
                            Text(client.fullName)
                                .font(.tokens.body(14))
                                .foregroundStyle(Color.tokens.accent)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.tokens.body(11))
                                .foregroundStyle(Color.tokens.textTertiary)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
            if let category = project.category, !category.isEmpty {
                FormRow("Category") {
                    Text(category)
                        .font(.tokens.body(14))
                        .foregroundStyle(Color.tokens.textPrimary)
                }
            }
            if let raw = project.shootDate,
               let wallClock = CalendarMath.wallClockDate(from: raw) {
                FormRow("Shoot date") {
                    Text(wallClock.formatted(date: .complete, time: .shortened))
                        .font(.tokens.body(14))
                        .foregroundStyle(Color.tokens.textPrimary)
                }
            }
            if let location = project.location, !location.isEmpty {
                Button {
                    openLocationInMaps(location)
                } label: {
                    FormRow("Location") {
                        HStack {
                            Text(location)
                                .font(.tokens.body(14))
                                .foregroundStyle(Color.tokens.accent)
                                .multilineTextAlignment(.leading)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.tokens.body(11))
                                .foregroundStyle(Color.tokens.textTertiary)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func openLocationInMaps(_ location: String) {
        Haptics.tap()
        if let cached = matches.first,
           let coordinate = cachedCoordinate(for: cached) {
            let placemark = MKPlacemark(coordinate: coordinate)
            let mapItem = MKMapItem(placemark: placemark)
            mapItem.name = location
            mapItem.openInMaps(launchOptions: [:])
        } else if let encoded = location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
                  let url = URL(string: "maps://?q=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }

    private func mapSection(for cached: CachedProject, location: String) -> some View {
        ProjectMapSnapshot(
            location: location,
            initialCoordinate: cachedCoordinate(for: cached),
            onResolved: { coord in
                cached.storeGeocode(lat: coord.latitude, lng: coord.longitude, for: location)
                try? context.save()
            }
        )
    }

    private func notesSection(_ notes: String) -> some View {
        FormSection("Notes") {
            Text(notes)
                .font(.tokens.body(14))
                .foregroundStyle(Color.tokens.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func actionsSection(for project: Project) -> some View {
        VStack(spacing: Spacing.sm) {
            if !EventKitMirror.shared.isEnabled, project.shootDate != nil {
                Button {
                    Task { await mirrorOnce(project) }
                } label: {
                    Label("Add to iOS Calendar", systemImage: "calendar.badge.plus")
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .buttonStyle(.bordered)
                .tint(Color.tokens.accent)
            }
        }
    }

    private var deleteRow: some View {
        Button(role: .destructive) {
            showDeleteConfirm = true
        } label: {
            Label("Delete project", systemImage: "trash")
                .frame(maxWidth: .infinity, minHeight: 44)
        }
        .buttonStyle(.bordered)
        .tint(Color.tokens.danger)
        .disabled(isMutating)
    }

    private func cachedCoordinate(for cached: CachedProject) -> CLLocationCoordinate2D? {
        guard let lat = cached.geocodedLat,
              let lng = cached.geocodedLng,
              cached.geocodedLocation == cached.location else {
            return nil
        }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }

    private func mirrorOnce(_ project: Project) async {
        let mirror = EventKitMirror.shared
        if mirror.accessState == .notDetermined {
            do {
                _ = try await mirror.requestAccess()
            } catch {
                actionError = error.localizedDescription
                return
            }
        }
        guard mirror.accessState == .authorized else {
            actionError = "Calendar access denied. Enable it in Settings → Privacy & Security → Calendars → Focals."
            return
        }
        // Force a one-shot mirror even though the global toggle is off.
        let wasEnabled = mirror.isEnabled
        mirror.isEnabled = true
        await mirror.mirror(project)
        mirror.isEnabled = wasEnabled

        Haptics.success()
        withAnimation { showCalendarToast = true }
        try? await Task.sleep(for: .seconds(2))
        withAnimation { showCalendarToast = false }
    }

    private func delete() async {
        isMutating = true
        defer { isMutating = false }
        do {
            try await ProjectsCacheRepository.shared.delete(id: id, in: context)
            Haptics.medium()
            AppRouter.shared.popCurrentStack()
        } catch {
            Haptics.error()
            actionError = error.asFocalsError().errorDescription
        }
    }
}

/// Static MapKit snapshot. Lazily geocodes the location string the first time
/// the view appears, hands the coordinate back to the parent so it can cache
/// it on `CachedProject` (preventing every render from re-hitting CLGeocoder
/// — which is rate-limited and will start failing silently if abused).
private struct ProjectMapSnapshot: View {
    let location: String
    let initialCoordinate: CLLocationCoordinate2D?
    let onResolved: (CLLocationCoordinate2D) -> Void

    @State private var coordinate: CLLocationCoordinate2D?
    @State private var resolveFailed = false

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.sm) {
            Text("Location")
                .font(.tokens.medium(11))
                .textCase(.uppercase)
                .tracking(0.7)
                .foregroundStyle(Color.tokens.textTertiary)

            Group {
                if let coordinate {
                    Map(initialPosition: .region(MKCoordinateRegion(
                        center: coordinate,
                        latitudinalMeters: 800,
                        longitudinalMeters: 800
                    ))) {
                        Marker(location, coordinate: coordinate)
                    }
                    .frame(height: 180)
                    .clipShape(RoundedRectangle(cornerRadius: Radius.md))
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.md)
                            .stroke(Color.tokens.border, lineWidth: 0.5)
                    )
                    .allowsHitTesting(false)
                    .onTapGesture {
                        openInMaps(coordinate)
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        openInMaps(coordinate)
                    }
                } else if resolveFailed {
                    placeholder("Couldn't pin this address.")
                } else {
                    placeholder("Locating…")
                }
            }
        }
        .task(id: location) { await resolve() }
    }

    private func placeholder(_ text: String) -> some View {
        HStack {
            Image(systemName: "mappin.and.ellipse")
            Text(text)
                .font(.tokens.body(13))
        }
        .foregroundStyle(Color.tokens.textTertiary)
        .frame(maxWidth: .infinity)
        .frame(height: 80)
        .background(Color.tokens.bgSecondary)
        .clipShape(RoundedRectangle(cornerRadius: Radius.md))
    }

    private func resolve() async {
        if let initialCoordinate {
            coordinate = initialCoordinate
            return
        }
        let geocoder = CLGeocoder()
        do {
            let placemarks = try await geocoder.geocodeAddressString(location)
            if let coord = placemarks.first?.location?.coordinate {
                coordinate = coord
                onResolved(coord)
            } else {
                resolveFailed = true
            }
        } catch {
            resolveFailed = true
        }
    }

    private func openInMaps(_ coordinate: CLLocationCoordinate2D) {
        Haptics.tap()
        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = location
        mapItem.openInMaps(launchOptions: [:])
    }
}
