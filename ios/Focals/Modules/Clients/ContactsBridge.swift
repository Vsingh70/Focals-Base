import Contacts
import Foundation
import FocalsModels

/// Thin wrapper around `CNContactStore` for one-shot exports. The web has no
/// Contacts integration, so this is iOS-only — the backend doesn't store the
/// contact identifier, the export is purely a convenience for the user.
@MainActor
final class ContactsBridge {
    static let shared = ContactsBridge()
    private let store = CNContactStore()

    private init() {}

    enum AccessError: Error, LocalizedError {
        case denied
        case restricted

        var errorDescription: String? {
            switch self {
            case .denied:
                return "Focals doesn't have permission to access Contacts. Enable it in Settings → Privacy & Security → Contacts → Focals."
            case .restricted:
                return "Contacts access is restricted on this device (parental controls / MDM)."
            }
        }
    }

    /// Asks the user once. After they decide, returns true on grant or
    /// throws AccessError so callers can show an actionable message.
    func ensureAccess() async throws {
        let status = CNContactStore.authorizationStatus(for: .contacts)
        switch status {
        case .authorized:
            return
        case .denied:
            throw AccessError.denied
        case .restricted:
            throw AccessError.restricted
        case .notDetermined:
            let granted = try await store.requestAccess(for: .contacts)
            if !granted { throw AccessError.denied }
        case .limited:
            // iOS 18+ limited access — same write semantics, just a smaller
            // visible address book. Treat as authorized.
            return
        @unknown default:
            throw AccessError.denied
        }
    }

    /// Insert (or update) a contact derived from a Client. Returns the system
    /// `CNContact.identifier` so callers can stash it (currently we don't —
    /// the web has no column for it — but plumbed for v1.1).
    @discardableResult
    func upsertContact(from client: Client) async throws -> String {
        try await ensureAccess()
        let contact = CNMutableContact()
        let parts = client.fullName.split(separator: " ", maxSplits: 1).map(String.init)
        contact.givenName = parts.first ?? client.fullName
        contact.familyName = parts.count > 1 ? parts[1] : ""

        if let email = client.email, !email.isEmpty {
            contact.emailAddresses = [
                CNLabeledValue(label: CNLabelWork, value: email as NSString)
            ]
        }
        if let phone = client.phone, !phone.isEmpty {
            contact.phoneNumbers = [
                CNLabeledValue(
                    label: CNLabelPhoneNumberMobile,
                    value: CNPhoneNumber(stringValue: phone)
                )
            ]
        }
        if let notes = client.notes, !notes.isEmpty {
            contact.note = notes
        }
        contact.organizationName = "Focals client"

        let request = CNSaveRequest()
        request.add(contact, toContainerWithIdentifier: nil)
        try store.execute(request)
        return contact.identifier
    }
}
