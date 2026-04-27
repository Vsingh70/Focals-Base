# Task 02 — Data Models & Supabase Client

## Goal

Mirror the 12 Postgres tables as Swift `Codable` structs and stand up the typed Supabase client with a repository per table. After this task, you can call `try await ClientsRepository.shared.list()` from a signed-in test session and get back real data — but no UI consumes it yet.

This task is the foundation for every module task (06–13). Get the types right and everything downstream is mechanical; get them wrong and decoding errors will plague every screen.

---

## Step 1 — Inventory tables

Source of truth: [my-app/src/lib/supabase/types.ts](../../my-app/src/lib/supabase/types.ts).

Twelve tables to mirror:

| Table | Purpose |
|---|---|
| `profiles` | User business profile, calendar token, tutorial progress |
| `clients` | Client contacts |
| `projects` | Photography jobs (with payment tracking) |
| `shoots` | Scheduled events (linked to projects/clients) |
| `contracts` | Contract instances |
| `contract_templates` | Reusable templates |
| `forms` | Custom inquiry forms |
| `inquiries` | Inbound leads |
| `inquiry_sources` | Per-source webhook tokens + config |
| `finances` | Income/expense transactions |
| `gear` | Equipment inventory |
| `links` | Bookmarked URLs |

All twelve have `id: UUID`, `user_id: UUID`, `created_at: Date`, `updated_at: Date` (except `finances`, `gear`, `links` which only have `created_at` per current schema — verify against `types.ts`).

## Step 2 — Codable structs in `FocalsModels`

Create one Swift file per table under `ios/FocalsKit/Sources/FocalsModels/`. Use this template:

```swift
import Foundation

public struct Client: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let fullName: String
    public let email: String?
    public let phone: String?
    public let notes: String?
    public let source: String?
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case fullName = "full_name"
        case email, phone, notes, source
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
```

**Conventions:**
- All `id` columns: `UUID`.
- All timestamp columns: `Date` (decoded with ISO8601 fractional formatter — see Step 4).
- Optional Postgres columns: Swift `Optional`. Don't force-unwrap.
- JSONB columns:
  - Known shape (`tutorial_progress`, `inquiry_sources.config`, `forms.fields`, `contracts.custom_fields`, `inquiries.raw_payload`): typed nested struct.
  - Unknown shape: `[String: AnyCodable]` — see Step 3 for `AnyCodable`.
