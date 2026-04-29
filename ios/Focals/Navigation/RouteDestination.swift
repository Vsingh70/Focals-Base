import SwiftUI
import FocalsModels

// Single source of truth for `Route -> View` and `SheetRoute -> View`
// dispatch. Both shells (iPhone TabBarShell, iPad SplitViewShell) call
// these so the wiring stays in one place — when a real screen replaces a
// placeholder in Tasks 06–14, only this file needs to know.

@ViewBuilder
func routeDestination(_ route: Route) -> some View {
    switch route {
    // Top-level
    case .dashboard:               DashboardScreen()
    case .inbox:                   InboxScreen()
    case .calendar:                CalendarScreen()
    case .projects:                ProjectsScreen()
    case .clients:                 ClientsScreen()
    case .finances:                FinancesScreen()
    case .contracts:               ContractsScreen()
    case .gear:                    GearScreen()
    case .forms:                   FormsScreen()
    case .links:                   LinksScreen()
    case .help:                    HelpScreen()
    case .settings:                SettingsScreen()
    case .projectUpload:           ProjectUploadScreen()

    // Detail
    case .projectDetail(let id):   ProjectDetailScreen(id: id)
    case .clientDetail(let id):    ClientDetailScreen(id: id)
    case .contractDetail(let id):  ContractDetailScreen(id: id)
    case .contractNew:             ContractNewScreen()
    case .contractTemplates:       ContractTemplatesScreen()
    case .helpArticle(let slug):   HelpArticleScreen(slug: slug)
    case .inquiryDetail(let id):   InquiryDetailScreen(id: id)
    }
}

@ViewBuilder
func sheetDestination(_ sheet: SheetRoute) -> some View {
    // Each case here is a placeholder until the owning task replaces it
    // with the real form. Wrapped in DetailSheet so every sheet inherits
    // the same chrome (drag indicator, medium/large detents, Done button).
    switch sheet {
    case .createProject(let presetShootDate):
        DetailSheet(title: "New project") {
            EmptyState(
                symbol: "folder.badge.plus",
                title: "New project",
                description: presetShootDate
                    .map { "Coming in Task 09. Prefilled date: \($0.formatted(date: .abbreviated, time: .shortened))" }
                    ?? "Coming in Task 09."
            )
        }

    case .createClient(let prefilled):
        DetailSheet(title: "New client") {
            EmptyState(
                symbol: "person.badge.plus",
                title: "New client",
                description: prefilled
                    .map { "Coming in Task 09. Prefilled: \($0.fullName)" }
                    ?? "Coming in Task 09."
            )
        }

    case .createInquiry:
        DetailSheet(title: "New inquiry") {
            EmptyState(
                symbol: "envelope.badge",
                title: "New inquiry",
                description: "Coming in Task 07."
            )
        }

    case .createFinance(let preselectedType):
        DetailSheet(title: "New entry") {
            EmptyState(
                symbol: "dollarsign.circle",
                title: "New finance entry",
                description: preselectedType
                    .map { "Coming in Task 10. Type: \($0.rawValue)" }
                    ?? "Coming in Task 10."
            )
        }

    case .projectUpload:
        DetailSheet(title: "Import projects") {
            EmptyState(
                symbol: "square.and.arrow.down",
                title: "Import from file",
                description: "Coming in Task 15."
            )
        }
    }
}
