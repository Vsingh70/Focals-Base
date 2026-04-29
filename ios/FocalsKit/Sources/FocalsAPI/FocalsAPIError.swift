import Foundation

public enum FocalsAPIError: Error, LocalizedError, Sendable {
    case network(underlying: String)
    case auth(message: String)
    case rls
    case decoding(underlying: String)
    case offline
    case notFound
    case unknown(message: String)

    public var errorDescription: String? {
        switch self {
        case .network(let e):  return "Network error: \(e)"
        case .auth(let m):     return "Sign in to continue: \(m)"
        case .rls:             return "You don't have access to that record."
        case .decoding(let e): return "Server response was malformed: \(e)"
        case .offline:         return "Connect to the internet to continue."
        case .notFound:        return "Record not found."
        case .unknown(let m):  return m
        }
    }
}

public extension Error {
    func asFocalsError() -> FocalsAPIError {
        if let e = self as? FocalsAPIError { return e }
        if let urlError = self as? URLError {
            if urlError.code == .notConnectedToInternet || urlError.code == .networkConnectionLost {
                return .offline
            }
            return .network(underlying: urlError.localizedDescription)
        }
        return .unknown(message: localizedDescription)
    }
}
