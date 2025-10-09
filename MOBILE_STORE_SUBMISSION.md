# Mobile Store Submission Guide — TradeLine 24/7

**Version:** 2.0.x  
**Platform:** iOS (App Store) + Android (Google Play)  
**Canonical Domain:** https://tradeline247ai.com  
**Last Updated:** 2025-01-09

---

## GUARDRAILS

- Use current `main` build from canonical domain
- Reuse existing policy kit and evidence dashboards
- Never overwrite existing tags; auto-bump patch version
- No new vendors or DNS edits
- All endpoints from [PRODUCTION_SNAPSHOT_2025-10-08.md](./PRODUCTION_SNAPSHOT_2025-10-08.md)

---

## R1 — CUT RELEASE (Reproducible, Checksummed)

### Process

1. **Tag Creation**
   ```bash
   # Check existing tags
   git tag -l "v2.0.*"
   
   # Create new tag (bump patch if exists)
   git tag -a v2.0.1 -m "Release v2.0.1 - Mobile store submission"
   git push origin v2.0.1
   ```

2. **Automatic Build**
   - GitHub Actions workflow `.github/workflows/release.yml` triggers on tag push
   - Builds application: `npm ci && npm run build`
   - Creates tarball: `release.tar.gz`
   - Generates checksum: `release.tar.gz.sha256`
   - Creates GitHub Release with both files attached

3. **Release Notes (Auto-Generated)**
   
   Release includes links to:
   - **Synthetic Smoke Tests:** Latest workflow run
   - **Twilio Evidence Dashboard:** https://tradeline247ai.com/ops/twilio-evidence
   - **Privacy Policy:** https://tradeline247ai.com/privacy
   - **Store Policy Kit:** 
     - [apple_privacy.md](./ops/policy-kit/apple_privacy.md)
     - [play_data_safety.md](./ops/policy-kit/play_data_safety.md)

### Acceptance Criteria

- ✅ One tag → one artifact + matching SHA256 checksum
- ✅ Release notes contain all required links
- ✅ Artifact is reproducible from source at tagged commit

### Evidence

**Release URL:** `https://github.com/apex-business-systems/tradeline247/releases/tag/v2.0.x`

---

## R2 — APP STORE CONNECT (iOS)

### App Information

| Field | Value |
|-------|-------|
| **App Name** | TradeLine 24/7 |
| **Subtitle** | Your 24/7 Ai Receptionist! |
| **Primary Category** | Business |
| **Age Rating** | 17+ (Business use) |
| **Marketing URL** | https://tradeline247ai.com |
| **Support URL** | https://tradeline247ai.com/support |
| **Privacy Policy URL** | https://tradeline247ai.com/privacy |

### App Privacy (from [apple_privacy.md](./ops/policy-kit/apple_privacy.md))

**Data Collected:**
- Phone Number (E.164) — App Functionality, Linked to User
- Call SID (Twilio) — App Functionality, Linked to User
- Call Transcripts — App Functionality, 90d retention
- Audit Logs — Security, 3y retention

**Data NOT Collected:**
- ❌ Device microphone recording
- ❌ Device call recording
- ❌ Device contacts

**Third-Party Processors:** Twilio, OpenAI, Supabase, Resend

### Reviewer Notes (Paste Exactly)

```
All calling, streaming, and transcription occur server-side via Twilio. 
The app does NOT record device calls.

Evidence:
- Twilio Number Config: Voice/SMS webhooks to https://api.tradeline247ai.com
- Live Health Tiles: https://tradeline247ai.com/ops/twilio-evidence
  - Voice p95 handshake: <1500ms
  - SMS delivery: ≥98%
  - No device audio capture

The app is a dashboard for cloud telephony; no on-device call recording occurs.
```

### Acceptance

- ✅ Build processed (TestFlight)
- ✅ App Privacy answers saved
- ✅ Reviewer notes present

---

## R3 — GOOGLE PLAY CONSOLE (Android)

### App Content

| Field | Value |
|-------|-------|
| **App Name** | TradeLine 24/7 |
| **Short Description** | Your 24/7 Ai Receptionist! |
| **Category** | Business |
| **Target Audience** | Not directed to children (17+) |
| **Privacy Policy URL** | https://tradeline247ai.com/privacy |
| **Support Email** | info@tradeline247ai.com |

### Data Safety (from [play_data_safety.md](./ops/policy-kit/play_data_safety.md))

