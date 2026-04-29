import Foundation
import Supabase
import FocalsModels

/// Read-only access to the user's history of file-upload extractions.
///
/// Jobs are created server-side by the upload route — iOS never inserts
/// or updates them. Useful for showing a "recent imports" list in Settings.
public struct ProjectUploadJobsRepository: Sendable {
    public static let shared = ProjectUploadJobsRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest = .init()) async throws -> Page<ProjectUploadJob> {
        var query = supabase
            .from("project_upload_jobs")
            .select()
        if let cursor = request.cursor {
            query = query.lt("created_at", value: cursor.iso8601String)
        }
        let items: [ProjectUploadJob] = try await query
            .order("created_at", ascending: false)
            .limit(request.limit)
            .execute()
            .value
        return Page(items: items, nextCursor: items.last?.createdAt)
    }

    public func get(id: UUID) async throws -> ProjectUploadJob {
        try await supabase
            .from("project_upload_jobs")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }
}
