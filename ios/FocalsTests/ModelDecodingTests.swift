import Testing
import Foundation
@testable import FocalsModels

struct ModelDecodingTests {
    private func loadFixture(_ name: String) throws -> Data {
        let url = Bundle(for: BundleLocator.self)
            .url(forResource: name, withExtension: "json", subdirectory: "Fixtures")
        guard let url else {
            throw FixtureError.notFound(name)
        }
        return try Data(contentsOf: url)
    }

    @Test func profileDecodes() throws {
        let data = try loadFixture("profile")
        let model = try JSONDecoder.supabase.decode(Profile.self, from: data)
        #expect(model.id.uuidString.lowercased() == "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        #expect(model.fullName == "Jane Photographer")
        #expect(model.businessName == "Jane Photo Co")
        #expect(model.calendarToken == "cal_abc123def456")
        #expect(model.tutorialProgress.completedSteps?.count == 2)
    }

    @Test func clientDecodes() throws {
        let data = try loadFixture("client")
        let model = try JSONDecoder.supabase.decode(Client.self, from: data)
        #expect(model.fullName == "Sarah Johnson")
        #expect(model.email == "sarah@example.com")
        #expect(model.source == "referral")
    }

    @Test func projectDecodes() throws {
        let data = try loadFixture("project")
        let model = try JSONDecoder.supabase.decode(Project.self, from: data)
        #expect(model.title == "Johnson Wedding")
        #expect(model.status == .booked)
        #expect(model.packagePrice == 3500.00)
        #expect(model.paymentStatus == .partial)
    }


    @Test func contractDecodes() throws {
        let data = try loadFixture("contract")
        let model = try JSONDecoder.supabase.decode(Contract.self, from: data)
        #expect(model.title == "Johnson Wedding Contract")
        #expect(model.status == .sent)
        #expect(model.customFields?["bride_name"] == "Sarah Johnson")
        #expect(model.signedAt == nil)
    }

    @Test func contractTemplateDecodes() throws {
        let data = try loadFixture("contract_template")
        let model = try JSONDecoder.supabase.decode(ContractTemplate.self, from: data)
        #expect(model.name == "Standard Wedding Contract")
        #expect(model.body.contains("Photography Agreement"))
    }

    @Test func formDecodes() throws {
        let data = try loadFixture("form")
        let model = try JSONDecoder.supabase.decode(Form.self, from: data)
        #expect(model.name == "Wedding Inquiry Form")
        #expect(model.fields.count == 3)
        #expect(model.fields[0].type == .text)
        #expect(model.fields[1].type == .date)
    }

    @Test func inquiryDecodes() throws {
        let data = try loadFixture("inquiry")
        let model = try JSONDecoder.supabase.decode(Inquiry.self, from: data)
        #expect(model.name == "Emily Davis")
        #expect(model.status == .new)
        #expect(model.source == "website_form")
        #expect(model.convertedClientId == nil)
    }

    @Test func inquirySourceDecodes() throws {
        let data = try loadFixture("inquiry_source")
        let model = try JSONDecoder.supabase.decode(InquirySource.self, from: data)
        #expect(model.label == "Website Contact Form")
        #expect(model.isActive == true)
    }

    @Test func financeDecodes() throws {
        let data = try loadFixture("finance")
        let model = try JSONDecoder.supabase.decode(Finance.self, from: data)
        #expect(model.type == .income)
        #expect(model.amount == 1750.00)
        #expect(model.category == "session_fee")
    }

    @Test func gearDecodes() throws {
        let data = try loadFixture("gear")
        let model = try JSONDecoder.supabase.decode(Gear.self, from: data)
        #expect(model.name == "Sony A7IV")
        #expect(model.status == .owned)
        #expect(model.purchasePrice == 2498.00)
    }

    @Test func linkDecodes() throws {
        let data = try loadFixture("link")
        let model = try JSONDecoder.supabase.decode(Link.self, from: data)
        #expect(model.title == "Posing Guide for Couples")
        #expect(model.category == "Reference")
    }

    @Test func dateDecodesWithFractionalSeconds() throws {
        let json = #"{"id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","user_id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","full_name":"Test","email":null,"phone":null,"notes":null,"source":null,"created_at":"2026-04-20T14:22:31.123456+00:00","updated_at":"2026-04-20T14:22:31.123456+00:00"}"#
        let model = try JSONDecoder.supabase.decode(Client.self, from: Data(json.utf8))
        #expect(model.createdAt.timeIntervalSince1970 > 0)
    }

    @Test func dateDecodesWithoutFractionalSeconds() throws {
        let json = #"{"id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","user_id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","full_name":"Test","email":null,"phone":null,"notes":null,"source":null,"created_at":"2026-04-20T14:22:31+00:00","updated_at":"2026-04-20T14:22:31+00:00"}"#
        let model = try JSONDecoder.supabase.decode(Client.self, from: Data(json.utf8))
        #expect(model.createdAt.timeIntervalSince1970 > 0)
    }

    @Test func userIntegrationDecodes() throws {
        let data = try loadFixture("user_integration")
        let model = try JSONDecoder.supabase.decode(UserIntegration.self, from: data)
        #expect(model.provider == "anthropic")
        #expect(model.keyHint.hasPrefix("sk-ant-"))
        #expect(model.isActive == true)
        #expect(model.lastUsedAt != nil)
    }

    @Test func projectUploadJobDecodes() throws {
        let data = try loadFixture("project_upload_job")
        let model = try JSONDecoder.supabase.decode(ProjectUploadJob.self, from: data)
        #expect(model.filename == "spring_2026_bookings.csv")
        #expect(model.status == "committed")
        #expect(model.extractedCount == 12)
        #expect(model.committedCount == 12)
        #expect(model.completedAt != nil)
    }

    @Test func projectShootDateDecodesAsTimestamp() throws {
        // shoot_date is now timestamptz (post-20260429180000 migration); the
        // fixture must use a full ISO timestamp, and Date? decoding must
        // succeed.
        let data = try loadFixture("project")
        let model = try JSONDecoder.supabase.decode(Project.self, from: data)
        #expect(model.shootDate != nil)
    }
}

private final class BundleLocator {}

private enum FixtureError: Error {
    case notFound(String)
}
