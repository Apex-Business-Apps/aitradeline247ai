#!/usr/bin/env bash
# CI helper to sync the Capacitor iOS wrapper and install pods from any working directory.
# Usage: ./scripts/ci-ios-setup.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔧 Syncing Capacitor iOS project..."
npx cap sync ios

PROJECT_FILE="ios/App/App.xcodeproj/project.pbxproj"
if [[ ! -f "$PROJECT_FILE" ]]; then
  echo "::error title=Missing Xcode project::Expected $PROJECT_FILE after running 'npx cap sync ios'." >&2
  echo "Ensure the Capacitor iOS platform is added (npx cap add ios)." >&2
  exit 1
fi

echo "📦 Installing CocoaPods dependencies..."
(
  cd ios/App
  pod install
)
