import SwiftUI
import UIKit

public extension Color {
    enum Tokens {
        // MARK: - Backgrounds
        public static let bg = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0)                       // #ffffff
                : UIColor(red: 10/255, green: 10/255, blue: 10/255, alpha: 1.0)               // #0a0a0a
        })

        public static let bgSecondary = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 247/255, green: 247/255, blue: 245/255, alpha: 1.0)            // #f7f7f5
                : UIColor(red: 17/255, green: 17/255, blue: 17/255, alpha: 1.0)               // #111111
        })

        public static let bgTertiary = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 239/255, green: 239/255, blue: 236/255, alpha: 1.0)            // #efefec
                : UIColor(red: 26/255, green: 26/255, blue: 26/255, alpha: 1.0)               // #1a1a1a
        })

        // MARK: - Borders
        public static let border = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 229/255, green: 229/255, blue: 225/255, alpha: 1.0)            // #e5e5e1
                : UIColor(red: 34/255, green: 34/255, blue: 34/255, alpha: 1.0)               // #222222
        })

        public static let borderSecondary = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 212/255, green: 212/255, blue: 208/255, alpha: 1.0)            // #d4d4d0
                : UIColor(red: 42/255, green: 42/255, blue: 42/255, alpha: 1.0)               // #2a2a2a
        })

        // MARK: - Text
        public static let textPrimary = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 17/255, green: 17/255, blue: 17/255, alpha: 1.0)               // #111111
                : UIColor(red: 240/255, green: 240/255, blue: 240/255, alpha: 1.0)            // #f0f0f0
        })

        public static let textSecondary = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 85/255, green: 85/255, blue: 85/255, alpha: 1.0)               // #555555
                : UIColor(red: 136/255, green: 136/255, blue: 136/255, alpha: 1.0)            // #888888
        })

        public static let textTertiary = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 136/255, green: 136/255, blue: 136/255, alpha: 1.0)            // #888888
                : UIColor(red: 85/255, green: 85/255, blue: 85/255, alpha: 1.0)               // #555555
        })

        // MARK: - Accent
        public static let accent = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 58/255, green: 53/255, blue: 48/255, alpha: 1.0)               // #3a3530
                : UIColor(red: 232/255, green: 224/255, blue: 208/255, alpha: 1.0)            // #e8e0d0
        })

        public static let accentMuted = Color(UIColor { tc in
            tc.userInterfaceStyle == .light
                ? UIColor(red: 232/255, green: 224/255, blue: 208/255, alpha: 1.0)            // #e8e0d0
                : UIColor(red: 58/255, green: 53/255, blue: 48/255, alpha: 1.0)               // #3a3530
        })

        // MARK: - Semantic (same in both modes)
        public static let success = Color(red: 76/255, green: 175/255, blue: 125/255)         // #4caf7d
        public static let warning = Color(red: 232/255, green: 160/255, blue: 32/255)         // #e8a020
        public static let danger  = Color(red: 232/255, green: 80/255, blue: 64/255)          // #e85040
    }

    static let tokens = Tokens.self
}
