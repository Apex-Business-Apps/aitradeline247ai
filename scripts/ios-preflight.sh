#!/usr/bin/env bash
# iOS App Store Preflight — TradeLine 24/7
# Validates build, checks secrets, ensures assets are ready
# Usage: ./scripts/ios-preflight.sh

set -euo pipefail

echo "🍎 iOS Preflight — TradeLine 24/7"
echo "=================================="
echo ""

# 1) Check branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "release/ios-v1" ]]; then
  echo "⚠️  Not on release/ios-v1 branch (current: $BRANCH)"
  echo "   Create it with: git checkout -b release/ios-v1"
fi

# 2) Build check
echo "📦 Building web assets..."
if npm run build; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi

# 3) Secrets scan
echo ""
echo "🔒 Scanning for embedded secrets..."
SECRETS_FOUND=0

if grep -r "SUPABASE_SERVICE_" src/ --include="*.ts" --include="*.tsx" --exclude="CryptoInit.tsx" | grep -v "server-side" | grep -v "description" > /dev/null 2>&1; then
  echo "❌ Found SUPABASE_SERVICE_ in client code"
  SECRETS_FOUND=1
fi

if grep -r "STRIPE_SECRET" src/ --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
  echo "❌ Found STRIPE_SECRET in client code"
  SECRETS_FOUND=1
fi

if grep -r "TWILIO_AUTH" src/ --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
  echo "❌ Found TWILIO_AUTH in client code"
  SECRETS_FOUND=1
fi

if [[ $SECRETS_FOUND -eq 0 ]]; then
  echo "✅ No embedded secrets found"
else
  echo "❌ Secrets detected — must fix before iOS submission"
  exit 1
fi

# 4) Asset check
echo ""
echo "🎨 Checking required assets..."
MISSING=0

if [[ ! -f "public/assets/brand/appstore-1024.png" ]]; then
  echo "❌ Missing: public/assets/brand/appstore-1024.png"
  MISSING=1
else
  echo "✅ appstore-1024.png exists"
fi

if [[ ! -f "public/assets/brand/splash-2732.png" ]]; then
  echo "⚠️  Missing: public/assets/brand/splash-2732.png"
  echo "   → Generate it: npx @capacitor/assets generate --splash-only"
  echo "   → Or copy from icon: cp public/assets/brand/appstore-1024.png public/assets/brand/splash-2732.png"
else
  echo "✅ splash-2732.png exists"
fi

if [[ $MISSING -eq 1 ]]; then
  echo "❌ Missing assets — run asset generation first"
  exit 1
fi

# 5) Capacitor config check
echo ""
echo "⚙️  Checking Capacitor config..."
if [[ -f "capacitor.config.ts" ]]; then
  if grep -q "url:" capacitor.config.ts && grep -q "lovableproject.com" capacitor.config.ts; then
    echo "⚠️  Hot-reload server URL is active (should be commented for production build)"
  else
    echo "✅ Production config (using dist/)"
  fi
else
  echo "⚠️  capacitor.config.ts not found — run: npx cap init first"
fi

echo ""
echo "=================================="
echo "✅ Preflight PASSED"
echo ""
echo "Next steps:"
echo "  1. npm i -D @capacitor/cli @capacitor/assets"
echo "  2. npm i @capacitor/core @capacitor/ios"
echo "  3. npx cap init 'TradeLine 24/7' com.apex.tradeline247 --web-dir=dist"
echo "  4. npx cap add ios"
echo "  5. npx @capacitor/assets generate --ios"
echo "  6. npm run build && npx cap sync ios"
echo "  7. npx cap open ios"
