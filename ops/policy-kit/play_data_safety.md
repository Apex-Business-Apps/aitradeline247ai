# Google Play Data Safety

**App Name:** TradeLine 24/7  
**Package Name:** com.tradeline247ai.app  
**Last Updated:** 2025-01-08

## Data Collection Summary

### Personal Information
**Collected:** Yes  
**Shared:** No  
**Encrypted in transit:** Yes (TLS 1.3)  
**Users can request deletion:** Yes

#### Types Collected:
- **Phone Number** - For call routing and identification
- **Email Address** - For account management and notifications

### Financial Information
**Collected:** No  
**Shared:** No

### Location
**Collected:** No  
**Shared:** No

### Messages
**Collected:** Yes (SMS, Call Transcripts)  
**Shared:** No  
**Encrypted in transit:** Yes  
**Encrypted at rest:** Yes (AES-256)

#### Types Collected:
- **Call Transcripts** - AI-generated summaries of business calls
- **SMS Messages** - Business text message conversations

### Audio
**Collected:** No (via device)  
**Server-side processing:** Yes (via Twilio)

**IMPORTANT:** This app does NOT record device calls or access device microphone. All voice processing occurs server-side via Twilio cloud telephony.

### App Activity
**Collected:** Yes  
**Shared:** No  
**Purpose:** Analytics, Quality monitoring

#### Types Collected:
- **App Interactions** - Usage analytics
- **Call Logs** - Business call metadata (no audio)

### Device or Other IDs
**Collected:** Yes  
**Shared:** No  
**Purpose:** Session management

## Data Usage

All data collected is used for:
1. **App Functionality** - Core business telephony features
2. **Analytics** - Service quality monitoring
3. **Security** - Fraud prevention and compliance

Data is **NOT** used for:
- Advertising
- Personalized advertising
- Selling to third parties

## Data Sharing

We do **NOT** share data with third parties for their purposes.

### Service Providers (Processors Only):
- **Twilio** - Cloud telephony (voice, SMS)
- **OpenAI** - AI transcription and analysis
- **Supabase** - Database hosting
- **Resend** - Transactional emails

All processors are bound by data processing agreements and process data only on our instructions.

## Security Practices

### Encryption
- **In Transit:** TLS 1.3 for all network communications
- **At Rest:** AES-256 encryption for sensitive data (PII)

### Access Controls
- Row-level security policies
- Role-based access control (RBAC)
- Multi-factor authentication available

### Compliance
- PIPEDA/PIPA compliant (Canada)
- SOC 2 framework alignment
- Regular security audits

## Data Retention

- **Call Transcripts:** 90 days
- **Audit Logs:** 3 years (compliance)
- **User Accounts:** Until deletion requested

## User Rights

Users can:
1. **Access** their data via in-app dashboard
2. **Request deletion** at info@tradeline247ai.com
3. **Export** data on request
4. **Opt-out** of non-essential processing

### Data Deletion
Upon account deletion:
- PII is deleted within 30 days
- Audit logs retained for compliance (anonymized after 90 days)
- Backups purged within 90 days

## Contact

**Developer:** Apex Business Systems  
**Email:** info@tradeline247ai.com  
**Phone:** +1-587-742-8885  
**Address:** Edmonton, AB, Canada  
**Privacy Policy:** https://www.tradeline247ai.com/privacy

