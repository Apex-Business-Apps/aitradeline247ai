# Google Play Data Safety Declaration — v2.0.0

**Last Updated**: 2025-10-10  
**App**: TradeLine 24/7  
**Package**: app.lovable.555a49714138435ea7eedfa3d713d1d3  
**Status**: Submitted to Play Console

## Overview

This document records exactly what we declared in the Google Play Console Data Safety section. It must match our actual data handling practices.

---

## Data Collected

### Personal Info

#### Name
- **Collected**: ✅ Yes
- **Purpose**: App functionality (user profiles, call logs)
- **Shared with third parties**: ❌ No
- **User can request deletion**: ✅ Yes

#### Email Address
- **Collected**: ✅ Yes
- **Purpose**: App functionality (authentication, notifications, transcripts)
- **Shared with third parties**: ⚠️ **Yes** (Resend for email delivery)
- **User can request deletion**: ✅ Yes

#### Phone Number
- **Collected**: ✅ Yes
- **Purpose**: App functionality (call routing, SMS, number attachment)
- **Shared with third parties**: ⚠️ **Yes** (Twilio for voice/SMS)
- **User can request deletion**: ✅ Yes

### Financial Info

#### Payment Info
- **Collected**: ❌ No (handled by Stripe/Play Billing, we only store subscription_status)
- **Purpose**: N/A
- **Shared with third parties**: N/A
- **User can request deletion**: N/A

### Messages

#### SMS or MMS
- **Collected**: ✅ Yes
- **Purpose**: App functionality (SMS relay, automated responses)
- **Shared with third parties**: ⚠️ **Yes** (Twilio for SMS delivery)
- **User can request deletion**: ✅ Yes

#### Other In-App Messages
- **Collected**: ✅ Yes (call transcripts, voicemails)
- **Purpose**: App functionality (call logs, transcription)
- **Shared with third parties**: ⚠️ **Yes** (OpenAI for transcription, if enabled)
- **User can request deletion**: ✅ Yes

### App Activity

#### App Interactions
- **Collected**: ✅ Yes
- **Purpose**: Analytics, fraud prevention (event tracking via `secure-analytics`)
- **Shared with third parties**: ❌ No (stored in Supabase only)
- **User can request deletion**: ✅ Yes

#### In-App Search History
- **Collected**: ❌ No
- **Purpose**: N/A
- **Shared with third parties**: N/A
- **User can request deletion**: N/A

### Device or Other IDs

#### Device or Other IDs
- **Collected**: ✅ Yes (user agent, IP address for rate limiting)
- **Purpose**: Fraud prevention, security (rate limiting, abuse detection)
- **Shared with third parties**: ❌ No
- **User can request deletion**: ✅ Yes (after 90 days auto-deletion)

---

## Data Shared with Third Parties

### Twilio (Voice & SMS)
- **Data Shared**: Phone numbers (from/to E.164), call durations, SMS content
- **Purpose**: App functionality (call routing, SMS delivery)
- **Twilio's Data Use**: Service provider (does not use data for marketing)
- **Twilio Privacy Policy**: https://www.twilio.com/legal/privacy

### Resend (Email Delivery)
- **Data Shared**: Email addresses, email content (transcripts, notifications)
- **Purpose**: App functionality (transactional emails)
- **Resend's Data Use**: Service provider (does not use data for marketing)
- **Resend Privacy Policy**: https://resend.com/legal/privacy-policy

### Supabase (Backend & Database)
- **Data Shared**: All app data (profiles, call logs, SMS logs, analytics)
- **Purpose**: App infrastructure (database, authentication, edge functions)
- **Supabase's Data Use**: Service provider (does not use data for marketing)
- **Supabase Privacy Policy**: https://supabase.com/privacy

### OpenAI (Transcription - Optional)
- **Data Shared**: Call audio (if transcription enabled)
- **Purpose**: App functionality (call transcription via Whisper API)
- **OpenAI's Data Use**: ⚠️ **TODO: Verify OpenAI does NOT train on our data** (need API-only agreement)
- **OpenAI Privacy Policy**: https://openai.com/policies/privacy-policy

---

## Security Practices

