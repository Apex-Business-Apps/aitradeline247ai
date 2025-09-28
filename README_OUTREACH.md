# Outreach System

Automated missed-call outreach system with WhatsApp and SMS capabilities.

## Required Environment Variables

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Optional
WHATSAPP_FROM=whatsapp:+1XXXXXXXXXX
WHATSAPP_CONTENT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Optional (Twilio Content API)
SMS_FROM=+1XXXXXXXXXX

# Business Configuration
BUSINESS_NAME="Your Business Name"
BUSINESS_TARGET_E164=+1XXXXXXXXXX  # Number to bridge calls to
BASE_URL=https://yourdomain.com

# Supabase Configuration (server-side)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Server Integration

Add to your main server file:

```javascript
import { wireOutreach } from './server/boot/outreach.wire.mjs';
wireOutreach(app);
```

## Database Setup

Apply the SQL migration via Supabase SQL editor. The system uses service role access with RLS policies configured for server operations.

## API Testing

### Invalid Signature Test
```bash
curl -X POST http://localhost:5000/webhooks/messaging/twilio \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=+1234567890&Body=test"
# Expected: 403 Forbidden
```

### Run Followups
```bash
curl -X POST http://localhost:5000/internal/outreach/run \
  -H "Content-Type: application/json"
# Expected: {"success":true,"sent":0,"timestamp":"2025-01-01T00:00:00.000Z"}
```

### Admin API - List Sessions
```bash
curl -X GET "http://localhost:5000/api/outreach/sessions?limit=10" \
  -H "Content-Type: application/json"
# Expected: {"items":[],"nextOffset":null}
```

## Features

- **Missed Call Detection**: Automatically detects missed/abandoned calls
- **Multi-Channel Outreach**: WhatsApp and SMS support with consent management
- **Interactive Messaging**: Buttons for "Call now", "Book time", "Leave note"
- **Follow-up Automation**: Automated nudges after 2 hours
- **Admin Dashboard**: React-based UI for session management
- **Consent Compliance**: Opt-in/opt-out tracking per channel

## Architecture

- **Database**: Supabase with RLS policies for security
- **Messaging**: Twilio for SMS, WhatsApp, and voice calls
- **Server**: Express.js with webhook validation
- **Frontend**: React with TypeScript and Tailwind CSS