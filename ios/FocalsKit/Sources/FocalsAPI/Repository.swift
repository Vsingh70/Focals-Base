import Foundation
import FocalsModels

public struct PageRequest: Sendable {
    public let cursor: Date?
    public let limit: Int

    public init(cursor: Date? = nil, limit: Int = 50) {
        self.cursor = cursor
        self.limit = limit
    }
}

public struct Page<Item: Sendable>: Sendable {
    public let items: [Item]
    public let nextCursor: Date?

    public init(items: [Item], nextCursor: Date?) {
        self.items = items
        self.nextCursor = nextCursor
    }
}

public protocol Repository: Sendable {
    associatedtype Model: Codable & Identifiable & Sendable

    func list(_ request: PageRequest) async throws -> Page<Model>
    func get(id: UUID) async throws -> Model
    func create(_ payload: Model) async throws -> Model
    func update(_ payload: Model) async throws -> Model
    func delete(id: UUID) async throws
}
