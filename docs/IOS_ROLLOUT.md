# TradeLine 24/7 — iOS App Store Rollout

**Date:** 2025-01-15 (America/Edmonton)  
**Bundle ID:** com.apex.tradeline247  
**Team ID:** NWGUYF42KW  
**Target:** iOS 15.0+

---

## 0) Global Rules

- **Touch only files/steps listed here**
- **No UI/UX or copy edits unless specified**
- **All changes must be idempotent and refactoring-only**
- **Use America/Edmonton for timestamps in logs**
- **If a resource already exists, verify and skip**

---

## 1) Repo Preflight

### Create Release Branch
```bash
git checkout -b release/ios-v1
git push -u origin release/ios-v1
```

### Install & Build
```bash
npm ci
npm run build
```
**Must produce:** `dist/` directory with compiled assets

### Secrets Check
Run automated preflight:
```bash
chmod +x scripts/ios-preflight.sh
./scripts/ios-preflight.sh
```

**Acceptance Criteria:**
- ✅ Build passes
- ✅ Branch `release/ios-v1` exists
- ✅ No secrets found in client code
- ✅ `dist/index.html` exists

---

## 2) Capacitor Wrapper (Vite → iOS)

### Install Dependencies
```bash
npm i -D @capacitor/cli @capacitor/assets
npm i @capacitor/core @capacitor/ios
```

### Initialize Capacitor
```bash
npx cap init "TradeLine 24/7" com.apex.tradeline247 --web-dir=dist
```
**Safe to re-run:** Will skip if already initialized

### Add iOS Platform
```bash
npx cap add ios
```

### Sync Web Assets
```bash
npm run build
npx cap copy ios
npx cap sync ios
```

**Acceptance Criteria:**
- ✅ `ios/App.xcworkspace` exists
- ✅ `capacitor.config.ts` points to `dist`
- ✅ No hot-reload server URL active in config

---

## 3) Icons & Splash (No Transparency)

### Verify Assets Exist
- ✅ Icon: `public/assets/brand/appstore-1024.png` (1024×1024 PNG, solid background)
- ✅ Splash: `public/assets/brand/splash-2732.png` (2732×2732 PNG, solid background)

### Generate Asset Catalogs
```bash
npx @capacitor/assets generate --ios \
  --icon ./public/assets/brand/appstore-1024.png \
  --splash ./public/assets/brand/splash-2732.png
```

### Verify No Alpha Channel
```bash
# Marketing icon MUST have no transparency
file public/assets/brand/appstore-1024.png
# Should show: PNG image data, 1024 x 1024, 8-bit/color RGB
```

**Acceptance Criteria:**
- ✅ Xcode Assets updated in `ios/App/App/Assets.xcassets/`
- ✅ Icon passes "no alpha" check (Apple rejects icons with transparency)
- ✅ Splash renders correctly in simulator

---

## 4) Xcode Project Hygiene

### Open Xcode
```bash
npx cap open ios
```

### Configure Signing & Capabilities
1. Select **Targets → App**
2. **Signing & Capabilities:**
   - Team: `NWGUYF42KW`
   - Bundle Identifier: `com.apex.tradeline247`
   - Signing: Automatic
3. **General:**
   - iOS Deployment Target: `15.0`
   - Display Name: `TradeLine 24/7`

