import SwiftUI
import SwiftData
import UIKit
import UserNotifications
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct SettingsScreen: View {
    @Environment(\.modelContext) private var context

    @State private var profileFullName = ""
    @State private var profileBusinessName = ""
    @State private var profileWebsite = ""
    @State private var profileInstagram = ""
    @State private var isProfileSaving = false
    @State private var profileError: String?

    @State private var mirrorEnabled = EventKitMirror.shared.isEnabled
    @State private var calendarToken: String = ""

    @State private var inquiryAlertsEnabled = UserDefaults.standard.bool(forKey: PushManager.Preferences.inquiryAlertsKey)
    @State private var projectRemindersEnabled = UserDefaults.standard.bool(forKey: PushManager.Preferences.projectRemindersKey)
    @State private var pushAuthStatus: UNAuthorizationStatus = .notDetermined
    @State private var faceIDEnabled = UserDefaults.standard.bool(forKey: "FaceIDLockEnabled")

    @State private var actionMessage: String?
    @State private var showSignOutConfirm = false
    @State private var showClearCacheConfirm = false

    private var appVersion: String {
        let v = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0.0"
        let b = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(v) (\(b))"
    }

    var body: some View {
        Form {
            profileSection
            calendarSection
            notificationsSection
            securitySection
            dataSection
            aboutSection
        }
        .scrollContentBackground(.hidden)
        .background(Color.tokens.bg)
        .navigationTitle("Settings")
        .task {
            loadProfile()
            await refreshNotificationStatus()
        }
        .alert(
            "Couldn't update",
            isPresented: Binding(
                get: { actionMessage != nil },
                set: { if !$0 { actionMessage = nil } }
            ),
            presenting: actionMessage
        ) { _ in
            Button("OK", role: .cancel) {}
        } message: { msg in Text(msg) }
        .confirmationDialog(
            "Sign out of Focals?",
            isPresented: $showSignOutConfirm,
            titleVisibility: .visible
        ) {
            Button("Sign out", role: .destructive) {
                Task { try? await SessionStore.shared.signOut() }
            }
            Button("Cancel", role: .cancel) {}
        }
        .confirmationDialog(
            "Clear local cache?",
            isPresented: $showClearCacheConfirm,
            titleVisibility: .visible
        ) {
            Button("Clear cache", role: .destructive) { clearCache() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Removes the on-device snapshot. Data is re-fetched on next launch.")
        }
    }

    // MARK: - Profile

    private var profileSection: some View {
        Section("Profile") {
            TextField("Full name", text: $profileFullName)
                .textContentType(.name)
            TextField("Business name", text: $profileBusinessName)
            TextField("Website", text: $profileWebsite)
                .textContentType(.URL)
                .keyboardType(.URL)
                .autocapitalization(.none)
            TextField("Instagram handle", text: $profileInstagram)
                .autocapitalization(.none)

            if let profileError {
                Text(profileError)
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.danger)
            }

            Button {
                Task { await saveProfile() }
            } label: {
                if isProfileSaving {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Text("Save profile").frame(maxWidth: .infinity)
                }
            }
            .disabled(isProfileSaving)
        }
    }

    // MARK: - Calendar

    private var calendarSection: some View {
        Section("Calendar") {
            Toggle("Mirror projects to iOS Calendar", isOn: Binding(
                get: { mirrorEnabled },
                set: { newValue in
                    Task { await toggleMirror(to: newValue) }
                }
            ))
            Text("Adds shoot-date projects to a dedicated \"Focals\" calendar in the iOS Calendar app. Edits sync automatically.")
                .font(.tokens.body(11))
                .foregroundStyle(Color.tokens.textTertiary)

            if !calendarToken.isEmpty {
                Button {
                    subscribeInAppleCalendar()
                } label: {
                    Label("Subscribe in Apple Calendar", systemImage: "calendar.badge.plus")
                }
            }
        }
    }

    // MARK: - Notifications

    private var notificationsSection: some View {
        Section("Notifications") {
            switch pushAuthStatus {
            case .notDetermined:
                Button {
                    Task { await enablePushPrompt() }
                } label: {
                    Label("Turn on notifications", systemImage: "bell.badge")
                }
                Text("New inquiries and project reminders. Allow once and toggle individual types below.")
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textTertiary)
            case .denied:
                Button {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                } label: {
                    Label("Enable in Settings", systemImage: "gearshape")
                }
                Text("Notifications are off for Focals. Toggle them on in System Settings → Notifications → Focals.")
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textTertiary)
            default:
                Toggle("New inquiry alerts", isOn: Binding(
                    get: { inquiryAlertsEnabled },
                    set: { newValue in
                        inquiryAlertsEnabled = newValue
                        UserDefaults.standard.set(newValue, forKey: PushManager.Preferences.inquiryAlertsKey)
                    }
                ))
                Toggle("Project reminders (24h before)", isOn: Binding(
                    get: { projectRemindersEnabled },
                    set: { newValue in
                        projectRemindersEnabled = newValue
                        UserDefaults.standard.set(newValue, forKey: PushManager.Preferences.projectRemindersKey)
                    }
                ))
                Text("Server-side toggles. Filtering is applied when the Edge Function dispatches a push, so changes take effect immediately.")
                    .font(.tokens.body(11))
                    .foregroundStyle(Color.tokens.textTertiary)
            }
        }
    }

    // MARK: - Security

    private var securitySection: some View {
        Section("Security") {
            Toggle("Require Face ID to open", isOn: Binding(
                get: { faceIDEnabled },
                set: { newValue in
                    faceIDEnabled = newValue
                    UserDefaults.standard.set(newValue, forKey: "FaceIDLockEnabled")
                }
            ))
            Text("Takes effect on next cold launch.")
                .font(.tokens.body(11))
                .foregroundStyle(Color.tokens.textTertiary)
        }
    }

    // MARK: - Data

    private var dataSection: some View {
        Section("Data") {
            Button {
                Task { await resetTutorials() }
            } label: {
                Label("Reset tutorials", systemImage: "arrow.counterclockwise")
            }

            Button(role: .destructive) {
                showClearCacheConfirm = true
            } label: {
                Label("Clear local cache", systemImage: "trash")
            }

            Button(role: .destructive) {
                showSignOutConfirm = true
            } label: {
                Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
            }
        }
    }

    // MARK: - About

    private var aboutSection: some View {
        Section("About") {
            LabeledContent("Version", value: appVersion)
            if let url = URL(string: "mailto:hello@focals.app") {
                Link(destination: url) {
                    Label("Send feedback", systemImage: "envelope")
                }
            }
        }
    }

    // MARK: - Profile actions

    private func loadProfile() {
        guard let profile = SessionStore.shared.profile else { return }
        profileFullName = profile.fullName ?? ""
        profileBusinessName = profile.businessName ?? ""
        profileWebsite = profile.website ?? ""
        profileInstagram = profile.instagramHandle ?? ""
        calendarToken = profile.calendarToken
    }

    private func saveProfile() async {
        guard let current = SessionStore.shared.profile else {
            profileError = "Profile isn't loaded yet."
            return
        }
        isProfileSaving = true
        defer { isProfileSaving = false }
        let payload = Profile(
            id: current.id,
            fullName: profileFullName.isEmpty ? nil : profileFullName,
            email: current.email,
            avatarUrl: current.avatarUrl,
            businessName: profileBusinessName.isEmpty ? nil : profileBusinessName,
            website: profileWebsite.isEmpty ? nil : profileWebsite,
            instagramHandle: profileInstagram.isEmpty ? nil : profileInstagram,
            calendarToken: current.calendarToken,
            tutorialProgress: current.tutorialProgress,
            createdAt: current.createdAt,
            updatedAt: .now
        )
        do {
            _ = try await ProfileRepository.shared.update(payload)
            Haptics.success()
        } catch {
            Haptics.error()
            profileError = error.asFocalsError().errorDescription
        }
    }

    private func resetTutorials() async {
        guard let current = SessionStore.shared.profile else { return }
        let payload = Profile(
            id: current.id,
            fullName: current.fullName,
            email: current.email,
            avatarUrl: current.avatarUrl,
            businessName: current.businessName,
            website: current.website,
            instagramHandle: current.instagramHandle,
            calendarToken: current.calendarToken,
            tutorialProgress: TutorialProgress(completedSteps: [], dismissed: false),
            createdAt: current.createdAt,
            updatedAt: .now
        )
        do {
            _ = try await ProfileRepository.shared.update(payload)
            Haptics.success()
            actionMessage = "Tutorials reset. Re-launch the app to see them."
        } catch {
            Haptics.error()
            actionMessage = error.asFocalsError().errorDescription
        }
    }

    // MARK: - Calendar actions

    private func toggleMirror(to enabled: Bool) async {
        if enabled {
            do {
                let granted = try await EventKitMirror.shared.requestAccess()
                guard granted else {
                    actionMessage = "Calendar access was denied. Enable it in Settings → Privacy & Security → Calendars → Focals."
                    mirrorEnabled = false
                    return
                }
            } catch {
                actionMessage = error.localizedDescription
                mirrorEnabled = false
                return
            }
        }
        EventKitMirror.shared.isEnabled = enabled
        mirrorEnabled = enabled
        if enabled {
            // Bulk-mirror existing projects so the iOS Calendar catches up.
            let cached = (try? ProjectsCacheRepository.shared.cached(in: context)) ?? []
            await EventKitMirror.shared.bulkMirror(cached)
        }
    }

    private func subscribeInAppleCalendar() {
        guard let userId = SessionStore.shared.user?.id, !calendarToken.isEmpty else { return }
        let webcalURL = "webcal://focals-base.vercel.app/api/calendar/\(userId.uuidString.lowercased())?token=\(calendarToken)"
        if let url = URL(string: webcalURL) {
            UIApplication.shared.open(url)
        }
    }

    // MARK: - Notification actions

    private func refreshNotificationStatus() async {
        pushAuthStatus = await PushManager.shared.currentAuthorization()
    }

    private func enablePushPrompt() async {
        let granted = await PushManager.shared.requestAuthorization()
        await refreshNotificationStatus()
        if granted {
            // Default both toggles ON when the user just opted in.
            UserDefaults.standard.set(true, forKey: PushManager.Preferences.inquiryAlertsKey)
            UserDefaults.standard.set(true, forKey: PushManager.Preferences.projectRemindersKey)
            inquiryAlertsEnabled = true
            projectRemindersEnabled = true
        }
    }

    // MARK: - Cache actions

    private func clearCache() {
        guard let userId = SessionStore.shared.user?.id else { return }
        try? CacheContainer.wipe(userId: userId)
        URLCache.shared.removeAllCachedResponses()
        Haptics.medium()
        actionMessage = "Cache cleared. Pull-to-refresh on any list to re-fetch."
    }
}
