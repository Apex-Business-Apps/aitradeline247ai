# DRIFT-07: First Campaign (Relaunch - Canada)

## Campaign Strategy

**Purpose**: Low-risk relaunch announcement to warm Canadian contacts
**Audience**: Consented leads with express, implied_ebr, or implied_published basis
**Sending Domain**: tradeline247ai.com (or tradeline247.ca if configured)
**Risk Level**: LOW (existing relationships, CASL-compliant)

## Campaign Setup

### 1. Create Campaign

```bash
curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-campaigns-create" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "YOUR_ORG_ID",
    "name": "Relaunch — Canada",
    "subject": "Quick update from TradeLine 24/7",
    "body_template": "<!-- See body template below -->",
    "consent_basis_filter": ["express", "implied_ebr", "implied_published"],
    "lead_filters": {
      "country": "Canada"
    }
  }'
```

### 2. Subject Line A/B Test

**Test Setup:**
- Split audience 50/50
- Run both variants simultaneously
- Monitor open rates after 24 hours

**Variant A (Control):**
```
Quick update from TradeLine 24/7
```

**Variant B (Value-driven):**
```
We've got you covered after hours (quick update)
```

**Success Metric:**
- Target open rate: > 20%
- Pick winner based on: opens + engagement

### 3. Email Body Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick Update - TradeLine 24/7</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">TradeLine 24/7</h1>
    <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your 24/7 AI Receptionist</p>
  </div>

  <div style="background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px;">
    
    <p style="margin-top: 0;">Hi there,</p>

    <p>Quick update from our team at <strong>Apex Business Systems</strong> in Edmonton.</p>

    <p>We've been helping Canadian businesses never miss another call — even when you're off the clock, on-site, or dealing with after-hours emergencies.</p>

    <div style="background: white; padding: 20px; margin: 25px 0; border-left: 4px solid #667eea; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px;"><strong>What we do:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Answer calls 24/7 with AI-powered receptionist</li>
        <li>Book appointments while you sleep</li>
        <li>Capture every lead, every time</li>
        <li>Integrate with your calendar and CRM</li>
      </ul>
    </div>

    <p><strong>Why reach out now?</strong> We're relaunching our service with enhanced features specifically designed for Canadian businesses:</p>
    <ul style="margin: 10px 0;">
      <li>✓ PIPEDA-compliant data handling</li>
      <li>✓ Bilingual support (EN/FR)</li>
      <li>✓ Canadian pricing in CAD</li>
      <li>✓ Edmonton-based support team</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.tradeline247ai.com/pricing" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Plans & Pricing</a>
    </div>

    <p><small style="color: #666;">No pressure — just wanted you to know we're here if your business could use 24/7 coverage.</small></p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <div style="font-size: 13px; color: #666; line-height: 1.8;">
      <p><strong>Apex Business Systems</strong><br>
      Edmonton, AB, Canada<br>
      <a href="mailto:info@tradeline247ai.com" style="color: #667eea;">info@tradeline247ai.com</a></p>

      <p>
        <a href="https://www.tradeline247ai.com/privacy" style="color: #667eea; text-decoration: none;">Privacy Policy</a> | 
        <a href="{unsubscribe_url}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
      </p>

      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        You're receiving this because you have an existing relationship with us or requested information about our services. 
        You can unsubscribe anytime using the link above.
      </p>
    </div>

  </div>

</body>
</html>
```

## Implementation Steps

### Step 1: Verify Prerequisites

```sql
-- Check leads count
SELECT COUNT(*) as total_leads,
  COUNT(CASE WHEN source = 'website_form' THEN 1 END) as express,
  COUNT(CASE WHEN source = 'existing_customer' THEN 1 END) as implied_ebr,
  COUNT(CASE WHEN source = 'imported' THEN 1 END) as implied_published
FROM leads;

-- Check unsubscribes
SELECT COUNT(*) FROM unsubscribes;

-- Verify DNS records
-- Run: dig TXT tradeline247ai.com
-- Run: dig TXT _dmarc.tradeline247ai.com
```

### Step 2: Create Campaign (DO NOT SEND YET)

```bash
# Replace YOUR_ORG_ID and YOUR_JWT_TOKEN
export ORG_ID="your-org-uuid"
export JWT_TOKEN="your-jwt-token"

curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-campaigns-create" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"name\": \"Relaunch — Canada\",
    \"subject\": \"Quick update from TradeLine 24/7\",
    \"body_template\": \"$(cat relaunch_email.html | jq -Rs .)\",
    \"consent_basis_filter\": [\"express\", \"implied_ebr\", \"implied_published\"]
  }"
```

### Step 3: Review Campaign Members

```sql
-- Get campaign ID from previous response
SELECT 
  cm.email,
  cm.consent_basis,
  l.name,
  l.company
FROM campaign_members cm
JOIN leads l ON l.id = cm.lead_id
WHERE cm.campaign_id = 'YOUR_CAMPAIGN_ID'
  AND cm.status = 'pending'
LIMIT 20;

-- Check counts
SELECT 
  consent_basis,
  COUNT(*) as count
FROM campaign_members
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
GROUP BY consent_basis;
```

### Step 4: Dry Run (10 Contacts)

```bash
export CAMPAIGN_ID="your-campaign-uuid"

curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-campaigns-send" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaign_id\": \"$CAMPAIGN_ID\",
    \"batch_size\": 10,
    \"dry_run\": true
  }"
```

### Step 5: Test Send (3-5 Internal Emails)

**Manual Test:**
1. Add your own emails to leads table with `express` consent
2. Run small batch send (5 emails max)
3. Verify:
   - Email arrives in inbox
   - Gmail shows "Unsubscribe" button
   - One-click unsubscribe works
   - Headers show SPF/DKIM/DMARC pass
   - Links work correctly
   - Unsubscribe link redirects properly

```bash
# Test send to internal emails
curl -X POST \
  "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/ops-campaigns-send" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaign_id\": \"$CAMPAIGN_ID\",
    \"batch_size\": 5,
    \"dry_run\": false
  }"
```

### Step 6: Verify Test Results

**Check Gmail Headers:**
```
Show original → Look for:
Authentication-Results: ... dkim=pass ... spf=pass ... dmarc=pass
List-Unsubscribe: <https://www.tradeline247ai.com/unsubscribe?e=...>
```

**Test Unsubscribe:**
1. Click "Unsubscribe" in Gmail
2. Verify instant 200 response
3. Check database:
```sql
SELECT * FROM unsubscribes WHERE email = 'your-test-email@example.com';
```

### Step 7: Production Send Schedule

**DO NOT send all at once. Use gradual rollout:**

```bash
# Day 1: First 100 (highest quality leads)
curl -X POST ... -d '{"campaign_id": "...", "batch_size": 100, "dry_run": false}'

# Wait 4 hours, check metrics

# Day 1 Evening: Next 200
curl -X POST ... -d '{"campaign_id": "...", "batch_size": 200, "dry_run": false}'

# Day 2: Monitor bounces/complaints
# Check Resend dashboard
# Check Google Postmaster Tools

# Day 2 Afternoon: Next 500 (if metrics good)
# Continue gradual rollout
```

## Success Metrics

### Target Goals:
- **Open Rate**: > 20%
- **Click Rate**: > 2%
- **Bounce Rate**: < 5%
- **Spam Complaint Rate**: < 0.1% (CRITICAL)
- **Unsubscribe Rate**: < 2%

### Monitoring Query:
```sql
SELECT 
  COUNT(*) as total_sent,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
  COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked,
  ROUND(COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as open_rate,
  ROUND(COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as click_rate
FROM campaign_members
WHERE campaign_id = 'YOUR_CAMPAIGN_ID'
  AND status != 'pending';
```

## Troubleshooting

### If Open Rate < 15%:
- Check subject line appeal
- Verify sender reputation (Postmaster Tools)
- Review email content for spam triggers
- Check if landing in spam folder (test emails)

### If Spam Rate > 0.3%:
- **IMMEDIATELY PAUSE CAMPAIGN**
- Review email content
- Check for spam trigger words
- Verify all links work
- Ensure unsubscribe is prominent

### If Bounces > 10%:
- Email list quality issue
- Verify email validation before import
- Remove hard bounces from list

## Post-Campaign Review

After 7 days:
- [ ] Total sent: ____
- [ ] Open rate: ____%
- [ ] Click rate: ____%
- [ ] Unsubscribes: ____
- [ ] Spam complaints: ____
- [ ] New leads generated: ____
- [ ] Bookings from campaign: ____

Document lessons learned for next campaign.

