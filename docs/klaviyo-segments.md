# Klaviyo — Segments & Flows (TradeLine 24/7)

## Required profile properties
- `$consent: ["email"]` (already gated on Start Trial checkbox)
- `$source: "Start Trial"`
- `lead_source: "website"`

## Segments (Klaviyo UI → Lists & Segments → Create Segment)
1) **Trial Leads (consented):**
   - If someone is or was in segment where
   - Properties about someone: `$consent` contains "email"
   - AND `$source` equals "Start Trial"

2) **Pricing Browsers (no submit):**
   - Someone has done: Viewed Page where `url` contains `/pricing`
   - AND has NOT done: `submit_lead` in the last 30 days

3) **Installers:**
   - Has done: `install` at least once over all time

4) **High Intent (trial click but no submit):**
   - Has done: `start_trial_click` in last 30 days
   - AND has NOT done: `submit_lead` in last 30 days

## Flows
- **Trial Nurture (3 emails, 5 days)** to "High Intent" segment.
- **Welcome (1 email)** to "Installers" with A2HS tips (Android/iOS).
- **Pricing Follow-up** to "Pricing Browsers (no submit)".

## Compliance
- Send to segments with `$consent` only. Always include unsubscribe & purpose notice.

Acceptance: Document appears at /docs/klaviyo-segments.md.