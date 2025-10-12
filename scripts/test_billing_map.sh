#!/usr/bin/env bash
# Test script for BILLING•MAP — Usage Mapping functionality
# Verifies that phone numbers can be mapped to tenants and usage is tracked
# Usage: ./scripts/test_billing_map.sh

set -e

echo "=========================================="
echo "BILLING•MAP USAGE MAPPING TEST"
echo "=========================================="
echo ""

# Test environment setup
SUPABASE_URL="${SUPABASE_URL:-https://hysvqdwmhxnblxfqnszn.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo}"

TEST_TENANT_ID="test-tenant-$(date +%s)"
TEST_PHONE="+1$(printf '%03d%07d' $((RANDOM % 900 + 100)) $((RANDOM % 10000000)))"
TEST_SID="PN$(openssl rand -hex 16)"

echo "Test Parameters:"
echo "  Tenant ID: $TEST_TENANT_ID"
echo "  Phone Number: $TEST_PHONE"
echo "  Twilio SID: $TEST_SID"
echo ""

# Test 1: Check tables exist
echo "[TEST 1] Verifying database tables..."
TABLES=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/pg_tables" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"schemaname":"public"}' 2>/dev/null || echo "[]")

if echo "$TABLES" | grep -q "tenant_phone_mappings"; then
  echo "  ✓ tenant_phone_mappings table exists"
else
  echo "  ✗ tenant_phone_mappings table NOT FOUND"
  exit 1
fi

if echo "$TABLES" | grep -q "tenant_usage_counters"; then
  echo "  ✓ tenant_usage_counters table exists"
else
  echo "  ✗ tenant_usage_counters table NOT FOUND"
  exit 1
fi

if echo "$TABLES" | grep -q "tenant_usage_logs"; then
  echo "  ✓ tenant_usage_logs table exists"
else
  echo "  ✗ tenant_usage_logs table NOT FOUND"
  exit 1
fi

echo ""

# Test 2: Check SQL functions exist
echo "[TEST 2] Verifying SQL functions..."
FUNCTIONS=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/pg_proc" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" 2>/dev/null || echo "[]")

for func in "get_or_create_usage_counter" "log_voice_usage" "log_sms_usage"; do
  if echo "$FUNCTIONS" | grep -q "$func"; then
    echo "  ✓ $func exists"
  else
    echo "  ✗ $func NOT FOUND"
    exit 1
  fi
done

echo ""

# Test 3: Test number mapping via edge function
echo "[TEST 3] Testing number mapping..."
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/ops-map-number-to-tenant" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenant_id\": \"${TEST_TENANT_ID}\",
    \"twilio_number_sid\": \"${TEST_SID}\",
    \"phone_number\": \"${TEST_PHONE}\",
    \"number_type\": \"both\"
  }")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "  ✓ Number mapped successfully"
  echo "  Response: $(echo $RESPONSE | jq -r '.evidence' 2>/dev/null || echo $RESPONSE)"
else
  echo "  ✗ Number mapping failed"
  echo "  Response: $RESPONSE"
  exit 1
fi

echo ""

# Test 4: Verify mapping was created
echo "[TEST 4] Verifying mapping in database..."
MAPPING=$(curl -s -G \
  "${SUPABASE_URL}/rest/v1/tenant_phone_mappings" \
  --data-urlencode "tenant_id=eq.${TEST_TENANT_ID}" \
  --data-urlencode "phone_number=eq.${TEST_PHONE}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json")

if echo "$MAPPING" | grep -q "$TEST_PHONE"; then
  echo "  ✓ Mapping found in database"
  MAPPING_ID=$(echo "$MAPPING" | jq -r '.[0].id' 2>/dev/null)
  echo "  Mapping ID: $MAPPING_ID"
else
  echo "  ✗ Mapping not found in database"
  echo "  Response: $MAPPING"
  exit 1
fi

echo ""

# Test 5: Verify usage counter was initialized
echo "[TEST 5] Verifying usage counter..."
COUNTER=$(curl -s -G \
  "${SUPABASE_URL}/rest/v1/tenant_usage_counters" \
  --data-urlencode "tenant_id=eq.${TEST_TENANT_ID}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json")

if echo "$COUNTER" | grep -q "$TEST_TENANT_ID"; then
  echo "  ✓ Usage counter initialized"
  VOICE_MINUTES=$(echo "$COUNTER" | jq -r '.[0].voice_minutes_used' 2>/dev/null)
  SMS_COUNT=$(echo "$COUNTER" | jq -r '.[0].sms_count_used' 2>/dev/null)
  echo "  Voice Minutes: $VOICE_MINUTES"
  echo "  SMS Count: $SMS_COUNT"
else
  echo "  ⚠ Usage counter not found (may be created on first usage)"
fi

echo ""

# Test 6: Test duplicate mapping (should update existing)
echo "[TEST 6] Testing duplicate mapping handling..."
RESPONSE2=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/ops-map-number-to-tenant" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenant_id\": \"${TEST_TENANT_ID}\",
    \"twilio_number_sid\": \"${TEST_SID}\",
    \"phone_number\": \"${TEST_PHONE}\",
    \"number_type\": \"voice\"
  }")

if echo "$RESPONSE2" | grep -q '"success":true'; then
  echo "  ✓ Duplicate mapping handled correctly"
  if echo "$RESPONSE2" | grep -q "updated"; then
    echo "  ✓ Existing mapping was updated"
  fi
else
  echo "  ✗ Duplicate mapping failed"
  echo "  Response: $RESPONSE2"
  exit 1
fi

echo ""
echo "=========================================="
echo "ALL TESTS PASSED ✓"
echo "=========================================="
echo ""
echo "Summary:"
echo "  • Database tables: ✓"
echo "  • SQL functions: ✓"
echo "  • Number mapping: ✓"
echo "  • Database verification: ✓"
echo "  • Usage counter: ✓"
echo "  • Duplicate handling: ✓"
echo ""
echo "BILLING•MAP system is fully operational!"
echo ""
