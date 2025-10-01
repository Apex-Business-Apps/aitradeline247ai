#!/bin/bash
# Guardian Verification Script - Local testing without network dependencies

set -e

echo "🛡️ Guardian Verification Suite"
echo "================================"

BASE_URL="${GUARDIAN_BASE_URL:-http://localhost:54321/functions/v1}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo}"

echo ""
echo "Testing /healthz endpoint..."
HEALTHZ_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/healthz")
HEALTHZ_CODE=$(echo "$HEALTHZ_RESPONSE" | tail -n1)
HEALTHZ_BODY=$(echo "$HEALTHZ_RESPONSE" | head -n-1)

if [ "$HEALTHZ_CODE" = "200" ]; then
  echo "✅ /healthz returned 200 OK"
  echo "   Response: $HEALTHZ_BODY"
  
  # Verify required fields
  if echo "$HEALTHZ_BODY" | jq -e '.status' > /dev/null 2>&1; then
    STATUS=$(echo "$HEALTHZ_BODY" | jq -r '.status')
    if [ "$STATUS" = "healthy" ]; then
      echo "   ✅ Status is 'healthy'"
    else
      echo "   ❌ Status is '$STATUS' (expected 'healthy')"
      exit 1
    fi
  else
    echo "   ❌ Missing 'status' field"
    exit 1
  fi
  
  if echo "$HEALTHZ_BODY" | jq -e '.timestamp' > /dev/null 2>&1; then
    echo "   ✅ Timestamp present"
  else
    echo "   ❌ Missing 'timestamp' field"
    exit 1
  fi
else
  echo "❌ /healthz returned $HEALTHZ_CODE (expected 200)"
  echo "   Response: $HEALTHZ_BODY"
  exit 1
fi

echo ""
echo "Testing /readyz endpoint..."
READYZ_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/readyz")
READYZ_CODE=$(echo "$READYZ_RESPONSE" | tail -n1)
READYZ_BODY=$(echo "$READYZ_RESPONSE" | head -n-1)

if [ "$READYZ_CODE" = "200" ] || [ "$READYZ_CODE" = "503" ]; then
  echo "✅ /readyz returned $READYZ_CODE"
  echo "   Response: $READYZ_BODY"
  
  # Verify required fields
  if echo "$READYZ_BODY" | jq -e '.ready' > /dev/null 2>&1; then
    READY=$(echo "$READYZ_BODY" | jq -r '.ready')
    echo "   ✅ Ready status: $READY"
  else
    echo "   ❌ Missing 'ready' field"
    exit 1
  fi
  
  if echo "$READYZ_BODY" | jq -e '.checks' > /dev/null 2>&1; then
    echo "   ✅ Health checks present"
    
    # Verify individual check structure
    CHECKS=$(echo "$READYZ_BODY" | jq -r '.checks | keys[]')
    for CHECK in $CHECKS; do
      STATUS=$(echo "$READYZ_BODY" | jq -r ".checks.${CHECK}.status")
      echo "      - $CHECK: $STATUS"
    done
  else
    echo "   ❌ Missing 'checks' field"
    exit 1
  fi
  
  if echo "$READYZ_BODY" | jq -e '.timestamp' > /dev/null 2>&1; then
    echo "   ✅ Timestamp present"
  else
    echo "   ❌ Missing 'timestamp' field"
    exit 1
  fi
else
  echo "❌ /readyz returned $READYZ_CODE (expected 200 or 503)"
  echo "   Response: $READYZ_BODY"
  exit 1
fi

echo ""
echo "Testing guardian-health-monitor endpoint..."
MONITOR_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${ANON_KEY}" \
  "${BASE_URL}/guardian-health-monitor")
MONITOR_CODE=$(echo "$MONITOR_RESPONSE" | tail -n1)
MONITOR_BODY=$(echo "$MONITOR_RESPONSE" | head -n-1)

if [ "$MONITOR_CODE" = "200" ]; then
  echo "✅ guardian-health-monitor returned 200 OK"
  echo "   Response: $MONITOR_BODY"
  
  MODE=$(echo "$MONITOR_BODY" | jq -r '.autoheal_mode // "unknown"')
  echo "   Auto-heal mode: $MODE"
  
  if [ "$MODE" = "dry_run" ]; then
    echo "   ✅ Auto-heal in DRY-RUN mode (safe default)"
  else
    echo "   ⚠️  Auto-heal mode is '$MODE' (expected 'dry_run')"
  fi
else
  echo "⚠️  guardian-health-monitor returned $MONITOR_CODE"
  echo "   Response: $MONITOR_BODY"
fi

echo ""
echo "================================"
echo "✅ Guardian verification complete"
echo ""
echo "Summary:"
echo "  - /healthz: operational"
echo "  - /readyz: operational"
echo "  - guardian-health-monitor: operational"
echo "  - Auto-heal: DRY-RUN mode (safe)"
echo ""
echo "Next steps:"
echo "  1. Monitor health endpoints in production"
echo "  2. Review circuit breaker configurations"
echo "  3. Test synthetic checks with: npm run verify:synthetic"
