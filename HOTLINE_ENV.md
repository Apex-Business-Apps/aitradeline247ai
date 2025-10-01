# Phase H-I6 — Hotline Environment Variables & Flags

## Required Secrets (Supabase Vault)

### Security
- **TWILIO_AUTH_TOKEN** - For webhook signature validation ✅ Configured
- **TWILIO_ACCOUNT_SID** - For Twilio API calls ✅ Configured

### Feature Flags (SAFE DEFAULTS)
- **HOTLINE_ENABLED** - Default: `false` (hotline OFF) ⚠️ NOT SET (safe)
- **HOTLINE_RECORDING_ENABLED** - Default: `false` (recording OFF) ⚠️ NOT SET (safe)

### Infrastructure
- **SUPABASE_URL** - Edge function base URL ✅ Configured
- **SUPABASE_SERVICE_ROLE_KEY** - Database access ✅ Configured
- **BUSINESS_TARGET_E164** - Support/sales phone number ✅ Configured

## Safe Defaults
**If flags are unset:**
- HOTLINE_ENABLED = `false` → Service unavailable (503)
- HOTLINE_RECORDING_ENABLED = `false` → No voicemail recording

**Security:** System is OFF by default. Must explicitly enable.

## Enabling Hotline (Production Checklist)
1. Obtain legal/privacy approvals (HOTLINE_CONSENT_DRAFT.md)
2. Set HOTLINE_ENABLED=true in Supabase secrets
3. Optionally set HOTLINE_RECORDING_ENABLED=true
4. Configure Twilio webhook URL to point to hotline-ivr-answer
5. Monitor logs for first 24 hours

**Current Status:** All flags OFF, system disabled by default.
