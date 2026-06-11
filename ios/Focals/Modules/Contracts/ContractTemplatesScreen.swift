import SwiftUI
import SwiftData
import FocalsAPI
import FocalsCache
import FocalsDesign
import FocalsModels

struct ContractTemplatesScreen: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \CachedContractTemplate.name, order: .forward) private var templates: [CachedContractTemplate]
    @State private var hasLoadedOnce = false

    var body: some View {
        Group {
            if templates.isEmpty && hasLoadedOnce {
                EmptyState(
                    symbol: "doc.on.doc",
                    title: "No templates yet",
                    description: "Create templates on the web at /contracts/templates. They'll sync to iOS for read-only use here."
                )
            } else if templates.isEmpty {
                SkeletonList(count: 3)
            } else {
                content
            }
        }
        .background(Color.tokens.bg)
        .navigationTitle("Templates")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            try? await ContractTemplatesCacheRepository.shared.refresh(in: context)
        }
        .task {
            if !hasLoadedOnce {
                try? await ContractTemplatesCacheRepository.shared.refresh(in: context)
                hasLoadedOnce = true
            }
        }
    }

    private var content: some View {
        List {
            Section {
                Text("Templates are managed on the web. iOS shows them read-only — pick one in the New Contract flow to use it.")
                    .font(.tokens.body(12))
                    .foregroundStyle(Color.tokens.textSecondary)
                    .listRowBackground(Color.tokens.bgTertiary)
            }
            Section {
                ForEach(templates, id: \.serverId) { template in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(template.name)
                            .font(.tokens.medium(15))
                            .foregroundStyle(Color.tokens.textPrimary)
                        Text(template.body)
                            .font(.tokens.body(13))
                            .foregroundStyle(Color.tokens.textTertiary)
                            .lineLimit(3)
                        Text("Last edited \(template.updatedAt.formatted(.relative(presentation: .named)))")
                            .font(.tokens.body(11))
                            .foregroundStyle(Color.tokens.textTertiary)
                    }
                    .padding(.vertical, Spacing.xs)
                    .listRowBackground(Color.tokens.bgSecondary)
                }
            }
        }
        .listStyle(.plain)
    }
}
