# Analytics Events Specification — v2.0.0

**Last Updated**: 2025-10-10  
**Tracking SDK**: `secure-analytics` edge function + client-side `AnalyticsTracker`

## Overview

All events are tracked via the `secure-analytics` edge function which enforces privacy-safe logging (no PII in event names/props).

## Event Catalog

### App Lifecycle

#### `app_install`
**When**: PWA install prompt accepted  
**Props**:
- `platform`: "android" | "ios" | "desktop"
- `user_agent`: browser user agent string
- `timestamp`: ISO 8601

#### `app_open`
**When**: App opened (from installed PWA or web)  
**Props**:
- `source`: "pwa" | "web"
- `referrer`: document.referrer (if available)

#### `error_boundary_hit`
**When**: React error boundary catches error  
**Props**:
- `error_message`: sanitized error message (no PII)
- `component_stack`: truncated stack trace
- `severity`: "error" | "fatal"

---

### Authentication

#### `login_success`
**When**: User successfully logs in  
**Props**:
- `method`: "email" | "google" | "phone"
- `timestamp`: ISO 8601

#### `login_failed`
**When**: Login attempt fails  
**Props**:
- `method`: "email" | "google" | "phone"
- `reason`: "invalid_credentials" | "network_error" | "rate_limit"

#### `signup_success`
**When**: New user signs up  
**Props**:
- `method`: "email" | "google" | "phone"
- `timestamp`: ISO 8601

#### `logout`
**When**: User logs out  
**Props**:
- `session_duration_seconds`: number

---

### Onboarding & Number Attachment

#### `onboard_number_submit`
**When**: User submits number attachment form at `/ops/numbers/onboard`  
**Props**:
- `number_type`: "mobile" | "landline" | "tollfree"
- `country_code`: "US" | "CA"
- `timestamp`: ISO 8601

#### `onboard_number_success`
**When**: Number successfully attached and webhooks configured  
**Props**:
- `number_type`: "mobile" | "landline" | "tollfree"
- `country_code`: "US" | "CA"
- `webhooks_configured`: boolean
- `timestamp`: ISO 8601

#### `onboard_number_failed`
**When**: Number attachment fails  
**Props**:
- `error_code`: "invalid_number" | "twilio_error" | "webhook_config_failed"
- `timestamp`: ISO 8601

---

### Voice Calls

#### `call_inbound`
**When**: Twilio webhook receives inbound call (`voice-answer`)  
**Props**:
- `call_sid`: Twilio CallSid
- `amd_detected`: boolean (voicemail detected?)
- `mode`: "llm" | "bridge"
- `timestamp`: ISO 8601

#### `call_connected`
**When**: Call successfully connected to stream or bridge  
**Props**:
- `call_sid`: Twilio CallSid
- `mode`: "llm" | "bridge"
- `connection_latency_ms`: number

#### `call_transcribed`
**When**: Call transcript generated and stored  
**Props**:
- `call_sid`: Twilio CallSid
- `transcript_length`: number (character count)
- `duration_seconds`: number

#### `call_completed`
**When**: Call ends  
**Props**:
- `call_sid`: Twilio CallSid
- `duration_seconds`: number
- `status`: "completed" | "failed" | "no-answer" | "busy"

---

### SMS Messages

#### `sms_inbound`
**When**: Inbound SMS received (`webcomms-sms-reply`)  
**Props**:
- `message_sid`: Twilio MessageSid
- `from_country`: "US" | "CA"
- `timestamp`: ISO 8601

#### `sms_delivered`
**When**: Outbound SMS delivered successfully (`webcomms-sms-status`)  
**Props**:
- `message_sid`: Twilio MessageSid
- `delivery_latency_ms`: number (time from send to delivered)

#### `sms_failed`
**When**: Outbound SMS fails to deliver  
**Props**:
- `message_sid`: Twilio MessageSid
- `error_code`: Twilio error code
- `reason`: "invalid_number" | "carrier_blocked" | "rate_limit"