**Data Collected:**
- Phone Number (E.164) — App functionality, Analytics
- Email Address — App functionality (transcripts)
- Call Transcripts — Business intelligence, 90d retention
- App Interactions — Analytics

**Security:**
- ✅ Encrypted in transit (TLS 1.3)
- ✅ Encrypted at rest (AES-256)
- ✅ User deletion on request
- ✅ SOC 2 Type II (Supabase)

**Service Providers:** Twilio (DPA), OpenAI (BAA), Supabase (SOC 2), Resend (DPA)

### Acceptance

- ✅ Data Safety form saved
- ✅ AAB uploaded from tag v2.0.x
- ✅ Pre-launch report passes

---

## R4 — ATTACH EVIDENCE (BOTH STORES)

### Required Attachments

1. **Twilio Config Screenshot**
   - Voice: `https://api.tradeline247ai.com/functions/v1/voice-answer`
   - SMS: `https://api.tradeline247ai.com/functions/v1/webcomms-sms-reply`

2. **Evidence Dashboard** — https://tradeline247ai.com/ops/twilio-evidence
   - Voice p95: <1500ms ✅
   - SMS delivery: ≥98% ✅

3. **Email Auth (Gmail "Show Original")**
   - SPF: PASS ✅
   - DKIM: PASS ✅
   - DMARC: PASS ✅

4. **Synthetic Smoke** — [Latest run](https://github.com/apex-business-systems/tradeline247/actions/workflows/synthetic-smoke.yml) ✅

5. **Policy Kit Links**
   - [Apple Privacy](./ops/policy-kit/apple_privacy.md)
   - [Play Data Safety](./ops/policy-kit/play_data_safety.md)

### Acceptance

- ✅ All 5 items attached in both stores

---

## R5 — GO/NO-GO GATE

| Check | Target | Status |
|-------|--------|--------|
| Same tag (iOS & Android) | v2.0.x | ☐ |
| SHA256 matches | Match | ☐ |
| Synthetic-smoke | Green | ☐ |
| Voice p95 handshake | <1500ms | ☐ |
| SMS delivery | ≥98% | ☐ |
| Security headers | Present, 0 CSP errors | ☐ |
| Pricing link visible | Yes | ☐ |
| /privacy live | Yes | ☐ |
| Reviewer notes (iOS) | Yes | ☐ |
| Reviewer notes (Android) | Yes | ☐ |

**Submit ONLY when all boxes checked.**

---

## POST-SUBMISSION

### Monitor Review Inbox

**Check daily:**
- App Store Connect → App Review → Messages
- Google Play Console → Inbox

**Response Time:** <2h for urgent, <4h for questions

### Common Questions

**Q: Does your app record device calls?**
```
No. All calling is server-side via Twilio cloud telephony.
Evidence: Twilio config + https://tradeline247ai.com/ops/twilio-evidence
No microphone/call permissions requested.
```

**Q: How is data protected?**
```
- TLS 1.3 in transit
- AES-256 at rest
- Supabase RLS policies
- SOC 2 Type II compliance
- Retention: 90d transcripts, 3y audit logs
```

### Post-Approval

1. Publish release notes (reuse GitHub Release)
2. Monitor: Crash rate <1%, reviews <4★
3. Update docs with store badge links

---

## ONE-LINE STATUS

```
iOS: ☐ Submitted / ☐ Approved — Android: ☐ Submitted / ☐ Approved — Tag: v2.0.x — Evidence: ☐ Twilio ☐ Tiles ☐ Gmail ☐ Smoke ☐ Policy
```

---

## EMERGENCY ROLLBACK

1. **Stop Distribution** (both stores)
2. **Notify Users** (in-app banner + email)
3. **Hotfix** (v2.0.x-hotfix tag) → Re-run R1-R5 → Expedited review

---

## CONTACT

- **Support:** info@tradeline247ai.com
- **Escalation:** +1-587-742-8885
- **Privacy:** privacy@tradeline247ai.com
- **Security:** security@tradeline247ai.com

---

## REFERENCES

- [Production Snapshot](./PRODUCTION_SNAPSHOT_2025-10-08.md)
- [Apple Privacy](./ops/policy-kit/apple_privacy.md)
- [Play Data Safety](./ops/policy-kit/play_data_safety.md)
- [Capacitor Config](./capacitor.config.ts)
- [GitHub Preflight](./GITHUB_PREFLIGHT_COMPLETE.md)
