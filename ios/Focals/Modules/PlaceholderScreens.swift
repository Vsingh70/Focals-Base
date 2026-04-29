import SwiftUI

// MARK: Top-level module placeholders
//
// Each is a thin EmptyState pointing at the task that fills it in.
// Replaced one by one in Tasks 06–14. Living in one file because they're
// all identical-shaped stubs and there's no value in a file per screen
// until they have actual content.

struct DashboardScreen: View {
    var body: some View {
        EmptyState(
            symbol: "house",
            title: "Dashboard",
            description: "Coming in Task 06."
        )
        .navigationTitle("Today")
    }
}

struct InboxScreen: View {
    var body: some View {
        EmptyState(
            symbol: "tray",
            title: "Inbox",
            description: "Coming in Task 07."
        )
        .navigationTitle("Inbox")
    }
}

struct CalendarScreen: View {
    var body: some View {
        EmptyState(
            symbol: "calendar",
            title: "Calendar",
            description: "Coming in Task 08."
        )
        .navigationTitle("Calendar")
    }
}

struct ProjectsScreen: View {
    var body: some View {
        EmptyState(
            symbol: "folder",
            title: "Projects",
            description: "Coming in Task 09."
        )
        .navigationTitle("Projects")
    }
}

struct ClientsScreen: View {
    var body: some View {
        EmptyState(
            symbol: "person.2",
            title: "Clients",
            description: "Coming in Task 09."
        )
        .navigationTitle("Clients")
    }
}

struct FinancesScreen: View {
    var body: some View {
        EmptyState(
            symbol: "dollarsign.circle",
            title: "Finances",
            description: "Coming in Task 10."
        )
        .navigationTitle("Finances")
    }
}

struct ContractsScreen: View {
    var body: some View {
        EmptyState(
            symbol: "doc.text",
            title: "Contracts",
            description: "Coming in Task 11."
        )
        .navigationTitle("Contracts")
    }
}

struct GearScreen: View {
    var body: some View {
        EmptyState(
            symbol: "camera.aperture",
            title: "Gear",
            description: "Coming in Task 12."
        )
        .navigationTitle("Gear")
    }
}

struct FormsScreen: View {
    var body: some View {
        EmptyState(
            symbol: "list.bullet.rectangle",
            title: "Forms",
            description: "Coming in Task 12."
        )
        .navigationTitle("Forms")
    }
}

struct LinksScreen: View {
    var body: some View {
        EmptyState(
            symbol: "link",
            title: "Links",
            description: "Coming in Task 12."
        )
        .navigationTitle("Links")
    }
}

struct HelpScreen: View {
    var body: some View {
        EmptyState(
            symbol: "questionmark.circle",
            title: "Help",
            description: "Coming in Task 12."
        )
        .navigationTitle("Help")
    }
}

struct SettingsScreen: View {
    var body: some View {
        // Placeholder until Task 12 lands the real settings screen.
        // Task 04's acceptance bar requires sign-out to remain reachable
        // from the shell, so the EmptyState carries the action.
        EmptyState(
            symbol: "gear",
            title: "Settings",
            description: "Coming in Task 12.",
            cta: EmptyState.CTA(label: "Sign out") {
                Task { try? await SessionStore.shared.signOut() }
            }
        )
        .navigationTitle("Settings")
    }
}

struct ProjectUploadScreen: View {
    var body: some View {
        EmptyState(
            symbol: "square.and.arrow.down",
            title: "Import projects",
            description: "Coming in Task 15."
        )
        .navigationTitle("Import")
    }
}

struct MoreScreen: View {
    var body: some View {
        // Real implementation in Task 04 below — list of secondary modules.
        // Lives here as a placeholder so routeDestination compiles before
        // the shell adds the real list view.
        EmptyState(
            symbol: "ellipsis.circle",
            title: "More",
            description: "Tap a module above."
        )
        .navigationTitle("More")
    }
}

// MARK: Detail screen placeholders
//
// These get pushed onto a NavigationStack. They show the id/slug they were
// pushed with so route plumbing is verifiable end-to-end before the real
// detail content lands.

struct ProjectDetailScreen: View {
    let id: UUID
    var body: some View {
        EmptyState(
            symbol: "folder",
            title: "Project detail",
            description: "Coming in Task 09. ID: \(id.uuidString.prefix(8))…"
        )
        .navigationTitle("Project")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ClientDetailScreen: View {
    let id: UUID
    var body: some View {
        EmptyState(
            symbol: "person",
            title: "Client detail",
            description: "Coming in Task 09. ID: \(id.uuidString.prefix(8))…"
        )
        .navigationTitle("Client")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ContractDetailScreen: View {
    let id: UUID
    var body: some View {
        EmptyState(
            symbol: "doc.text",
            title: "Contract detail",
            description: "Coming in Task 11. ID: \(id.uuidString.prefix(8))…"
        )
        .navigationTitle("Contract")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ContractNewScreen: View {
    var body: some View {
        EmptyState(
            symbol: "doc.badge.plus",
            title: "New contract",
            description: "Coming in Task 11."
        )
        .navigationTitle("New contract")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ContractTemplatesScreen: View {
    var body: some View {
        EmptyState(
            symbol: "doc.on.doc",
            title: "Contract templates",
            description: "Coming in Task 11."
        )
        .navigationTitle("Templates")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct HelpArticleScreen: View {
    let slug: String
    var body: some View {
        EmptyState(
            symbol: "book",
            title: "Help article",
            description: "Coming in Task 12. Slug: \(slug)"
        )
        .navigationTitle(slug.capitalized)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct InquiryDetailScreen: View {
    let id: UUID
    var body: some View {
        EmptyState(
            symbol: "envelope",
            title: "Inquiry detail",
            description: "Coming in Task 07. ID: \(id.uuidString.prefix(8))…"
        )
        .navigationTitle("Inquiry")
        .navigationBarTitleDisplayMode(.inline)
    }
}