### Update Info.plist
Add/verify these keys in `ios/App/App/Info.plist`:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<true/>
<key>NSCameraUsageDescription</key>
<string>Camera access for future scanning features</string>
```

**Note:** Camera is optional placeholder. Remove if not using.

### Do NOT Add Yet
- ❌ Push Notifications capability
- ❌ Background Modes
- ❌ HealthKit / Wallet (not applicable)

**Acceptance Criteria:**
- ✅ Project builds locally without errors
- ✅ Signing configured for NWGUYF42KW
- ✅ App runs in iOS Simulator

---

## 5) Archive & Upload

### Archive Build
1. In Xcode, select: **Any iOS Device (arm64)**
2. Menu: **Product → Archive**
3. Wait for build to complete (~5 minutes)

### Distribute to App Store
1. Organizer opens automatically
2. Click **Distribute App**
3. Select **App Store Connect**
4. Choose **Upload** (not Export)
5. Use **Automatic Signing**
6. Click **Upload**

### Monitor Processing
- App Store Connect → TestFlight → Builds
- Wait for status: **Ready to Test** (~15 minutes)

**Acceptance Criteria:**
- ✅ Build shows under TestFlight as "Ready to Test"
- ✅ No missing compliance warnings
- ✅ Build number matches Xcode version

---

## 6) App Store Connect — App Record

### Create New App
Go to: [App Store Connect](https://appstoreconnect.apple.com)

1. **My Apps → + (New App)**
2. **Platforms:** iOS
3. **Name:** TradeLine 24/7
4. **Primary Language:** English (Canada)
5. **Bundle ID:** com.apex.tradeline247
6. **SKU:** TL247-001
7. **User Access:** Limited (default)

### Pricing & Availability
- **Price:** Base tier (free with in-app trial)
- **Availability:** Canada (initially), expand later
- **Pre-orders:** No

**Acceptance Criteria:**
- ✅ App record created
- ✅ Linked to uploaded build
- ✅ Status: "Prepare for Submission"

---

## 7) Metadata (Paste Exactly)

### App Information
- **Subtitle:** Your 24/7 AI Receptionist
- **Promotional Text:**  
  Answer every missed call. 10-minute setup, 14-day free trial, hosted in Canada.

### Description
```
Never miss a call—after hours or overflow. TradeLine 24/7's natural-voice AI receptionist answers customer calls, books jobs, and emails you a clean transcript.

KEY FEATURES:
• 24/7 call answering—works when you're closed or busy
• Natural AI voice books appointments and takes messages
• Instant email transcripts after every call
• Hosted in Canada (PIPEDA/PIPA aligned)
• 10-minute setup, no hardware required
• 14-day free trial, cancel anytime

PERFECT FOR:
Trades, home services, medical offices, real estate, any business that can't afford to miss calls.

PRIVACY & SECURITY:
All data stored in Canada. No recordings kept beyond compliance period. Cancel anytime.
```

### Keywords
```
receptionist, after-hours, booking, call answering, transcript, Canada, AI, voicemail, missed calls, trades, service
```
(Max 100 characters)

### URLs
- **Support URL:** `https://tradeline247ai.com/support`
- **Marketing URL:** `https://tradeline247ai.com`
- **Privacy Policy URL:** `https://tradeline247ai.com/privacy`

### Category
- **Primary:** Business
- **Secondary:** Productivity

### Age Rating
- **4+** (no restricted content)

**Acceptance Criteria:**
- ✅ Metadata saved in App Store Connect
- ✅ No placeholder text remaining
- ✅ 1024×1024 App Icon attached (automatically from build)

---

## 8) App Privacy (Nutrition Labels)

### Data Collection Settings

#### Tracking
- **Uses Tracking:** No

#### Data Collected (Linked to User)
1. **Contact Info**
   - Name, Email, Phone Number
   - **Purpose:** App Functionality, Customer Support
   - **Linked to User:** Yes
   - **Used for Tracking:** No

2. **Identifiers**
   - User ID, Device ID
   - **Purpose:** App Functionality, Security & Fraud Prevention
   - **Linked to User:** Yes
   - **Used for Tracking:** No

3. **Usage Data**
   - Product Interaction (call logs, timestamps)
   - **Purpose:** App Functionality, Analytics
   - **Linked to User:** Yes
   - **Used for Tracking:** No

4. **Diagnostics**
   - Crash Data, Performance Data
   - **Purpose:** App Functionality, Developer Use
   - **Linked to User:** No
   - **Used for Tracking:** No

#### Data NOT Collected
- ❌ Precise Location
- ❌ Health & Fitness
- ❌ Financial Info
- ❌ Sensitive Info (racial, political, etc.)
- ❌ Browsing History
- ❌ Search History

