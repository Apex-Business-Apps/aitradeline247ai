# TradeLine 24/7 Canon

## v2.0.0 Canon

**Date**: 2025-10-10  
**Release**: v2.0.0  
**Status**: PRODUCTION READY (web), Android ready

### Guardrails

- **No new numbers/ports**: Only attach existing Twilio numbers via `/onboarding/number`
- **Protected areas**: Do NOT touch headers, backgrounds, or routes
- **Onboarding**: Use `/onboarding/number` only for number attachment

### Infrastructure

- **DNS**: IONOS
- **ESP**: Resend
- **DMARC**: Target policy `p=quarantine`

### Operations Philosophy

**Evidence-first ops**: All changes must pass smoke tests and show green tiles on `/ops/twilio-evidence` before deployment.

### Key URLs

- Onboarding: `/onboarding/number`
- Evidence Dashboard: `/ops/twilio-evidence`
- Production Domain: `https://tradeline247ai.com`
