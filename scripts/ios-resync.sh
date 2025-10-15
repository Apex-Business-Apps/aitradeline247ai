#!/usr/bin/env bash
# iOS Safe Resync — TradeLine 24/7
# Rebuilds web assets and syncs to iOS wrapper
# Usage: ./scripts/ios-resync.sh

set -euo pipefail

echo "🔄 iOS Resync — TradeLine 24/7"
echo ""

# 1) Clean build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# 2) Fresh build
echo "📦 Building web assets..."
npm run build

# 3) Copy to iOS
echo "📲 Copying to iOS..."
npx cap copy ios

# 4) Sync native dependencies
echo "🔗 Syncing native dependencies..."
npx cap sync ios

echo ""
echo "✅ Resync complete"
echo ""
echo "Open in Xcode: npx cap open ios"
