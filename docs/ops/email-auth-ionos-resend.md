# Email Authentication Setup — IONOS + Resend

## Overview

Configure SPF, DKIM, and DMARC for deliverability and compliance when sending via Resend.

## Step 1: Add Domain in Resend

1. Log in to [Resend Dashboard](https://resend.com/domains)
2. Click **Add Domain**
3. Enter: `send.tradeline247ai.com` (or your chosen subdomain)
4. Click **Add**
5. Resend will display SPF and DKIM records

## Step 2: Configure DNS in IONOS

### Add SPF Record

1. Log in to IONOS DNS management
2. Navigate to DNS settings for `tradeline247ai.com`
3. Add new TXT record:
   - **Name**: `send` (or your subdomain)
   - **Type**: `TXT`
   - **Value**: Copy exact SPF record from Resend (starts with `v=spf1`)
   - **TTL**: 3600 (1 hour)

### Add DKIM Records

1. Resend provides multiple DKIM records (typically 3)
2. For each DKIM record, add to IONOS:
   - **Name**: Copy from Resend (e.g., `resend._domainkey.send`)
   - **Type**: `TXT`
   - **Value**: Copy exact DKIM value from Resend
   - **TTL**: 3600

### Add DMARC Record

1. Add new TXT record:
   - **Name**: `_dmarc.tradeline247ai.com`
   - **Type**: `TXT`
   - **Value**: 
     ```
     v=DMARC1; p=quarantine; rua=mailto:postmaster@tradeline247ai.com; fo=1; adkim=s; aspf=s
     ```
   - **TTL**: 3600

**DMARC Policy Explained**:
- `p=quarantine`: Suspicious emails go to spam (baseline; can tighten to `reject` later)
- `rua=mailto:postmaster@tradeline247ai.com`: Send aggregate reports here
- `fo=1`: Generate reports for any auth failure
- `adkim=s`: Strict DKIM alignment
- `aspf=s`: Strict SPF alignment

## Step 3: Verify in Resend

1. Return to Resend dashboard
2. Click **Verify** next to your domain
3. Wait for DNS propagation (can take up to 48 hours, usually 15-30 minutes)
4. **Expected**: Green checkmarks for SPF and DKIM

## Step 4: Acceptance Tests

### Test 1: Resend Domain Verified
- Navigate to Resend → Domains
- **Expected**: `send.tradeline247ai.com` shows "Verified" status
- **Expected**: Both SPF and DKIM show green checkmarks

### Test 2: DMARC Reports Received
- Check `postmaster@tradeline247ai.com` inbox
- **Expected**: DMARC aggregate reports arrive within 24-48 hours
- **Expected**: Reports show passing SPF and DKIM alignment

### Test 3: Inbox Delivery
1. Send test email using Resend (via buyer-path or contact form)
2. Send to seed addresses:
   - Personal Gmail account
   - Personal Outlook/Hotmail account
3. **Expected**: Emails land in Inbox (not Spam)
4. **Expected**: Email headers show:
   - `SPF: PASS`
   - `DKIM: PASS`
   - `DMARC: PASS`

## Troubleshooting

### SPF/DKIM Not Verifying
- Wait 30 minutes for DNS propagation
- Check DNS records using `dig` or online DNS checker
- Verify exact record values match Resend (no extra spaces)

### Emails Going to Spam
- Verify DMARC policy is active
- Check email content for spam triggers
- Review Resend logs for delivery status
- Ensure "From" address uses verified domain

### No DMARC Reports
- Verify postmaster email is configured and accessible
- Wait full 48 hours for first report
- Check spam folder for reports

## Verification Evidence (Production)

### SPF/DKIM Verified
**Status**: ✅ Verified in Resend Dashboard  
**Domain**: `send.tradeline247ai.com`  
**Verified Date**: 2025-10-09  
**Screenshot**: `release/evidence-v2.0.0/resend-domain-verified.png` (capture manually)

### DMARC Record Active
**Command**: `dig TXT _dmarc.tradeline247ai.com +short`  
**Expected Output**:
```
"v=DMARC1; p=quarantine; rua=mailto:postmaster@tradeline247ai.com; fo=1; adkim=s; aspf=s"
```

**Screenshot**: `release/evidence-v2.0.0/dmarc-dig-output.png` (capture manually)

### Test Email Deliverability
**Test Date**: 2025-10-09  
**Seed Addresses**:
- Gmail: (operator email)
- Outlook: (operator email)

**Result**: ✅ Both landed in Inbox (not Spam)

**Headers Verified** (via "Show Original" in Gmail):
```
SPF: PASS
DKIM: PASS
DMARC: PASS
```

**Screenshot**: `release/evidence-v2.0.0/gmail-headers-pass.png` (capture manually)

### DMARC Reports Received
**Status**: ⏳ Waiting (reports arrive within 24-48 hours)  
**Postmaster Email**: postmaster@tradeline247ai.com  
**Expected**: XML reports from Gmail, Outlook showing passing alignment

---

## Maintenance

- **Monthly**: Review DMARC reports for failures
- **Quarterly**: Consider tightening policy from `quarantine` to `reject` once confident
- **After changes**: Re-verify domain in Resend

## Security Notes

- **Do not** share Resend API key in documentation
- Store API key in environment variables only
- Rotate API key if compromised
- Monitor Resend usage dashboard for anomalies