### Data Retention & Deletion
- **Retention Policy:** Business-necessary period (90 days for transcripts, 3 years for audit logs per compliance)
- **Deletion:** User can request account deletion via Support

**Acceptance Criteria:**
- ✅ Privacy questionnaire complete
- ✅ Matches `ops/policy-kit/apple_privacy.md` exactly
- ✅ No "may be used for tracking" flags (unless justified)

---

## 9) Export Compliance

### Encryption Questions
1. **Does your app use encryption?**  
   → **Yes** (HTTPS, standard networking)

2. **Does it use encryption other than in Apple OS?**  
   → **No** (only standard HTTPS/TLS)

3. **Is your app designed for government use?**  
   → **No**

4. **Does it contain proprietary or non-standard cryptography?**  
   → **No**

### Result
- **Export Compliance:** Approved automatically (no documentation required)

**Acceptance Criteria:**
- ✅ Export compliance passes without additional docs
- ✅ No CCATS (Commodity Classification) required

---

## 10) Screenshots (Required Sizes)

### iPhone Screenshot Requirements
Upload **3–5 screenshots** in **6.9" display** format (2868×1320 or 1320×2868 portrait):

**Recommended Screens:**
1. **Hero:** "Never miss a call" tagline over dashboard
2. **Transcript Sample:** Redacted email transcript view
3. **Setup Checklist:** "10-minute setup" onboarding flow
4. **Trust Badge:** "Hosted in Canada" compliance shield
5. **Pricing Overview:** High-level plan comparison

### Generate Screenshots
Use iOS Simulator (iPhone 15 Pro Max):
```bash
# Run app in simulator
npx cap run ios

# Take screenshots: Cmd+S in Simulator
# Screenshots saved to ~/Desktop
```

### Upload
1. App Store Connect → Screenshots → iPhone 6.9"
2. Drag & drop PNG/JPG files
3. Add **App Preview Video** (optional, max 30 seconds)

**Acceptance Criteria:**
- ✅ Minimum 3 screenshots uploaded
- ✅ Correct dimensions (6.9" or 6.7" fallback)
- ✅ No personal data visible (use redacted/demo data)

---

## 11) TestFlight — Internal Testing

### Add Internal Testers
1. App Store Connect → TestFlight → Internal Testing
2. Create **Internal Group** (e.g., "TL247 Core Team")
3. Add App Store Connect users as testers (up to 100)

### Enable Testing
1. Select the processed build
2. Attach to Internal Group
3. Notify testers (automatic email)

### Install & Smoke Test
1. Install TestFlight app on iPhone
2. Accept invite → Install build
3. Run **5-minute cold-start smoke test:**
   - Launch app
   - Navigate to dashboard
   - Trigger sample transcript view
   - Check offline behavior (airplane mode)

**Acceptance Criteria:**
- ✅ Build installs via TestFlight on at least one device
- ✅ App launches without crashes
- ✅ Core navigation works (hero → dashboard → settings)

---

## 12) Reviewer Notes & Demo Credentials

### Add to "App Review Information"
```
HOSTING & COMPLIANCE:
TradeLine 24/7 is hosted in Canada (Edmonton, AB). All telephony uses standard HTTPS/TLS encryption via Twilio. No custom cryptography or non-exempt encryption is used.

DEMO CREDENTIALS (Non-Production):
Email: review@tradeline247ai.com
Password: Review#2025

DEMO PATH:
1. Open app
2. View hero section with "Never miss a call" tagline
3. Navigate to Dashboard (sample transcript visible)
4. Settings → Privacy Policy (verify compliance links)

NOTES:
- Real production requires Twilio phone number provisioning (not in demo)
- Transcript data is redacted in demo mode
- Canadian data residency enforced via Supabase RLS policies
```

### Attach Contact Info
- **First Name:** TradeLine
- **Last Name:** Support
- **Phone:** +1-587-742-8885
- **Email:** info@tradeline247ai.com

**Acceptance Criteria:**
- ✅ Reviewer notes saved
- ✅ Demo credentials confirmed working internally
- ✅ Contact info matches support channels

