import Foundation

/// Static help index. Lives in-app for v1 — keeps Help offline-first and
/// avoids a webapp endpoint dependency. Update this struct when shipping a
/// new help article and re-cut the build.
///
/// v1.1 plan: fetch articles from `https://focals-base.vercel.app/help/<slug>/markdown`
/// (web change required) and cache in URLCache.
struct HelpArticle: Identifiable, Hashable {
    let slug: String
    let title: String
    let section: String
    let body: String

    var id: String { slug }
}

enum HelpArticles {
    static let all: [HelpArticle] = [
        HelpArticle(
            slug: "getting-started",
            title: "Getting started",
            section: "Getting started",
            body: """
            # Welcome to Focals

            Focals helps photographers manage inquiries, projects, clients, finances, and contracts in one place.

            ## First steps
            - Add your first **client** from the More tab
            - Create a **project** from the Projects tab — link it to a client and set a shoot date
            - Track **income and expenses** under Finances
            - Generate a **contract** for a project from a saved template

            ## Tips
            - Pull-to-refresh on any list to sync with the server
            - Long-press a row for quick actions
            - Settings → enable iOS Calendar mirror to see projects in the system Calendar app
            """
        ),
        HelpArticle(
            slug: "inquiry-widget",
            title: "Embedding the inquiry widget",
            section: "Inquiries",
            body: """
            # Embedding the inquiry widget

            Drop the widget anywhere on your portfolio site to capture inquiries directly into your inbox.

            ```html
            <script src="https://focals-base.vercel.app/widget.js" data-token="YOUR_TOKEN"></script>
            ```

            Inquiries will land in the **Inbox** tab. Tap one to convert it into a client and project in a single step.
            """
        ),
        HelpArticle(
            slug: "calendar-sync",
            title: "Syncing with Apple Calendar",
            section: "Calendar",
            body: """
            # Syncing with Apple Calendar

            Two options:

            ## Live mirror (recommended)
            Settings → **Mirror projects to iOS Calendar**. Projects with a shoot date appear in a dedicated "Focals" calendar; edits propagate automatically.

            ## Subscription feed
            Settings → **Subscribe in Apple Calendar**. Read-only — opens an iCal feed served by the web. The feed updates whenever the web's data changes.
            """
        ),
        HelpArticle(
            slug: "contracts",
            title: "Creating contracts from templates",
            section: "Contracts",
            body: """
            # Creating contracts from templates

            Templates are managed on the web at `/contracts/templates`. iOS shows them read-only.

            ## Drafting a contract
            1. Tap **New** in the Contracts tab
            2. Pick a client and (optionally) a project — `{{client_name}}`, `{{project_title}}`, `{{shoot_date}}`, etc. auto-substitute
            3. Pick a template — its body is dropped in, with merge fields filled
            4. Review and edit, then **Save draft**

            ## Status workflow
            **Draft → Sent → Signed**, or **Void** at any step. Use the menu in the contract detail screen.
            """
        ),
        HelpArticle(
            slug: "finances",
            title: "Logging income and expenses",
            section: "Finances",
            body: """
            # Logging income and expenses

            Use the **+** menu in Finances to log income or expenses. Both have the same fields:
            amount, date, category, payment method, optional project link, and notes.

            ## P&L
            Tap **P&L** in the toolbar for a quick income / expense / net profit summary, plus a 6-month bar chart and per-category breakdown.

            ## Export
            Use **Export CSV** for end-of-year accounting. The file opens cleanly in Numbers and Excel.
            """
        ),
    ]

    static func grouped() -> [(String, [HelpArticle])] {
        let buckets = Dictionary(grouping: all) { $0.section }
        return buckets.map { ($0.key, $0.value) }.sorted { $0.0 < $1.0 }
    }

    static func find(slug: String) -> HelpArticle? {
        all.first(where: { $0.slug == slug })
    }
}