- Status enums: separate `String`-backed enums, conformed to `Codable, CaseIterable, Sendable`. See Step 5.
- Snake_case → camelCase via explicit `CodingKeys` (don't rely on `JSONDecoder.KeyDecodingStrategy.convertFromSnakeCase` — too fragile when fields like `user_id` collide with sibling types).

**Files to create:**

| File | Struct(s) |
|---|---|
| `Profile.swift` | `Profile`, nested `TutorialProgress` |
| `Client.swift` | `Client` |
| `Project.swift` | `Project` |
| `Shoot.swift` | `Shoot` |
| `Contract.swift` | `Contract`, nested `ContractCustomFields` |
| `ContractTemplate.swift` | `ContractTemplate` |
| `Form.swift` | `Form`, nested `FormField` |
| `Inquiry.swift` | `Inquiry`, nested `InquiryRawPayload` (typed-or-AnyCodable) |
| `InquirySource.swift` | `InquirySource`, nested `InquirySourceConfig` |
| `Finance.swift` | `Finance` |
| `Gear.swift` | `Gear` |
| `Link.swift` | `Link` |

## Step 3 — `AnyCodable` helper

For JSONB fields where the shape varies by source (`inquiries.raw_payload` is one — widget vs. Resend vs. generic JSON differ), add an `AnyCodable` type to `FocalsModels`:

```swift
public struct AnyCodable: Codable, Sendable, Hashable {
    public let value: Sendable
    // Decoding tries: Bool, Int, Double, String, [AnyCodable], [String: AnyCodable]
    // Encoding switches on the wrapped type
    // Hashable: hash via JSON-encoded representation for stable hashing
}
```

Implementation: copy from https://github.com/Flight-School/AnyCodable (MIT) or hand-roll. Treat as a small utility — don't pull in the full SPM dep for one type.

## Step 4 — JSON decoder configuration

Create `FocalsModels/Decoding.swift`:

```swift
import Foundation

public extension JSONDecoder {
    static let supabase: JSONDecoder = {
        let d = JSONDecoder()
        // Postgres timestamps: "2026-04-27T19:32:01.234567+00:00"
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        d.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let str = try container.decode(String.self)
            if let date = formatter.date(from: str) { return date }
            // Fallback: timestamps without fractional seconds
            let f2 = ISO8601DateFormatter()
            f2.formatOptions = [.withInternetDateTime]
            if let date = f2.date(from: str) { return date }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid ISO8601: \(str)")
        }
        return d
    }()

    static let supabaseEncoder: JSONEncoder = {
        let e = JSONEncoder()
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        e.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(formatter.string(from: date))
        }
        return e
    }()
}
```

## Step 5 — Status enums

One file per enum: `FocalsModels/Enums.swift`. Match the DB strings exactly:

```swift
public enum ProjectStatus: String, Codable, CaseIterable, Sendable {
    case lead, booked, inProgress = "in_progress", delivered, archived
}

public enum PaymentStatus: String, Codable, CaseIterable, Sendable {
    case unpaid, partial, paid, refunded
}

public enum ShootStatus: String, Codable, CaseIterable, Sendable {
    case scheduled, completed, cancelled, rescheduled
}

public enum InquiryStatus: String, Codable, CaseIterable, Sendable {
    case new, responding, quoted, booked, lost
}

public enum ContractStatus: String, Codable, CaseIterable, Sendable {
    case draft, sent, signed, declined, expired
}

public enum FinanceType: String, Codable, CaseIterable, Sendable {
    case income, expense
}

public enum GearStatus: String, Codable, CaseIterable, Sendable {
    case owned, wishlist, sold, lost
}
```

Verify each enum against the actual DB constraint by reading [my-app/src/lib/validations/](../../my-app/src/lib/validations/) — those Zod schemas are the closest thing to a DDL-level constraint check.

## Step 6 — Supabase client singleton

Create `ios/FocalsKit/Sources/FocalsAPI/SupabaseClient.swift`:

```swift
import Foundation
import Supabase

public final class FocalsClient: @unchecked Sendable {
    public static let shared = FocalsClient()

    public let supabase: SupabaseClient

    private init() {
        guard
            let url = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
            let key = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
            let parsedURL = URL(string: url)
        else {
            preconditionFailure("Missing or invalid SUPABASE_URL / SUPABASE_ANON_KEY in Info.plist")
        }
        self.supabase = SupabaseClient(supabaseURL: parsedURL, supabaseKey: key)
    }
}
```

The supabase-swift SDK auto-persists session tokens in Keychain via the `Auth` module — no manual storage needed. Task 03 wires the auth flow.

## Step 7 — Repository protocol

Create `ios/FocalsKit/Sources/FocalsAPI/Repository.swift`:

```swift
import Foundation
import FocalsModels

public struct PageRequest: Sendable {
    public let cursor: Date?     // server-side pagination by updated_at
    public let limit: Int
    public init(cursor: Date? = nil, limit: Int = 50) {
        self.cursor = cursor
        self.limit = limit
    }
}

public struct Page<Item: Sendable>: Sendable {
    public let items: [Item]
    public let nextCursor: Date?
}

public protocol Repository: Sendable {
    associatedtype Model: Codable & Identifiable & Sendable

    func list(_ request: PageRequest) async throws -> Page<Model>
    func get(id: UUID) async throws -> Model
    func create(_ payload: Model) async throws -> Model
    func update(_ payload: Model) async throws -> Model
    func delete(id: UUID) async throws
}
```

## Step 8 — Concrete repositories

One file per table under `FocalsAPI/Repositories/`. Template:

```swift
import Foundation
import Supabase
import FocalsModels

public struct ClientsRepository: Repository {
    public typealias Model = Client
    public static let shared = ClientsRepository()
    private var supabase: SupabaseClient { FocalsClient.shared.supabase }

    public func list(_ request: PageRequest) async throws -> Page<Client> {
        var query = supabase
            .from("clients")
            .select()
            .order("updated_at", ascending: false)
            .limit(request.limit)
        if let cursor = request.cursor {
            query = query.lt("updated_at", value: cursor.iso8601String)
        }
        let response: [Client] = try await query.execute().value
        let nextCursor = response.last?.updatedAt
        return Page(items: response, nextCursor: nextCursor)
    }

    public func get(id: UUID) async throws -> Client {
        try await supabase
            .from("clients")
            .select()
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func create(_ payload: Client) async throws -> Client {
        // Note: do NOT include user_id — RLS auto-fills via auth.uid()
        try await supabase
            .from("clients")
            .insert(payload, returning: .representation)
            .single()
            .execute()
            .value
    }

    public func update(_ payload: Client) async throws -> Client {
        try await supabase
            .from("clients")
            .update(payload)
            .eq("id", value: payload.id)
            .single()
            .execute()
            .value
    }

    public func delete(id: UUID) async throws {
        try await supabase
            .from("clients")
            .delete()
            .eq("id", value: id)
            .execute()
    }
}
```

Repeat for: `ProjectsRepository`, `ShootsRepository`, `ContractsRepository`, `ContractTemplatesRepository`, `FormsRepository`, `InquiriesRepository`, `InquirySourcesRepository`, `FinancesRepository`, `GearRepository`, `LinksRepository`.

`profiles` is special — only one row per user. Create a dedicated `ProfileRepository` with `getCurrent()`, `update(_:)`, `regenerateCalendarToken()` (server-side action — port logic from [my-app/src/lib/actions/profile.ts](../../my-app/src/lib/actions/profile.ts)).

## Step 9 — Error type

Create `FocalsAPI/FocalsAPIError.swift`:

```swift
public enum FocalsAPIError: Error, LocalizedError {
    case network(underlying: Error)
    case auth(message: String)
    case rls                          // 401/403 from PostgREST when RLS denies
    case decoding(underlying: Error)
    case offline
    case notFound
    case unknown(message: String)

    public var errorDescription: String? {
        switch self {
        case .network(let e):  return "Network error: \(e.localizedDescription)"
        case .auth(let m):     return "Sign in to continue: \(m)"
        case .rls:             return "You don't have access to that record."
        case .decoding(let e): return "Server response was malformed: \(e.localizedDescription)"
        case .offline:         return "Connect to the internet to continue."
        case .notFound:        return "Record not found."
        case .unknown(let m):  return m
        }
    }
}

extension Error {
    public func mapToFocalsError() -> FocalsAPIError {
        if let e = self as? FocalsAPIError { return e }
        // PostgrestError, AuthError, URLError mapping
        // ... see Supabase docs for shapes
        return .unknown(message: localizedDescription)
    }
}
```

Wrap every repository call site so callers see `FocalsAPIError`, not raw `PostgrestError`.

## Step 10 — Snapshot tests

Under `FocalsTests/`:

1. Dump JSON fixtures from staging Supabase for each of the 12 tables (one row each, including a row with NULL optionals). Save to `FocalsTests/Fixtures/{table}.json`.
2. Add `ModelDecodingTests.swift` with one test per fixture:

```swift
import XCTest
@testable import FocalsModels

final class ModelDecodingTests: XCTestCase {
    func testClientDecodes() throws {
        let url = Bundle.module.url(forResource: "client", withExtension: "json")!
        let data = try Data(contentsOf: url)
        let client = try JSONDecoder.supabase.decode(Client.self, from: data)
        XCTAssertNotNil(client.id)
    }
    // ... 11 more, one per table
}
```

3. Round-trip test: encode → decode → assert equal for each model.

## Step 11 — Drift detection doc

Create `ios/FocalsKit/Sources/FocalsModels/SCHEMA_MAPPING.md` with a table per model, columns side-by-side with `types.ts`. Update whenever schema changes — failing snapshot tests should be the trigger.

---

## Acceptance Criteria

- [ ] All 12 tables have a Swift `Codable` struct in `FocalsModels`
- [ ] All 7 status enums match DB strings exactly (verified against `my-app/src/lib/validations/`)
- [ ] `JSONDecoder.supabase` decodes both fractional-second and whole-second ISO8601 timestamps
- [ ] `FocalsClient.shared.supabase` initializes from Info.plist secrets without crashing
- [ ] `ClientsRepository.shared.list(.init())` returns real data when called from a signed-in test session against staging
- [ ] All twelve repositories conform to `Repository` protocol with `list`, `get`, `create`, `update`, `delete`
- [ ] No force-unwraps on optional columns anywhere in `FocalsModels`
- [ ] Snapshot tests pass for all 12 fixture files (`bin/test.sh` exits 0)
- [ ] `SCHEMA_MAPPING.md` exists and matches the current `types.ts` exactly
- [ ] `FocalsAPIError` is the only error type surfaced by repositories — no raw `PostgrestError` leaks

## Depends on

- 01 (Project setup, Secrets configured, FocalsKit package wired)
