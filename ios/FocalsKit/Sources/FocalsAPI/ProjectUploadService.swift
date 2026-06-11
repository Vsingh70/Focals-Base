import Foundation
import Supabase

/// Multipart upload + commit for the AI project-import flow. POSTs to the
/// **Next.js webapp** (not Supabase) — the upload endpoint runs Anthropic
/// extraction server-side and returns proposed projects keyed for review.
///
/// Two web endpoints:
///   POST  /api/projects/upload         — multipart file → AnnotatedProposedProject[]
///   POST  /api/projects/upload/commit  — JSON CommitProjectRow[] → CommitProjectsResult
///
/// Both require a Supabase access token in `Authorization: Bearer …`. The
/// commit route is a thin wrapper around the existing `commitUploadedProjects`
/// server action — see USER_TODO for the web prerequisite.
public actor ProjectUploadService {
    public static let shared = ProjectUploadService()

    public enum UploadError: Error, LocalizedError {
        case missingWebAppURL
        case unauthorized
        case fileTooLarge(Int64)
        case server(message: String, status: Int)
        case decoding(underlying: String)

        public var errorDescription: String? {
            switch self {
            case .missingWebAppURL:        return "WEBAPP_URL is missing from Info.plist."
            case .unauthorized:            return "Sign in again to continue."
            case .fileTooLarge(let bytes): return "File is too large (\(bytes / 1024 / 1024) MB). Max 10 MB."
            case .server(let m, let s):    return "Server error (\(s)): \(m)"
            case .decoding(let m):         return "Couldn't decode server response: \(m)"
            }
        }
    }

    public static let maxFileBytes: Int64 = 10 * 1024 * 1024

    public func upload(
        fileURL: URL,
        mimeType: String
    ) async throws -> UploadResponse {
        let attrs = (try? FileManager.default.attributesOfItem(atPath: fileURL.path)) ?? [:]
        if let size = attrs[.size] as? Int64, size > Self.maxFileBytes {
            throw UploadError.fileTooLarge(size)
        }
        let fileData = try Data(contentsOf: fileURL)
        return try await upload(
            fileData: fileData,
            filename: fileURL.lastPathComponent,
            mimeType: mimeType
        )
    }

    public func upload(
        fileData: Data,
        filename: String,
        mimeType: String
    ) async throws -> UploadResponse {
        if Int64(fileData.count) > Self.maxFileBytes {
            throw UploadError.fileTooLarge(Int64(fileData.count))
        }

        var request = try await buildRequest(path: "/api/projects/upload")
        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.append("--\(boundary)\r\n")
        body.append(#"Content-Disposition: form-data; name="file"; filename="\#(filename)""# + "\r\n")
        body.append("Content-Type: \(mimeType)\r\n\r\n")
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n")

        let (data, response) = try await URLSession.shared.upload(for: request, from: body)
        try validate(response, body: data)
        do {
            return try JSONDecoder.supabase.decode(UploadResponse.self, from: data)
        } catch {
            throw UploadError.decoding(underlying: error.localizedDescription)
        }
    }

    public func commit(
        jobId: String?,
        rows: [CommitProjectRow]
    ) async throws -> CommitProjectsResult {
        var request = try await buildRequest(path: "/api/projects/upload/commit")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        struct Payload: Encodable {
            let jobId: String?
            let rows: [CommitProjectRow]
        }
        request.httpBody = try JSONEncoder.supabase.encode(Payload(jobId: jobId, rows: rows))

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response, body: data)
        do {
            return try JSONDecoder.supabase.decode(CommitProjectsResult.self, from: data)
        } catch {
            throw UploadError.decoding(underlying: error.localizedDescription)
        }
    }

    // MARK: - Helpers

    private func buildRequest(path: String) async throws -> URLRequest {
        guard let webRoot = Bundle.main.object(forInfoDictionaryKey: "WEBAPP_URL") as? String,
              !webRoot.isEmpty,
              let url = URL(string: webRoot + path)
        else {
            throw UploadError.missingWebAppURL
        }

        let session: Session
        do {
            session = try await FocalsClient.shared.supabase.auth.session
        } catch {
            throw UploadError.unauthorized
        }

        var request = URLRequest(url: url, timeoutInterval: 60)
        request.httpMethod = "POST"
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    private func validate(_ response: URLResponse, body: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw UploadError.server(message: "Invalid response", status: -1)
        }
        guard (200..<300).contains(http.statusCode) else {
            let serverMessage: String
            if let payload = try? JSONSerialization.jsonObject(with: body) as? [String: Any],
               let message = payload["error"] as? String {
                serverMessage = message
            } else {
                serverMessage = String(data: body, encoding: .utf8) ?? "Unknown"
            }
            if http.statusCode == 401 { throw UploadError.unauthorized }
            throw UploadError.server(message: serverMessage, status: http.statusCode)
        }
    }
}

private extension Data {
    mutating func append(_ string: String) {
        if let data = string.data(using: .utf8) { append(data) }
    }
}
