import Testing
import Foundation
@testable import Focals
@testable import FocalsModels

/// Pins the greeting copy & first-name extraction to specific hour buckets.
/// The dashboard uses this on first-frame render so a regression would be
/// user-visible immediately.
struct DashboardGreetingTests {
    private func date(hour: Int) -> Date {
        var components = DateComponents()
        components.year = 2026
        components.month = 5
        components.day = 1
        components.hour = hour
        components.minute = 30
        return Calendar.current.date(from: components)!
    }

    private func profile(fullName: String?) -> Profile {
        Profile(
            id: UUID(),
            fullName: fullName,
            email: nil,
            avatarUrl: nil,
            businessName: nil,
            website: nil,
            instagramHandle: nil,
            calendarToken: "tok",
            tutorialProgress: TutorialProgress(),
            createdAt: .now,
            updatedAt: .now
        )
    }

    @Test func morningGreetingUsesFirstName() {
        let s = DashboardScreen.greeting(now: date(hour: 8), profile: profile(fullName: "Alex Rivera"))
        #expect(s == "Good morning, Alex")
    }

    @Test func afternoonGreeting() {
        let s = DashboardScreen.greeting(now: date(hour: 14), profile: profile(fullName: "Alex"))
        #expect(s == "Good afternoon, Alex")
    }

    @Test func eveningGreeting() {
        let s = DashboardScreen.greeting(now: date(hour: 19), profile: profile(fullName: "Alex"))
        #expect(s == "Good evening, Alex")
    }

    @Test func lateNightGreeting() {
        let s = DashboardScreen.greeting(now: date(hour: 2), profile: profile(fullName: "Alex"))
        #expect(s == "Working late, Alex")
    }

    @Test func nilProfileOmitsName() {
        let s = DashboardScreen.greeting(now: date(hour: 9), profile: nil)
        #expect(s == "Good morning")
    }

    @Test func emptyFullNameOmitsComma() {
        let s = DashboardScreen.greeting(now: date(hour: 9), profile: profile(fullName: ""))
        #expect(s == "Good morning")
    }
}
