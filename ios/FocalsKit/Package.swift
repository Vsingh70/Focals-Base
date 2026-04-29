// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "FocalsKit",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "FocalsModels", targets: ["FocalsModels"]),
        .library(name: "FocalsAPI",    targets: ["FocalsAPI"]),
        .library(name: "FocalsCache",  targets: ["FocalsCache"]),
        .library(name: "FocalsDesign", targets: ["FocalsDesign"]),
    ],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
    ],
    targets: [
        .target(name: "FocalsModels"),
        .target(name: "FocalsAPI", dependencies: [
            "FocalsModels",
            .product(name: "Supabase", package: "supabase-swift"),
        ]),
        .target(name: "FocalsCache", dependencies: ["FocalsModels", "FocalsAPI"]),
        .target(name: "FocalsDesign"),
    ]
)
