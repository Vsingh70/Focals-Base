#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

xcodebuild \
  -project Focals.xcodeproj \
  -scheme Focals \
  -destination 'platform=iOS Simulator,name=iPhone 15,OS=latest' \
  -configuration Debug \
  clean build \
  | xcbeautify || true
