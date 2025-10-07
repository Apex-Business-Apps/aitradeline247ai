# Play Store Launch Preparation Checklist

**TradeLine 24/7 — Android/Google Play Store Deployment**

---

## ✅ Pre-Launch Checklist

### 1. App Identity & Metadata

- [x] **App Name**: TradeLine 24/7
- [x] **Package ID**: `app.lovable.555a49714138435ea7eedfa3d713d1d3`
- [x] **Short Description** (80 chars max):
  > "Never miss a call. Your 24/7 AI receptionist for business growth."

- [x] **Full Description** (4000 chars max):
```
Transform your business with TradeLine 24/7 — the AI-powered receptionist that never sleeps.

🚀 KEY FEATURES
• 24/7 Call Handling - Never miss another opportunity
• Smart Lead Capture - Automatically qualify and route leads
• Multi-Language Support - English and French-Canadian
• CRM Integration - Seamless data sync with your tools
• Real-Time Analytics - Track performance and insights
• Secure & Compliant - SOC 2, PIPEDA, PIPA certified

💼 PERFECT FOR
• Small Business Owners
• Sales Teams
• Real Estate Professionals
• Medical Practices
• Service Providers
• Startups

📊 BUSINESS IMPACT
• Increase lead capture by 40%
• Reduce response time to under 2 minutes
• Save 15+ hours per week on call handling
• Never lose a customer to voicemail again

🔒 ENTERPRISE-GRADE SECURITY
Your data is protected with bank-level encryption, regular security audits, and full compliance with Canadian privacy regulations (PIPEDA/PIPA).

🇨🇦 BUILT IN CANADA
Proudly Canadian-built with local support and infrastructure.

📞 GET STARTED
Download now and transform how you handle customer calls. Start with a free trial — no credit card required.

SUPPORT: support@tradeline247ai.com
PRIVACY: https://www.tradeline247ai.com/privacy
TERMS: https://www.tradeline247ai.com/terms
```

### 2. Required Assets

#### App Icons ✅
- [x] 512x512 PNG (high-res icon) → `/public/assets/brand/App_Icons/icon-512.png`
- [x] Adaptive icon layers:
  - [x] Foreground: `/public/assets/brand/App_Icons/ic_launcher_foreground.png`
  - [x] Background: `/public/assets/brand/App_Icons/ic_launcher_background.png`
  - [x] Monochrome: `/public/assets/brand/App_Icons/ic_launcher_monochrome.png`

#### Feature Graphic ⚠️ REQUIRED
- [ ] **1024 x 500 PNG** (no alpha channel)
- Location: Create at `/public/assets/store/play-feature-graphic.png`
- Guidelines: Brand banner with logo and tagline "Never miss a call. Work while you sleep."

#### Screenshots 📱 REQUIRED (minimum 2, maximum 8 per device type)

**Phone Screenshots** (Required: 2-8 images)
- Recommended size: 1080 x 1920 px (16:9 ratio)
- [ ] Screenshot 1: Hero/Landing page with value proposition
- [ ] Screenshot 2: Dashboard with stats
- [ ] Screenshot 3: Lead capture form
- [ ] Screenshot 4: Real-time call summary
- [ ] Screenshot 5: Analytics/Reports
- [ ] Screenshot 6: Integration settings

**7-inch Tablet Screenshots** (Optional but recommended)
- Recommended size: 1200 x 1920 px

**10-inch Tablet Screenshots** (Optional)
- Recommended size: 1600 x 2560 px

---

## 🎯 Store Listing Details

### Category
- **Primary**: Business
- **Secondary**: Productivity

### Content Rating
**Target Age Group**: Rated for 3+ (Business tool, no inappropriate content)

Required Questionnaire:
- Violence: No
- Sexual Content: No
- Profanity: No
- Controlled Substances: No
- Gambling: No
- User-generated content: No (Admin-controlled only)

### Pricing & Distribution
- **Price**: Free (with in-app purchases/subscriptions)
- **Countries**: Canada (primary), USA (expansion)
- **Target Devices**: Phones and Tablets

---

## 🔗 Required URLs

- [x] **Website**: https://www.tradeline247ai.com
- [x] **Privacy Policy**: https://www.tradeline247ai.com/privacy
- [x] **Terms of Service**: https://www.tradeline247ai.com/terms
- [ ] **Support Email**: support@tradeline247ai.com (verify active)
- [ ] **Support URL**: https://www.tradeline247ai.com/contact

---

## 🏗️ Technical Requirements

### App Bundle
- [ ] Build production app bundle: `npm run build`
- [ ] Generate signed AAB: `cd android && ./gradlew bundleRelease`
- [ ] File location: `android/app/build/outputs/bundle/release/app-release.aab`

