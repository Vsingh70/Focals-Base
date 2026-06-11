import SwiftUI

// Remaining placeholders. The Tasks 06–12 screens now live in their own
// `Modules/<name>/` directories; only Task 15 (Project Upload) and the
// More-tab landing view stay here until those land.

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

