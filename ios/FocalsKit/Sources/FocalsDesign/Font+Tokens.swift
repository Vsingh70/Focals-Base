import SwiftUI

public extension Font {
    enum Tokens {
        public static func body(_ size: CGFloat = 15) -> Font {
            .custom("Inter-Regular", size: size)
        }
        public static func medium(_ size: CGFloat = 15) -> Font {
            .custom("Inter-Medium", size: size)
        }
        public static func semibold(_ size: CGFloat = 15) -> Font {
            .custom("Inter-SemiBold", size: size)
        }
        public static func display(_ size: CGFloat = 24) -> Font {
            .system(size: size, weight: .medium, design: .serif)
        }
    }

    static let tokens = Tokens.self
}
