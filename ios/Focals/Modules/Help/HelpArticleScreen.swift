import SwiftUI
import MarkdownUI
import FocalsDesign

struct HelpArticleScreen: View {
    let slug: String

    private var article: HelpArticle? { HelpArticles.find(slug: slug) }

    var body: some View {
        ScrollView {
            if let article {
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Markdown(article.body)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(Spacing.md)
            } else {
                EmptyState(
                    symbol: "book.closed",
                    title: "Article not found",
                    description: "Slug: \(slug)"
                )
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle(article?.title ?? "Help")
        .navigationBarTitleDisplayMode(.inline)
    }
}
