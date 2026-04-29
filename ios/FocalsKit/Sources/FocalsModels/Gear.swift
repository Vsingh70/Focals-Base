import Foundation

public struct Gear: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let name: String
    public let category: String?
    public let brand: String?
    public let model: String?
    public let serialNumber: String?
    public let purchasePrice: Double?
    public let purchaseDate: String?
    public let status: GearStatus?
    public let notes: String?
    public let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name, category, brand, model
        case serialNumber = "serial_number"
        case purchasePrice = "purchase_price"
        case purchaseDate = "purchase_date"
        case status, notes
        case createdAt = "created_at"
    }
}
