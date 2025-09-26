# Missteps Audit — Findings & One-line Fixes

| Area | Status | What's Wrong | One-line Fix Prompt |
|------|--------|--------------|---------------------|
| **GA4** | ✅ | Currently properly configured with G-5KPE9X0NDM | "Maintain single GA4 instance — check for duplicate page_view events if issues arise." |
| **Klaviyo** | ✅ | Consent-gated implementation working | "Ensure Klaviyo identify() only fires after explicit consent checkbox — verify in /src/lib/klaviyo.ts." |
| **PWA** | ✅ | Manifest + minimal SW implemented | "Test PWA install flow — verify beforeinstallprompt capture and iOS helper working." |
| **Twilio** | ✅ | Signature validation implemented | "Twilio webhooks secured with HMAC-SHA1 — test with /scripts/twilio_negative_test.sh to confirm 403 response." |
| **SEO** | ✅ | Canonical URLs properly configured | "SEO canon maintained — canonical points to https://www.tradeline247ai.com{path}." |
| **Hero Layout** | ✅ | Canon structure protected with guards | "Hero/ROI duo layout locked — verify no red overlay appears, check src/styles/hero-roi.css integrity." |
| **Security Headers** | ✅ | CSP and security headers implemented | "Security headers active via SecurityMonitor component — verify CSP in browser dev tools." |
| **Canada Compliance** | ✅ | CASL/PIPEDA notices present | "CASL consent explicit in forms — verify checkbox text and PIPEDA notices in privacy policy." |
| **Performance** | ✅ | CLS target maintained | "Core Web Vitals optimized — hero logo has fetchpriority='high', images lazy loaded." |
| **Database Security** | ✅ | RLS policies and function hardening complete | "Database secured with RLS policies — A/B tests admin-only, functions use SET search_path = public." |

## 🟨 Potential Future Issues to Watch

| Component | Risk | Prevention Prompt |
|-----------|------|-------------------|
| **Hero Drift** | High | "If hero layout breaks: apply Hero Duo Canon from src/styles/hero-roi.css — enforce equal columns/heights grid." |
| **Color Drift** | Medium | "If direct colors appear: replace with semantic tokens from index.css — use design system variables only." |
| **Analytics Duplication** | Medium | "If multiple GA4 tags: remove duplicates, keep single G-5KPE9X0NDM instance — dedupe page_view events." |
| **Consent Bypass** | High | "If Klaviyo fires without consent: gate all identify/track calls behind explicit checkbox consent." |
| **Webhook Insecurity** | Critical | "If Twilio signature fails: restore X-Twilio-Signature validation in voice-answer/voice-status functions." |
| **SEO Canonical Drift** | Medium | "If canonical URLs wrong: ensure all point to https://www.tradeline247ai.com + path — update SEOHead component." |
| **PWA Install Broken** | Low | "If install prompt missing: verify beforeinstallprompt capture + manifest link in HTML head." |
| **Performance Regression** | Medium | "If CLS increases: check hero logo dimensions + fetchpriority — ensure no layout shift on load." |

## 🔍 Quick Validation Commands

```bash
# Test Twilio security
./scripts/twilio_negative_test.sh

# Run acceptance sweep 
./scripts/acceptance_sweep.sh

# Check PWA manifest
curl -s https://www.tradeline247ai.com/manifest.webmanifest | jq

# Verify canonical URLs
curl -s https://www.tradeline247ai.com/ | grep canonical

# Test sitemap
curl -s https://www.tradeline247ai.com/sitemap.xml | head -20
```

## ✅ Current Security Posture: A-

All critical security fixes implemented:
- Twilio webhook signature validation: ✅
- Database RLS policies hardened: ✅  
- Security headers implemented: ✅
- Canadian compliance maintained: ✅
- PWA installation flow secure: ✅

**Only remaining manual action:** Enable password protection in Supabase Auth dashboard.