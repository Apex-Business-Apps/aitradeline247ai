#!/usr/bin/env bash
# DRIFT-05: Compliance verification script
set -euo pipefail

BASE="${1:-https://www.tradeline247ai.com}"
DOMAIN="tradeline247ai.com"

echo "=== CASL/PIPEDA/Mailbox Compliance Check ==="
echo ""

pass=true

# 1. CASL: Unsubscribe endpoint works
echo "== CASL: Unsubscribe endpoint =="
unsub_code=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/unsubscribe?e=test@example.com")
if [ "$unsub_code" = "200" ]; then
  echo "✅ Unsubscribe endpoint returns 200"
else
  echo "❌ Unsubscribe endpoint failed: HTTP $unsub_code"
  pass=false
fi

# 2. PIPEDA: Privacy policy accessible
echo ""
echo "== PIPEDA: Privacy policy =="
privacy_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/privacy")
if [ "$privacy_code" = "200" ]; then
  echo "✅ Privacy policy accessible"
else
  echo "❌ Privacy policy not found: HTTP $privacy_code"
  pass=false
fi

# 3. SPF Check
echo ""
echo "== SPF (Sender Policy Framework) =="
spf_record=$(dig +short TXT "$DOMAIN" | grep "v=spf1" || echo "")
if [ -n "$spf_record" ]; then
  echo "✅ SPF record found: $spf_record"
  if echo "$spf_record" | grep -q "resend.com"; then
    echo "✅ Resend included in SPF"
  else
    echo "⚠️  Resend not in SPF - add: include:_spf.resend.com"
    pass=false
  fi
else
  echo "❌ No SPF record found for $DOMAIN"
  pass=false
fi

# 4. DMARC Check
echo ""
echo "== DMARC (Domain-based Message Authentication) =="
dmarc_record=$(dig +short TXT "_dmarc.$DOMAIN" | grep "v=DMARC1" || echo "")
if [ -n "$dmarc_record" ]; then
  echo "✅ DMARC record found: $dmarc_record"
  if echo "$dmarc_record" | grep -qE "p=(quarantine|reject)"; then
    echo "✅ DMARC policy is quarantine or reject"
  else
    echo "❌ DMARC policy must be quarantine or reject (currently: $(echo "$dmarc_record" | grep -oE 'p=[a-z]+'))"
    pass=false
  fi
else
  echo "❌ No DMARC record found for $DOMAIN"
  echo "   Required: v=DMARC1; p=quarantine; rua=mailto:dmarc@$DOMAIN"
  pass=false
fi

# 5. DKIM Check (Resend default selector)
echo ""
echo "== DKIM (DomainKeys Identified Mail) =="
dkim_record=$(dig +short TXT "resend._domainkey.$DOMAIN" || echo "")
if [ -n "$dkim_record" ]; then
  echo "✅ DKIM record found (resend._domainkey)"
else
  echo "⚠️  DKIM record not found at resend._domainkey.$DOMAIN"
  echo "   Check Resend dashboard for correct selector"
fi

# 6. Database tables exist
echo ""
echo "== Database: Outreach tables =="
echo "   (Check manually via Supabase dashboard)"
echo "   Required tables:"
echo "   - unsubscribes"
echo "   - campaigns"
echo "   - campaign_members"
echo "   - v_sendable_members (view)"

# Summary
echo ""
echo "========================================"
if $pass; then
  echo "✅ COMPLIANCE CHECK: PASS"
  echo ""
  echo "Next steps:"
  echo "1. Test send to Gmail address"
  echo "2. Verify 'Unsubscribe' button appears"
  echo "3. Check 'Show original' for Authentication-Results"
  echo "4. Run dry run: ops-campaigns-send with dry_run=true"
  exit 0
else
  echo "❌ COMPLIANCE CHECK: FAIL"
  echo ""
  echo "Fix required items above before sending campaigns."
  exit 1
fi
