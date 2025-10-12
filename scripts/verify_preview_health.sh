#!/usr/bin/env bash
# Verify preview health and blank screen fixes
set -euo pipefail

BASE="${1:-https://hysvqdwmhxnblxfqnszn.supabase.co}"

echo "=== Preview Health Verification ==="
echo ""

# Test 1: Healthz endpoint responds
echo "Test 1: Health check endpoint"
response=$(curl -s "$BASE/functions/v1/healthz")
if echo "$response" | grep -q "cold_start"; then
  echo "✅ Healthz endpoint responding"
else
  echo "❌ Healthz endpoint failed"
fi
echo ""

# Test 2: Prewarm job completes
echo "Test 2: Prewarm job execution"
response=$(curl -s -X POST "$BASE/functions/v1/prewarm-cron" -H "Content-Type: application/json")
if echo "$response" | grep -q "endpoints_warmed"; then
  echo "✅ Prewarm job completed"
else
  echo "❌ Prewarm job failed"
fi
echo ""

# Test 3: Recording purge job works
echo "Test 3: Recording retention purge"
response=$(curl -s -X POST "$BASE/functions/v1/recording-purge" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo")
if echo "$response" | grep -q "success"; then
  echo "✅ Recording purge job working"
else
  echo "❌ Recording purge failed"
fi
echo ""

echo "=== Verification Complete ==="
echo ""
echo "Manual checks required:"
echo "  1. Visit preview URL - should render immediately"
echo "  2. No blank screen for >1 second"
echo "  3. Console shows '✅ Preview Unblanker: No issues detected'"
echo "  4. All page sections visible"
echo "  5. Check /privacy#call-recording anchor works"
echo ""
echo "Monitoring queries:"
echo "  SELECT * FROM cron.job WHERE jobname LIKE 'recording%' OR jobname LIKE 'prewarm%';"
echo "  SELECT * FROM analytics_events WHERE event_type LIKE 'blank_screen%' ORDER BY created_at DESC LIMIT 10;"
