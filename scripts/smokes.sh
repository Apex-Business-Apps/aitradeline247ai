#!/bin/bash
set -e

# TradeLine 24/7 Smoke Tests
# Usage: bash scripts/smokes.sh [HOST]

HOST=${1:-https://www.tradeline247ai.com}

echo "🔥 Running smoke tests against: $HOST"
echo "================================================"

# Core health endpoints
echo -n "Testing /healthz... "
curl -fsSL "$HOST/healthz" >/dev/null && echo "✅ healthz"

echo -n "Testing /status.json... "
curl -fsSL "$HOST/status.json" | jq -e '.ok==true' >/dev/null && echo "✅ status"

echo -n "Testing /version... "
curl -fsSL "$HOST/version" >/dev/null && echo "✅ version"

# SEO endpoints
echo -n "Testing /robots.txt... "
curl -fsSL "$HOST/robots.txt" >/dev/null && echo "✅ robots"

echo -n "Testing /sitemap.xml... "
curl -fsSL "$HOST/sitemap.xml" >/dev/null && echo "✅ sitemap"

echo "================================================"
echo "🎉 All smoke tests passed!"
echo ""
echo "Extend with webhook tests when tokens available:"
echo "  curl -X POST $HOST/internal/alert/test"
echo "  curl '$HOST/a/r?t=invalid' # expect 403"