---

### Evidence Dashboard

#### `evidence_tile_green`
**When**: Evidence tile at `/ops/twilio-evidence` shows green (healthy)  
**Props**:
- `tile_type`: "sms_inbound" | "sms_delivered" | "voice_answer" | "voice_status"
- `last_event_timestamp`: ISO 8601

#### `evidence_tile_red`
**When**: Evidence tile shows red (unhealthy)  
**Props**:
- `tile_type`: "sms_inbound" | "sms_delivered" | "voice_answer" | "voice_status"
- `minutes_since_last_event`: number

---

### Campaigns & Automation

#### `campaign_created`
**When**: SMS campaign created via `ops-campaigns-create`  
**Props**:
- `campaign_id`: UUID
- `segment_size`: number
- `timestamp`: ISO 8601

#### `campaign_sent`
**When**: Campaign messages sent via `ops-campaigns-send`  
**Props**:
- `campaign_id`: UUID
- `messages_sent`: number
- `timestamp`: ISO 8601

#### `followup_enabled`
**When**: Follow-up automation enabled via `ops-followups-enable`  
**Props**:
- `user_id`: UUID
- `timestamp`: ISO 8601

---

### Lead Generation

#### `lead_submitted`
**When**: Contact form or lead form submitted  
**Props**:
- `form_type`: "contact" | "demo" | "pricing"
- `timestamp`: ISO 8601

#### `lead_email_sent`
**When**: Lead notification email sent via `send-lead-email`  
**Props**:
- `recipient_count`: number
- `timestamp`: ISO 8601

---

### A/B Testing

#### `ab_test_assigned`
**When**: User assigned to A/B test variant  
**Props**:
- `test_name`: string
- `variant`: "A" | "B"
- `session_id`: UUID

#### `ab_test_converted`
**When**: User completes conversion action  
**Props**:
- `test_name`: string
- `variant`: "A" | "B"
- `session_id`: UUID

---

## Implementation Status

| Event | Implemented | Function | Notes |
|-------|-------------|----------|-------|
| `app_install` | ✅ | `InstallPrompt.tsx` | PWA install tracking |
| `login_success` | ✅ | `Auth.tsx` | Via `secure-analytics` |
| `onboard_number_submit` | ✅ | `NumberOnboard.tsx` | Form submission |
| `onboard_number_success` | ✅ | `ops-twilio-attach-number` | Webhooks configured |
| `call_inbound` | ✅ | `voice-answer` | Every inbound call |
| `call_transcribed` | ✅ | `voice-status` | Transcript delivery |
| `sms_inbound` | ✅ | `webcomms-sms-reply` | Every inbound SMS |
| `sms_delivered` | ✅ | `webcomms-sms-status` | Delivery confirmation |
| `evidence_tile_green` | ⚠️ | `TwilioEvidence.tsx` | **TODO: Add tracking** |
| `error_boundary_hit` | ✅ | `ErrorBoundary.tsx` | React error boundary |

## Missing Events (TODO)

- `app_open`: Add to `App.tsx` useEffect
- `evidence_tile_red`: Add to `TwilioEvidence.tsx` when tiles turn red
- `login_failed`: Add to `Auth.tsx` error handler
- `call_connected`: Add to `voice-stream` WebSocket handler
- `campaign_created`: Add to `ops-campaigns-create`

## Privacy Compliance

**CRITICAL**: No PII (phone numbers, emails, names) in event props. Use IDs only:
- ✅ `call_sid`, `message_sid`, `user_id` (UUIDs)
- ❌ `from_e164`, `to_e164`, `email`, `name`

All events are logged to `analytics_events` table with RLS policies enforcing admin-only access to aggregated data.

## Testing Events

Use the following test script to verify event tracking:

```bash
curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/secure-analytics \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test_event",
    "event_data": { "test": true },
    "severity": "info"
  }'
```

Check `analytics_events` table for the logged event.
