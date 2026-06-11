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
    case .financesPnL:             PnLScreen()
    }
}

@ViewBuilder
func sheetDestination(_ sheet: SheetRoute) -> some View {
    // Each case here is a placeholder until the owning task replaces it
    // with the real form. Wrapped in DetailSheet so every sheet inherits
    // the same chrome (drag indicator, medium/large detents, Done button).
    switch sheet {
    case .createProject(let presetShootDate):
        ProjectForm(mode: .create(presetShootDate: presetShootDate))

    case .editProject(let project):
        ProjectForm(mode: .edit(project))

    case .createClient(let prefilled):
        ClientForm(mode: .create(prefilled: prefilled))

    case .editClient(let client):
        ClientForm(mode: .edit(client))

    case .createInquiry:
        CreateInquirySheet()

    case .createFinance(let preselectedType):
        TransactionForm(mode: .create(defaultType: preselectedType ?? .expense))

    case .editFinance(let tx):
        TransactionForm(mode: .edit(tx))

    case .createGear:
        GearForm(mode: .create)

    case .editGear(let gear):
        GearForm(mode: .edit(gear))

    case .createLink:
        LinkForm(mode: .create)

    case .editLink(let link):
        LinkForm(mode: .edit(link))

    case .projectUpload:
        ProjectUploadSheet()
    }
}
