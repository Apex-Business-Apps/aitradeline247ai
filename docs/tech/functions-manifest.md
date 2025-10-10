# Edge Functions Manifest — v2.0.0

**Generated**: 2025-10-10  
**Total Functions**: 68  
**Deployment**: Supabase Edge Functions (Deno runtime)

## Overview

All functions are deployed at `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/{function_name}`.

## Functions by Category

### Voice & Call Handling (9)
| Function | Auth | Rate Limit | Description |
|----------|------|------------|-------------|
| `voice-answer` | webhook | none | Primary call answer handler with consent |
| `voice-status` | webhook | none | Call status + recording callbacks |
| `voice-stream` | webhook | none | WebSocket voice streaming (realtime AI) |
| `voice-action` | webhook | none | DTMF action handler (press 0 for human) |
| `voice-consent` | webhook | none | Recording consent handler (legacy) |
| `ops-voice-config-update` | admin | none | Update voice config |
| `ops-voice-health` | admin | none | Voice health metrics |
| `ops-voice-slo` | admin | none | Voice SLO tracking |
| `twilio-voice` | webhook | none | Deprecated voice handler |

### SMS & Messaging (8)
| Function | Auth | Rate Limit | Description |
|----------|------|------------|-------------|
| `webcomms-sms-reply` | webhook | none | Primary SMS inbound |
| `webcomms-sms-status` | webhook | none | Primary SMS status |
| `sms-inbound` | webhook | none | SMS inbound (alternate) |
| `sms-inbound-fallback` | webhook | none | SMS fallback handler |
| `sms-status` | webhook | none | SMS status (alternate) |
| `sms-reply` | authenticated | none | Send SMS reply |
| `twilio-sms` | service | none | Send SMS via Twilio |
| `twilio-sms-status` | webhook | none | Twilio SMS status |

### Operator & Admin Tools (19)
| Function | Auth | Rate Limit | Description |
|----------|------|------------|-------------|
| `ops-activate-account` | admin | none | Activate account |
| `ops-twilio-attach-number` | admin | none | Attach Twilio number |
| `ops-twilio-buy-number` | admin | none | Buy Twilio number |
| `ops-twilio-configure-webhooks` | admin | none | Configure webhooks |
| `ops-twilio-list-numbers` | admin | none | List available numbers |
| `ops-twilio-test-webhook` | admin | none | Test webhook connectivity |
| `ops-twilio-a2p` | admin | none | A2P brand registration |
| `ops-twilio-create-port` | admin | none | Create port request |
| `ops-twilio-hosted-sms` | admin | none | Hosted SMS setup |
| `ops-campaigns-create` | admin | none | Create SMS campaign |
| `ops-campaigns-send` | admin | none | Send campaign |
| `ops-followups-enable` | admin | none | Enable follow-ups |
| `ops-followups-send` | admin | none | Send follow-ups |
| `ops-leads-import` | admin | none | Bulk lead import |
| `ops-segment-warm50` | admin | none | Segment warm contacts |
| `ops-send-warm50` | admin | none | Send to warm50 |
| `ops-report-export` | admin | none | Export reports |
| `ops-verify-gate1` | admin | none | Verify Gate 1 |
| `lookup-number` | admin | none | Phone lookup |

### Knowledge Base & RAG (6)
| Function | Auth | Rate Limit | Description |
|----------|------|------------|-------------|
| `kb-ingest` | admin | none | Document ingestion |
| `kb-search` | authenticated | none | KB search |
| `rag-ingest` | admin | none | RAG ingestion |
| `rag-search` | authenticated | none | RAG search |
| `rag-answer` | authenticated | none | RAG answer generation |
| `ragz` | authenticated | none | Experimental RAG |

### Analytics & Tracking (6)
| Function | Auth | Rate Limit | Description |
|----------|------|------------|-------------|
| `secure-analytics` | public | none | Privacy-safe analytics |
| `track-session-activity` | authenticated | none | Session activity |
| `ab-convert` | public | none | A/B conversion |
| `register-ab-session` | public | none | A/B session registration |
| `secure-ab-assign` | public | none | A/B assignment |
| `dashboard-summary` | authenticated | none | Dashboard data |

### Lead Generation & Forms (4)
| Function | Auth | Rate Limit | Description |
|----------|------|------------|-------------|
| `contact-submit` | public | 5/hour | Contact form |
| `secure-lead-submission` | public | 5/hour | Lead submission |
| `send-lead-email` | service | none | Lead notification |
| `automation-buyer-path` | service | idempotent | Buyer path emails |

### Security & Auth (6)
| Function | Auth | Rate Limit | Description |
|----------|------|------------|-------------|
| `validate-session` | authenticated | none | Session validation |
| `check-password-breach` | public | 10/min | Password breach check |
| `threat-detection-scan` | service | none | Threat scanning |
| `secure-rate-limit` | service | none | Rate limit enforcement |
| `secret-encrypt` | admin | none | Encrypt secrets |
| `init-encryption-key` | admin | once | Init encryption key |
| `ops-init-encryption-key` | admin | once | Ops encryption key |

### Integrations & External (3)
| Function | Auth | Rate Limit | Description |
|----------|------|------------|-------------|
| `calendly-sync` | service | none | Calendly webhook |
| `send-transcript` | service | none | Email transcript |
| `unsubscribe` | public | none | Email/SMS unsubscribe |

### Misc (7)
| Function | Auth | Rate Limit | Description |
|----------|------|------------|-------------|
| `chat` | authenticated | none | AI chat |
| `start-trial` | authenticated | once | Start trial |
| `twilio-status` | webhook | none | Twilio status |

## Auth Types

- **public**: No authentication required
- **webhook**: Twilio signature validation
- **authenticated**: Requires Supabase JWT
- **admin**: Requires admin role
- **service**: Requires service_role key

## Rate Limits

- **none**: No rate limit
- **idempotent**: Enforced by unique constraints
- **once**: Can only be called once per resource
- **X/hour** or **X/min**: Per-IP rate limits

## Monitoring

All functions log to Supabase Edge Function logs. Critical webhooks (voice-answer, webcomms-*) have evidence dashboards at `/ops/twilio-evidence`.

## Security Notes

- All webhook endpoints validate Twilio signatures
- Admin endpoints require `has_role(auth.uid(), 'admin'::app_role)`
- Service endpoints require `service_role` key
- Public endpoints are rate-limited by IP

## Deprecation Notices

- `twilio-voice`: Use `voice-answer` instead
- `voice-consent`: Consent now integrated into `voice-answer`
