# Settings API Documentation

## Overview
The Settings API allows organizations to configure their AI receptionist service and manage business information.

## Environment Variables

```bash
# Supabase (required)
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Twilio (for test calls)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15005550006
```

## API Endpoints

### GET /api/settings?email_to=...
Retrieve organization data, settings, and subscription information.

**Query Parameters:**
- `email_to` (required): Organization email address

**Response:**
```json
{
  "org": {
    "id": "uuid",
    "name": "Business Name", 
    "email_to": "contact@business.com",
    "target_e164": "+15551234567",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "settings": {
    "org_id": "uuid",
    "business_name": "Display Name",
    "email_recipients": ["email1@business.com", "email2@business.com"],
    "business_target_e164": "+15551234567",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  "subscription": {
    "id": "uuid",
    "org_id": "uuid", 
    "stripe_customer_id": "cus_...",
    "stripe_subscription_id": "sub_...",
    "plan": "basic",
    "status": "active",
    "current_period_end": "2025-02-01T00:00:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**cURL Example:**
```bash
curl "http://localhost:8080/api/settings?email_to=test@example.com"
```

### POST /api/settings
Update organization settings.

**Request Body:**
```json
{
  "email_to": "contact@business.com",
  "business_name": "Display Name for AI",
  "business_target_e164": "+15551234567",
  "email_recipients": ["email1@business.com", "email2@business.com"]
}
```

**Response:**
```json
{
  "ok": true
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "email_to": "test@example.com",
    "business_name": "Test Business",
    "business_target_e164": "+15551234567",
    "email_recipients": ["admin@test.com"]
  }'
```

### POST /api/settings/test-call
Place a test call to verify phone number configuration.

**Request Body:**
```json
{
  "email_to": "contact@business.com"
}
```

**Response:**
```json
{
  "ok": true,
  "placed": true,
  "call_sid": "CA..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/settings/test-call \
  -H "Content-Type: application/json" \
  -d '{"email_to": "test@example.com"}'
```

## Field Definitions

### business_name
- **Purpose**: Display name used by the AI in conversations
- **Example**: "Smith & Associates Law Firm"
- **Validation**: Required, non-empty string

### business_target_e164
- **Purpose**: Phone number where important calls are forwarded
- **Format**: E.164 format, NANP only (`+1XXXXXXXXXX`)
- **Example**: `+15551234567`
- **Validation**: Must match regex `^\+1\d{10}$`

### email_recipients
- **Purpose**: Email addresses to receive call notifications and transcripts
- **Format**: Array of valid email addresses
- **Example**: `["owner@business.com", "manager@business.com"]`
- **Validation**: Each email must be valid format

## E.164 Phone Number Rules

1. **Format**: `+1` followed by exactly 10 digits
2. **Valid Examples**:
   - `+15551234567`
   - `+14161234567` (Toronto)
   - `+12125551234` (New York)

3. **Invalid Examples**:
   - `5551234567` (missing country code)
   - `+15551234` (too short)
   - `+4415551234567` (UK number, not NANP)

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid phone number. Please use US/Canada format: +1XXXXXXXXXX"
}
```

### 404 Not Found
```json
{
  "error": "Organization not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Expected HTTP Status Codes

| Endpoint | Method | Success | Error Scenarios |
|----------|--------|---------|-----------------|
| /api/settings | GET | 200 | 400 (missing email_to), 404 (org not found) |
| /api/settings | POST | 200 | 400 (validation), 404 (org not found), 500 (db error) |
| /api/settings/test-call | POST | 200 | 400 (missing email_to), 404 (org/settings not found), 500 (Twilio error) |

## Test Call Behavior

When a test call is placed:
1. Looks up organization by `email_to`
2. Retrieves `business_target_e164` from org_settings
3. Places outbound call using Twilio
4. Plays message: "This is a test call from TradeLine 24 slash 7. Your system is working correctly. Goodbye."
5. Automatically hangs up after message

The test call verifies:
- Phone number is reachable
- Twilio integration is working
- Configuration is correct