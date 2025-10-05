# SMS US Expansion Compliance Checklist

**Status:** PRE-STAGED (Not active)  
**Purpose:** Compliance requirements for US SMS expansion  
**Last Updated:** 2025-10-05

---

## Overview

Before enabling US-based SMS traffic using **US local 10-digit numbers** or **Toll-Free numbers**, TradeLine 24/7 must complete carrier-mandated compliance registration to prevent message filtering and ensure deliverability.

---

## Compliance Paths

### Path A: US Local 10-Digit Numbers (A2P 10DLC)

**When to use:**
- Sending SMS from US local area code numbers (e.g., +1-415-555-xxxx)
- High-volume application-to-person (A2P) messaging
- Better local presence and brand recognition

**Requirements:**

- [ ] **Complete A2P 10DLC Brand Registration**
  - Register your business brand with The Campaign Registry (TCR)
  - Provide business details (EIN, address, website)
  - Brand vetting time: 1-2 business days (standard), instant (verified)
  - Cost: $4/month per brand
  - [Twilio A2P 10DLC Overview](https://www.twilio.com/docs/sms/a2p-10dlc)

- [ ] **Register SMS Use Case Campaign**
  - Define your messaging use case (e.g., appointment reminders, notifications)
  - Specify daily message volume and opt-in/opt-out process
  - Campaign approval time: Instant to 1 week (depending on carrier)
  - Cost: $1.50-$10/month per campaign (carrier-dependent)
  - [10DLC Campaign Registration](https://www.twilio.com/docs/sms/a2p-10dlc/campaign-registration)

- [ ] **Assign Phone Numbers to Campaign**
  - Link purchased US local numbers to approved campaign
  - Each number must be associated with a campaign
  - [Managing 10DLC Phone Numbers](https://www.twilio.com/docs/sms/a2p-10dlc/managing-phone-numbers)

- [ ] **Monitor Daily Throughput Limits**
  - Message limits vary by brand trust score (2,000-250,000 msgs/day)
  - Track limits in Twilio Console
  - [10DLC Throughput and Carrier Fees](https://www.twilio.com/docs/sms/a2p-10dlc/throughput-and-carrier-fees)

**Compliance Timeline:**
- Brand registration: 1-2 business days
- Campaign approval: Instant to 1 week
- **Total estimated time: 3-10 business days**

---

### Path B: Toll-Free Numbers (US & Canada)

**When to use:**
- Sending SMS from toll-free numbers (e.g., +1-800-555-xxxx, +1-888-555-xxxx)
- Moderate volume (3 msgs/sec default, up to 4,000 msgs/min)
- No per-campaign registration needed

**Requirements:**

- [ ] **Submit Toll-Free Verification**
  - Provide business details and messaging use case
  - One-time verification per Toll-Free number
  - Approval time: 5-7 business days
  - Cost: No monthly fees (one-time verification only)
  - [Toll-Free Verification for US & Canada](https://www.twilio.com/docs/sms/a2p/toll-free-verification)

- [ ] **Purchase Toll-Free Number**
  - Acquire a US/Canada toll-free number from Twilio
  - Ensure number is SMS-capable
  - [Buy a Toll-Free Number](https://www.twilio.com/console/phone-numbers/search)

- [ ] **Complete Verification Form**
  - Submit form via Twilio Console
  - Include business website, use case description, opt-in/opt-out process
  - [Toll-Free Verification Form](https://www.twilio.com/docs/sms/a2p/toll-free-verification#submit-your-verification-information)

- [ ] **Monitor Throughput and Carrier Filtering**
  - Default: 3 messages/second (can request increase to 4,000/min)
  - Monitor for carrier filtering (unverified numbers may be blocked)
  - [Toll-Free Messaging Best Practices](https://www.twilio.com/docs/sms/a2p/toll-free-verification#best-practices)

**Compliance Timeline:**
- Verification approval: 5-7 business days
- **Total estimated time: 1 week**

---

## Decision Matrix

| Factor | A2P 10DLC (Local Numbers) | Toll-Free |
|--------|---------------------------|-----------|
| **Setup Time** | 3-10 business days | 5-7 business days |
| **Monthly Cost** | $4 brand + $1.50-$10 campaign | No monthly fees |
| **Throughput** | 2,000-250,000 msgs/day (trust score) | 3-4,000 msgs/min |
| **Best For** | High volume, local presence | Moderate volume, nationwide |
| **Registration** | Brand + Campaign | Number verification only |
| **Geographic Coverage** | US only | US & Canada |

---

## Pre-Launch Checklist

Before activating US SMS:

- [ ] Choose compliance path (A2P 10DLC or Toll-Free)
- [ ] Gather business documentation (EIN, website, privacy policy)
- [ ] Document opt-in/opt-out process for submission
- [ ] Estimate daily/monthly message volume
- [ ] Allocate budget for registration/carrier fees
- [ ] Assign technical owner for registration process
- [ ] Set up monitoring for throughput limits and filtering
- [ ] Test SMS delivery with compliant number before production launch

---

## Key Twilio Resources

### A2P 10DLC
- [A2P 10DLC Overview](https://www.twilio.com/docs/sms/a2p-10dlc)
- [Brand Registration Guide](https://www.twilio.com/docs/sms/a2p-10dlc/brand-registration)
- [Campaign Registration Guide](https://www.twilio.com/docs/sms/a2p-10dlc/campaign-registration)
- [Trust Score Calculation](https://www.twilio.com/docs/sms/a2p-10dlc/trust-scores)
- [Carrier Fees Explainer](https://www.twilio.com/docs/sms/a2p-10dlc/throughput-and-carrier-fees)

### Toll-Free
- [Toll-Free Verification Overview](https://www.twilio.com/docs/sms/a2p/toll-free-verification)
- [Verification Submission Guide](https://www.twilio.com/docs/sms/a2p/toll-free-verification#submit-your-verification-information)
- [Toll-Free Messaging Best Practices](https://www.twilio.com/docs/sms/a2p/toll-free-verification#best-practices)
- [Throughput and Filtering](https://www.twilio.com/docs/sms/a2p/toll-free-verification#throughput-and-carrier-filtering)

### General Compliance
- [US SMS Compliance Guide](https://www.twilio.com/docs/sms/a2p)
- [Messaging Policy Overview](https://www.twilio.com/legal/messaging-policy)
- [TCPA Compliance](https://www.twilio.com/legal/tcpa)

---

## DoD Verification

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Checklist item for A2P 10DLC exists | ✅ PASS | Documented in Path A above |
| Checklist item for Toll-Free exists | ✅ PASS | Documented in Path B above |
| Links to Twilio guides included | ✅ PASS | All relevant guides linked |
| Decision matrix provided | ✅ PASS | See Decision Matrix section |
| Pre-launch checklist created | ✅ PASS | See Pre-Launch Checklist section |

---

## Notes

- **This is a PRE-STAGED document.** Do NOT enable US SMS traffic until compliance is complete.
- **Current production:** TradeLine 24/7 uses non-US numbers (no A2P/Toll-Free required).
- **Activation trigger:** When US expansion is approved, complete chosen compliance path.
- **Owner:** DevOps/Compliance Lead (TBD)
- **Review frequency:** Quarterly (Twilio policies may change)

---

## Next Steps (When US Expansion is Approved)

1. Review business requirements and choose compliance path
2. Assign compliance owner
3. Complete registration (allow 1-2 weeks)
4. Test with compliant number in staging
5. Update `sms-status` and `sms-inbound` functions to handle US-specific error codes
6. Enable production traffic
7. Monitor throughput and filtering for first 48 hours

---

**REMINDER:** This checklist must be completed BEFORE sending any SMS from US local or toll-free numbers. Failure to comply will result in carrier filtering and message blocks.