---

## 13) Submit for Review

### Final Checklist
Before clicking **Submit for Review**, verify:
- ✅ Build selected and attached
- ✅ Metadata complete (no placeholders)
- ✅ Screenshots uploaded (3+ required)
- ✅ App Icon present (1024×1024, no alpha)
- ✅ Privacy labels complete
- ✅ Export compliance approved
- ✅ Reviewer notes added
- ✅ Demo credentials tested

### Submit
1. App Store Connect → Version → **Submit for Review**
2. Confirm all questions answered
3. Status changes to **Waiting for Review**

### Timeline Expectations
- **In Review:** 24–48 hours (average)
- **Approved:** Immediate release (or scheduled)
- **Rejected:** Response required within 5 days

**Acceptance Criteria:**
- ✅ App status: "Waiting for Review"
- ✅ Confirmation email received
- ✅ TestFlight build remains available for internal testing

---

## 14) Safeguards & Rollback

### Safe Resync After Code Changes
```bash
# Automated script
chmod +x scripts/ios-resync.sh
./scripts/ios-resync.sh

# Manual steps
npm run build
npx cap copy ios
npx cap sync ios
npx cap open ios
```

### Full Rollback of Capacitor Wrapper
```bash
# 1. Delete iOS wrapper (web app remains intact)
rm -rf ios/

# 2. Revert Capacitor config
git checkout capacitor.config.ts

# 3. Revert to web-only
git checkout release/ios-v1 -- public/ src/

# 4. Rebuild web
npm run build
```

### Emergency Store Removal
If critical bug found post-submission:
1. App Store Connect → Remove from Sale
2. Notify users via in-app banner (if already live)
3. Submit hotfix as new build
4. Expedite review request (Apple Developer Support)

### Never Embed Secrets Client-Side
- ❌ Do NOT hardcode API keys in TypeScript/JavaScript
- ✅ Use environment variables via Supabase Edge Functions
- ✅ Rely on server-side validation (`SUPABASE_SERVICE_ROLE_KEY` stays on server)

**Acceptance Criteria:**
- ✅ Resync script tested locally
- ✅ Rollback procedure documented
- ✅ Emergency contacts saved (Apple Developer Support: 1-800-633-2152)

---

## Summary Checklist

| Step | Status | Notes |
|------|--------|-------|
| 1. Repo preflight | ⬜ | Branch + build + secrets check |
| 2. Capacitor wrapper | ⬜ | iOS shell added |
| 3. Icons & splash | ⬜ | No alpha channel |
| 4. Xcode hygiene | ⬜ | Signing + Info.plist |
| 5. Archive & upload | ⬜ | TestFlight processing |
| 6. App record | ⬜ | App Store Connect |
| 7. Metadata | ⬜ | Description + keywords |
| 8. Privacy labels | ⬜ | Data collection disclosure |
| 9. Export compliance | ⬜ | HTTPS only |
| 10. Screenshots | ⬜ | 3–5 images @ 6.9" |
| 11. TestFlight | ⬜ | Internal smoke test |
| 12. Reviewer notes | ⬜ | Demo creds + hosting info |
| 13. Submit | ⬜ | Waiting for Review |
| 14. Safeguards | ⬜ | Resync + rollback tested |

---

## Next Steps After Approval

1. **Monitor App Store Connect Inbox** for reviewer questions
2. **Respond within 24 hours** if clarification requested
3. **Schedule Release** (manual or automatic on approval)
4. **Post-Launch:**
   - Monitor crash reports (Xcode Organizer)
   - Review user feedback (App Store ratings)
   - Iterate based on TestFlight feedback

---

## Support & References

- **App Store Connect:** https://appstoreconnect.apple.com
- **Apple Developer Support:** 1-800-633-2152
- **TradeLine 24/7 Support:** info@tradeline247ai.com
- **Internal Docs:** `ops/policy-kit/apple_privacy.md`, `MOBILE_STORE_SUBMISSION.md`

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-15  
**Owner:** Apex Business Systems  
**Next Review:** Post-launch +7 days

