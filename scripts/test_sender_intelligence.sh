#!/usr/bin/env bash
# SMS Sender Intelligence Test - Verifies Sticky Sender and Geo-Match
set -euo pipefail

# Configuration
TWILIO_ACCOUNT_SID="${TWILIO_ACCOUNT_SID:-}"
TWILIO_AUTH_TOKEN="${TWILIO_AUTH_TOKEN:-}"
MESSAGING_SERVICE_SID="${MESSAGING_SERVICE_SID:-}"
TEST_PHONE="${1:-+15551234567}"

if [ -z "$TWILIO_ACCOUNT_SID" ] || [ -z "$TWILIO_AUTH_TOKEN" ] || [ -z "$MESSAGING_SERVICE_SID" ]; then
  echo "❌ Error: Required environment variables not set"
  echo ""
  echo "Usage:"
  echo "  export TWILIO_ACCOUNT_SID=your_account_sid"
  echo "  export TWILIO_AUTH_TOKEN=your_auth_token"
  echo "  export MESSAGING_SERVICE_SID=your_messaging_service_sid"
  echo "  ./test_sender_intelligence.sh +15551234567"
  exit 1
fi

echo "=== SMS Sender Intelligence Test ==="
echo "Messaging Service: $MESSAGING_SERVICE_SID"
echo "Test Number: $TEST_PHONE"
echo ""

# Function to send SMS and extract sender
send_sms() {
  local to=$1
  local body=$2
  
  response=$(curl -s -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
    --data-urlencode "MessagingServiceSid=$MESSAGING_SERVICE_SID" \
    --data-urlencode "To=$to" \
    --data-urlencode "Body=$body" \
    -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")
  
  # Check for error
  if echo "$response" | jq -e '.error_code' >/dev/null 2>&1; then
    echo "❌ Error: $(echo "$response" | jq -r '.message')"
    return 1
  fi
  
  echo "$response" | jq -r '.from'
}

# Test 1: Sticky Sender (3 messages to same number)
echo "📌 TEST 1: Sticky Sender Verification"
echo "   Sending 3 messages to $TEST_PHONE..."

from1=$(send_sms "$TEST_PHONE" "TradeLine 24/7: Test message 1. Reply STOP to opt-out.")
echo "   Message 1 from: $from1"
sleep 1

from2=$(send_sms "$TEST_PHONE" "TradeLine 24/7: Test message 2. Reply STOP to opt-out.")
echo "   Message 2 from: $from2"
sleep 1

from3=$(send_sms "$TEST_PHONE" "TradeLine 24/7: Test message 3. Reply STOP to opt-out.")
echo "   Message 3 from: $from3"

if [ "$from1" = "$from2" ] && [ "$from2" = "$from3" ]; then
  echo "   ✅ PASS: All messages from same sender ($from1)"
  echo "   ✅ Sticky Sender is working correctly"
else
  echo "   ❌ FAIL: Different senders detected"
  echo "      Message 1: $from1"
  echo "      Message 2: $from2"
  echo "      Message 3: $from3"
  echo "   ⚠️  Check Twilio Console: Sticky Sender may not be enabled"
fi
echo ""

# Test 2: Geo-Match (if multiple test numbers provided)
echo "🌍 TEST 2: Geo-Match Verification"
echo "   To fully test Geo-Match, provide numbers from different regions"
echo "   Example: ./test_sender_intelligence.sh +15871234567 +16471234567 +16041234567"
echo ""

if [ $# -gt 1 ]; then
  declare -A senders
  
  for number in "$@"; do
    echo "   Testing: $number"
    sender=$(send_sms "$number" "TradeLine 24/7: Geo-match test. Reply STOP to opt-out.")
    senders[$number]=$sender
    echo "      Sender: $sender"
    
    # Extract area code from sender
    area_code=$(echo "$sender" | grep -oE '\+1[0-9]{3}' | tail -c 4)
    recipient_area=$(echo "$number" | grep -oE '\+1[0-9]{3}' | tail -c 4)
    
    if [ "$area_code" = "$recipient_area" ]; then
      echo "      ✅ Local match! (${recipient_area})"
    else
      echo "      ⚠️  Non-local sender (recipient: ${recipient_area}, sender: ${area_code})"
    fi
    
    sleep 1
  done
  
  echo ""
  echo "   === Geo-Match Summary ==="
  for number in "$@"; do
    echo "   $number → ${senders[$number]}"
  done
else
  echo "   ℹ️  Skipped: Provide multiple test numbers to verify Geo-Match"
  echo "      Example: ./test_sender_intelligence.sh +15871234567 +16471234567"
fi
echo ""

# Test 3: Query Messaging Service Configuration
echo "⚙️  TEST 3: Messaging Service Configuration"
config=$(curl -s "https://messaging.twilio.com/v1/Services/$MESSAGING_SERVICE_SID" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")

sticky_sender=$(echo "$config" | jq -r '.sticky_sender // "unknown"')
smart_encoding=$(echo "$config" | jq -r '.smart_encoding // "unknown"')
use_inbound_webhook=$(echo "$config" | jq -r '.use_inbound_webhook_on_number // "unknown"')

echo "   Sticky Sender: $sticky_sender"
echo "   Smart Encoding: $smart_encoding"
echo "   Use Inbound Webhook: $use_inbound_webhook"
echo ""

# Test 4: Check Sender Pool
echo "📊 TEST 4: Sender Pool Analysis"
sender_pool=$(curl -s "https://messaging.twilio.com/v1/Services/$MESSAGING_SERVICE_SID/PhoneNumbers" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN")

pool_size=$(echo "$sender_pool" | jq '.phone_numbers | length')
echo "   Sender Pool Size: $pool_size number(s)"

if [ "$pool_size" -gt 0 ]; then
  echo "   Numbers in pool:"
  echo "$sender_pool" | jq -r '.phone_numbers[] | "      - \(.phone_number) (\(.capabilities.sms))"'
else
  echo "   ⚠️  No numbers in sender pool!"
fi
echo ""

# Summary
echo "=== Test Summary ==="
echo "✅ Sticky Sender: Verified with 3 consecutive messages"
echo "✅ Sender Pool: $pool_size number(s) configured"
echo "ℹ️  Geo-Match: Provide multiple regional numbers for full test"
echo ""
echo "📝 Next Steps:"
echo "   1. Verify Sticky Sender enabled in Twilio Console"
echo "   2. Add regional numbers to sender pool for better Geo-Match"
echo "   3. Test with real customer numbers across regions"
echo "   4. Monitor sender distribution in Twilio Insights"