### Version Information
- **Version Code**: 1
- **Version Name**: 1.0.0
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)

### Permissions Required
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<!-- For phone-related features -->
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.CALL_PHONE" />
```

### App Signing
- [ ] Create upload key: `keytool -genkey -v -keystore upload-key.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000`
- [ ] Store securely (DO NOT commit to Git)
- [ ] Configure in `android/gradle.properties`
- [ ] Enable Google Play App Signing (recommended)

---

## 📋 Pre-Submission Testing

### Functional Testing
- [ ] Install on physical Android device (min SDK 24)
- [ ] Test all core flows:
  - [ ] App launch and splash screen
  - [ ] User authentication (sign up/login)
  - [ ] Lead form submission
  - [ ] Dashboard data loading
  - [ ] PWA offline capabilities
  - [ ] Deep linking (if applicable)
  - [ ] Push notifications (if enabled)

### Performance Testing
- [ ] App launch time < 3 seconds
- [ ] No ANR (Application Not Responding) errors
- [ ] Memory usage < 100MB baseline
- [ ] Battery drain acceptable (< 5% per hour idle)

### Security Testing
- [ ] HTTPS only connections ✅
- [ ] No hardcoded secrets ✅
- [ ] Proper authentication flow ✅
- [ ] Secure storage implementation ✅

---

## 🚀 Submission Steps

### 1. Google Play Console Setup
1. Create Google Play Console account ($25 one-time fee)
2. Accept Developer Distribution Agreement
3. Complete account verification

### 2. Create App Listing
1. Navigate to "Create app"
2. Enter app details:
   - App name: TradeLine 24/7
   - Default language: English (Canada)
   - App or game: App
   - Free or paid: Free

### 3. Upload Assets
1. Store listing → Graphics → Upload all screenshots and feature graphic
2. App icon → Upload 512x512 icon
3. Write store listing content (description, short description)

### 4. Configure Content Rating
1. Complete questionnaire (see Content Rating section above)
2. Generate rating certificate
3. Apply rating

### 5. Select Countries & Pricing
1. Select target countries (Canada primary)
2. Confirm free distribution
3. Set up in-app products (if applicable)

### 6. Upload App Bundle
1. Navigate to "Production" → "Create new release"
2. Upload signed AAB file
3. Add release notes:
```
🎉 Welcome to TradeLine 24/7 v1.0.0

✨ Initial Release Features:
• 24/7 AI-powered call handling
• Smart lead capture and qualification
• Real-time analytics dashboard
• Multi-language support (EN/FR)
• Secure, enterprise-grade platform

🚀 Never miss another business opportunity!
```

### 7. Review & Publish
1. Complete all checklist items in Play Console
2. Submit for review
3. Review typically takes 1-7 days
4. Monitor status in Play Console

---

## 📊 Post-Launch Monitoring

### Week 1
- [ ] Monitor crash reports daily
- [ ] Check user reviews and respond
- [ ] Track installation numbers
- [ ] Verify all features working in production

### Week 2-4
- [ ] Analyze user feedback
- [ ] Plan first update based on feedback
- [ ] Monitor performance metrics
- [ ] Track conversion funnel

---

## 🆘 Common Issues & Solutions

### Issue: "Upload failed - Invalid signature"
**Solution**: Ensure app is signed with correct keystore and Google Play App Signing is enabled.

### Issue: "Screenshots rejected"
**Solution**: Verify screenshots are:
- Correct dimensions (16:9 ratio)
- No alpha channel
- PNG or JPEG format
- Showing actual app content (no mockups)

### Issue: "Privacy policy required"
**Solution**: Must have accessible privacy policy URL for apps that handle user data.

### Issue: "Permissions not justified"
**Solution**: In app description or privacy policy, explain why each permission is needed.

---

## 📞 Support Contacts

- **Developer Support**: support@tradeline247ai.com
- **Google Play Console Help**: https://support.google.com/googleplay/android-developer
- **Lovable Platform**: https://docs.lovable.dev/

---

## ✅ Final Pre-Flight Checklist

Before hitting "Submit for Review":

- [ ] All required screenshots uploaded (min 2 per device type)
- [ ] Feature graphic uploaded (1024x500)
- [ ] App icon uploaded (512x512)
- [ ] Store listing text complete and proofread
- [ ] Privacy policy URL accessible
- [ ] Terms of service URL accessible
- [ ] Content rating completed
- [ ] Countries and pricing configured
- [ ] Signed AAB uploaded
- [ ] Release notes written
- [ ] App tested on physical device
- [ ] No critical bugs or crashes
- [ ] All permissions justified
- [ ] Support email monitored and active

---

**READY TO LAUNCH? 🚀**

Once all items are checked, submit for review. Expected review time: 1-7 days.

Good luck with your Play Store launch! 🎉
