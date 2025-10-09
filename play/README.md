# Play Store Assets

This directory contains the required assets for Google Play Store submission.

## Required Assets

### Feature Graphic
- **File:** `feature-graphic-1024x500.png`
- **Dimensions:** 1024×500 pixels
- **Format:** PNG
- **Usage:** Main banner on Play Store listing

### App Icon
- **File:** `app-icon-512.png`
- **Dimensions:** 512×512 pixels
- **Format:** PNG, square
- **Usage:** High-resolution icon for Play Console

### Phone Screenshots (Minimum 2, Recommended 6-8)

1. `phone-01-home.png` - Landing page/hero
2. `phone-02-dashboard.png` - Main dashboard view
3. `phone-03-onboarding.png` - Number onboarding flow
4. `phone-04-voice.png` - Voice call features
5. `phone-05-sms.png` - SMS messaging interface
6. `phone-06-evidence.png` - Analytics/evidence view

**Screenshot Specifications:**
- **Dimensions:** 1080×1920 or 1440×2560 (portrait)
- **Format:** PNG or JPG
- **Quantity:** Minimum 2, maximum 8
- **Content:** Must show actual app functionality (no mockups)

## How to Capture Screenshots

### Method 1: Lovable Preview (Recommended)
1. Open project preview in Lovable
2. Click the phone icon above preview window
3. Navigate to the page you want to capture
4. Use browser screenshot tools or:
   - **Mac:** Cmd+Shift+4 (select area)
   - **Windows:** Windows+Shift+S
   - **Chrome DevTools:** Cmd/Ctrl+Shift+P → "Capture screenshot"

### Method 2: Android Device
1. Build APK: `npx cap sync android && cd android && ./gradlew assembleDebug`
2. Install on device
3. Take screenshots:
   - **Most Android devices:** Volume Down + Power button
4. Screenshots saved to `Pictures/Screenshots/`

### Method 3: Android Emulator
1. Start emulator: `npx cap run android`
2. Use emulator controls → Camera icon
3. Screenshots saved to emulator's Pictures folder

## Image Requirements

### Feature Graphic Guidelines
- Show app branding and key value proposition
- Include app name "TradeLine 24/7"
- Highlight "24/7 AI Receptionist" tagline
- Use brand colors (#FFB347, #8B5CF6)
- Professional, high-quality design

### Screenshot Guidelines
- Show real app functionality (not promotional text)
- Clear, readable UI elements
- Representative of actual user experience
- Consistent with app branding
- No profanity or inappropriate content

## Upload to Play Console

1. Go to [Play Console](https://play.google.com/console)
2. Navigate to: **App content → Store listing → Graphics**
3. Upload assets:
   - Feature graphic (required)
   - Phone screenshots (2-8 required)
   - App icon (auto-populated from build, but can override)

## Asset Checklist

- [ ] Feature graphic (1024×500)
- [ ] App icon (512×512)
- [ ] Phone screenshot 1 (home)
- [ ] Phone screenshot 2 (dashboard)
- [ ] Phone screenshot 3 (onboarding)
- [ ] Phone screenshot 4 (voice)
- [ ] Phone screenshot 5 (sms)
- [ ] Phone screenshot 6 (evidence)

## Notes

- All PNG files should be optimized for web
- Keep file sizes reasonable (<500KB per screenshot)
- Test assets in Play Console before submitting for review
- Feature graphic is the first thing users see - make it compelling!

---

**Last Updated:** 2025-01-10  
**Play Console:** https://play.google.com/console  
**Documentation:** https://support.google.com/googleplay/android-developer/answer/9866151
