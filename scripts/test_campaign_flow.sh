#!/usr/bin/env bash
# End-to-end campaign flow test
set -euo pipefail

# Configuration
SUPABASE_URL="${SUPABASE_URL:-https://hysvqdwmhxnblxfqnszn.supabase.co}"
JWT_TOKEN="${JWT_TOKEN:-}"
ORG_ID="${ORG_ID:-}"

if [ -z "$JWT_TOKEN" ] || [ -z "$ORG_ID" ]; then
  echo "Usage: JWT_TOKEN=xxx ORG_ID=xxx ./scripts/test_campaign_flow.sh"
  exit 1
fi

echo "=== Campaign Flow Test ==="
echo ""

# 1. Create test campaign
echo "1. Creating test campaign..."
campaign_response=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/ops-campaigns-create" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"name\": \"Test Campaign $(date +%s)\",
    \"subject\": \"Test: Quick update from TradeLine 24/7\",
    \"body_template\": \"<p>Test email</p><p><a href=\\\"{unsubscribe_url}\\\">Unsubscribe</a></p>\",
    \"consent_basis_filter\": [\"express\"]
  }")

echo "$campaign_response" | jq .

campaign_id=$(echo "$campaign_response" | jq -r '.campaign.id')
if [ "$campaign_id" = "null" ] || [ -z "$campaign_id" ]; then
  echo "❌ Failed to create campaign"
  exit 1
fi

echo "✅ Campaign created: $campaign_id"
echo ""

# 2. Dry run
echo "2. Running dry run (10 contacts)..."
dry_run_response=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/ops-campaigns-send" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaign_id\": \"$campaign_id\",
    \"batch_size\": 10,
    \"dry_run\": true
  }")

echo "$dry_run_response" | jq .
echo ""

# 3. Test unsubscribe
echo "3. Testing unsubscribe endpoint..."
unsub_response=$(curl -s \
  "$SUPABASE_URL/functions/v1/unsubscribe?e=test-$(date +%s)@example.com")
echo "$unsub_response" | jq .

unsub_success=$(echo "$unsub_response" | jq -r '.success')
if [ "$unsub_success" = "true" ]; then
  echo "✅ Unsubscribe works"
else
  echo "❌ Unsubscribe failed"
  exit 1
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "Campaign ID: $campaign_id"
echo ""
echo "To send real emails (careful!):"
echo "curl -X POST \\"
echo "  \"$SUPABASE_URL/functions/v1/ops-campaigns-send\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"campaign_id\": \"$campaign_id\", \"batch_size\": 5, \"dry_run\": false}'"
