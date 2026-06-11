#!/usr/bin/env bash
#
# Archive Focals.app for App Store distribution.
#
# Pre-reqs (one-time, on a machine with a paid Apple Developer account):
#   - Xcode signed in to Apple ID with the Apple Developer team selected
#   - DEVELOPMENT_TEAM env var or the FOCALS_TEAM_ID env var set, OR the
#     project.yml carries a base settings entry with DEVELOPMENT_TEAM
#   - Push Notifications + App Groups + Sign in with Apple + Associated
#     Domains capabilities enabled on com.focals.ios
#
# Usage:
#   ./bin/archive.sh
#   FOCALS_TEAM_ID=ABCD123XYZ ./bin/archive.sh   # override the team
set -euo pipefail
cd "$(dirname "$0")/.."

# Read the team ID. The script tries (in order):
#   1) FOCALS_TEAM_ID env var
#   2) The team from the developer cert in the user's keychain
TEAM_ID="${FOCALS_TEAM_ID:-}"
if [ -z "$TEAM_ID" ]; then
  TEAM_ID="$(security find-certificate -c 'Apple Development' -p 2>/dev/null \
    | openssl x509 -text -noout 2>/dev/null \
    | grep -m1 'Subject:' \
    | sed -E 's/.*OU=([^,]+).*/\1/')"
fi
if [ -z "$TEAM_ID" ]; then
  echo "❌ Could not determine your Apple Developer Team ID."
  echo "   Set FOCALS_TEAM_ID=<10-char ID> and re-run."
  exit 1
fi
echo "🪪  Using team: $TEAM_ID"

VERSION=$(plutil -extract CFBundleShortVersionString raw -o - Focals/Info.plist)
BUILD=$(plutil -extract CFBundleVersion raw -o - Focals/Info.plist)
ARCHIVE_PATH="build/Focals-${VERSION}-${BUILD}.xcarchive"
EXPORT_PATH="build/Focals-${VERSION}-${BUILD}"

# Pretty output if xcbeautify is available; otherwise fall back to raw.
if command -v xcbeautify >/dev/null 2>&1; then
  PRETTIFY=(xcbeautify)
else
  PRETTIFY=(cat)
fi

echo "📦 Archiving Focals ${VERSION} (${BUILD})…"
xcodebuild \
  -project Focals.xcodeproj \
  -scheme Focals \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "${ARCHIVE_PATH}" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="${TEAM_ID}" \
  CODE_SIGN_STYLE=Automatic \
  archive \
  | "${PRETTIFY[@]}"

# Generate ExportOptions.plist with the team baked in. Apple's exporter
# requires teamID for the app-store-connect destination.
EXPORT_OPTIONS="$(mktemp -t focals-export.XXXXXX).plist"
cat > "$EXPORT_OPTIONS" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>destination</key>
    <string>export</string>
    <key>method</key>
    <string>app-store-connect</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>teamID</key>
    <string>${TEAM_ID}</string>
    <key>uploadSymbols</key>
    <true/>
    <key>stripSwiftSymbols</key>
    <true/>
</dict>
</plist>
EOF

echo "📤 Exporting .ipa to ${EXPORT_PATH}…"
xcodebuild \
  -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS}" \
  -exportPath "${EXPORT_PATH}" \
  -allowProvisioningUpdates \
  | "${PRETTIFY[@]}"

if [ ! -f "${EXPORT_PATH}/Focals.ipa" ]; then
  echo "❌ Export failed — no .ipa at ${EXPORT_PATH}/Focals.ipa"
  exit 1
fi

echo "✅ Done. .ipa is at ${EXPORT_PATH}/Focals.ipa"
echo "Next: open Transporter.app and drag the .ipa in, or run:"
echo "      xcrun altool --upload-app -f \"${EXPORT_PATH}/Focals.ipa\" -t ios -u <appleid> -p @keychain:AC_PASSWORD"
