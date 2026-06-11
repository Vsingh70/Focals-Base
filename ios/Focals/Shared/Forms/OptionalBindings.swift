import SwiftUI

extension Binding where Value == String? {
    /// Surface an `Optional<String>` as a non-optional binding suitable for
    /// `TextField`/`TextEditor`. Empty input becomes `nil` so we don't
    /// persist `""` when the user clears the field.
    var bound: Binding<String> {
        Binding<String>(
            get: { self.wrappedValue ?? "" },
            set: { self.wrappedValue = $0.isEmpty ? nil : $0 }
        )
    }
}