### Data Encryption

#### In Transit
- **Encryption**: ✅ Yes (TLS 1.3)
- **Applied to**: All data (API calls, webhooks, web traffic)

#### At Rest
- **Encryption**: ✅ Yes (AES-256)
- **Applied to**: PII fields in `appointments`, `profiles_pii` tables (using `pgcrypto`)

### User Controls

#### Data Deletion
- **User can request deletion**: ✅ Yes (via support email)
- **Deletion timeline**: Within 30 days
- **Scope**: All user data (profiles, call logs, SMS logs, transcripts)
- **Exceptions**: Financial records (7 years legal retention)

#### Data Export
- **User can export data**: ✅ Yes (via support email)
- **Export format**: JSON + CSV
- **Export timeline**: Within 7 days

---

## Data Retention

| Data Type | Retention Period | Auto-Deletion |
|-----------|------------------|---------------|
| Call logs | 90 days | ✅ Yes (cron job) |
| SMS logs | 90 days | ✅ Yes (cron job) |
| Call transcripts | 90 days | ✅ Yes (cron job) |
| Analytics events (with PII) | 90 days | ✅ Yes (cron job) |
| User profiles | Until account deletion | ❌ Manual (user request) |
| Financial records | 7 years | ❌ Legal requirement |

---

## Compliance Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| **PIPEDA (Canada)** | ✅ Compliant | Built in Canada, follows Canadian privacy law |
| **CASL (Anti-Spam)** | ✅ Compliant | Explicit consent for SMS/email; unsubscribe links |
| **GDPR (EU)** | ⚠️ **TODO** | Need to add explicit GDPR consent + data portability |
| **CCPA (California)** | ⚠️ **TODO** | Need "Do Not Sell My Info" link (if we sell data - currently NO) |
| **COPPA (Children <13)** | ✅ N/A | App not intended for children <13 |

---

## Gaps & TODOs

### Critical (Before Public Launch)

1. **OpenAI Data Use Agreement**
   - ⚠️ Verify OpenAI API does NOT use our call audio for training
   - If they do, we MUST disclose in Play Console data safety
   - Alternative: Self-host Whisper model (avoids third-party sharing)

2. **GDPR Compliance** (if targeting EU users)
   - Add explicit GDPR consent checkbox on signup
   - Implement automated data export (not just manual via email)
   - Add "Right to be Forgotten" self-service button

3. **Data Breach Response Plan**
   - Document incident response procedure
   - Set up breach notification system (email users within 72 hours)

### Medium Priority

4. **Rate Limiting Disclosure**
   - We collect IP addresses for rate limiting (already disclosed as "Device IDs")
   - Confirm Play Console disclosure matches our `support_ticket_rate_limits` table

5. **Audit Third-Party Processors**
   - Request annual SOC 2 reports from Twilio, Resend, Supabase
   - Verify they meet Play Store's "Service Provider" definition

6. **User-Facing Privacy Policy**
   - Expand `/privacy` page to match Play Console disclosures
   - Add section on third-party data sharing
   - Add section on data retention timelines

---

## Verification Checklist

Before each Play Store update, verify:

- [ ] Play Console Data Safety matches this document
- [ ] `/privacy` page matches Play Console disclosures
- [ ] No new third-party processors added without disclosure update
- [ ] PII encryption enabled for all sensitive fields
- [ ] Auto-deletion cron jobs running (check `cleanup_old_analytics_events` function logs)
- [ ] Unsubscribe links working in all emails
- [ ] Data export/deletion requests processed within SLA

---

## Contact for Data Requests

**Email**: info@tradeline247ai.com  
**Response Time**: Within 7 business days  
**Supported Requests**:
- Data export (JSON/CSV)
- Data deletion (account + all logs)
- Opt-out of marketing (email/SMS)
- Data correction (update profile info)

---

## References

- Play Console: https://play.google.com/console/u/0/developers/{developer_id}/app-list
- Privacy Policy: https://tradeline247ai.com/privacy
- Terms of Service: https://tradeline247ai.com/terms
- Security Documentation: `SECURITY.md`
- Encryption Guide: `PII_ENCRYPTION_GUIDE.md`
