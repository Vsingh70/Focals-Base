import SwiftUI
import MarkdownUI
import FocalsDesign

struct HelpScreen: View {
    @State private var search = ""

    var body: some View {
        List {
            ForEach(filteredGroups, id: \.0) { section, articles in
                Section(section) {
                    ForEach(articles, id: \.slug) { article in
                        Button {
                            Haptics.tap()
                            AppRouter.shared.navigate(to: .helpArticle(slug: article.slug))
                        } label: {
                            HStack {
                                Text(article.title)
                                    .font(.tokens.body(15))
                                    .foregroundStyle(Color.tokens.textPrimary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.tokens.body(11))
                                    .foregroundStyle(Color.tokens.textTertiary)
                            }
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(Color.tokens.bgSecondary)
                    }
                }
            }
        }
        .listStyle(.plain)
        .background(Color.tokens.bg)
        .navigationTitle("Help")
        .searchable(text: $search, prompt: "Search articles")
    }

    private var filteredGroups: [(String, [HelpArticle])] {
        let needle = search.trimmingCharacters(in: .whitespacesAndNewlines)
        let groups = HelpArticles.grouped()
        guard !needle.isEmpty else { return groups }
        return groups.compactMap { section, articles in
            let matches = articles.filter { article in
                article.title.localizedCaseInsensitiveContains(needle)
                    || article.body.localizedCaseInsensitiveContains(needle)
            }
            return matches.isEmpty ? nil : (section, matches)
        }
    }
}
