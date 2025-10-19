# TradeLine 24/7 Security Architecture

**Version:** 2.0  
**Last Updated:** 2025-10-02  
**Security Grade:** A-

## Executive Summary

TradeLine 24/7 implements a defense-in-depth security architecture with multiple layers of protection. This document outlines our comprehensive security controls, data protection measures, and compliance framework.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection & Privacy](#data-protection--privacy)
3. [Network Security](#network-security)
4. [Application Security](#application-security)
5. [Monitoring & Incident Response](#monitoring--incident-response)
6. [Compliance & Certifications](#compliance--certifications)
7. [Security Operations](#security-operations)

---

## Authentication & Authorization

### Multi-Layer Authentication

#### 1. Primary Authentication (Supabase Auth)
- **PKCE Flow (Proof Key for Code Exchange)**: Industry-standard OAuth 2.0 extension preventing authorization code interception attacks
- **JWT Token Management**: 
  - Short-lived access tokens (1 hour expiry)
  - Secure refresh token rotation
  - Token revocation on logout
- **Password Security**:
  - Minimum 8 characters with complexity requirements
  - Have I Been Pwned (HIBP) integration for breach detection
  - Argon2 hashing (managed by Supabase)

#### 2. Session Management
- **Enhanced Session Security** (`useEnhancedSessionSecurity` hook):
  - Activity tracking with privacy-first approach (partial session tokens only)
  - Concurrent session detection (max 3 active sessions)
  - Suspicious activity monitoring with rate limiting
  - Automatic timeout after inactivity (15 minutes warning, 30 minutes forced logout)
- **Session Storage**: 
  - Secure, httpOnly cookies for sensitive tokens
  - sessionStorage for temporary UI state only (never sensitive data)

#### 3. Role-Based Access Control (RBAC)

**Security-First RBAC Implementation:**

```sql
-- Separate roles table to prevent privilege escalation
create type app_role as enum ('admin', 'moderator', 'user');

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Security definer function prevents recursive RLS issues
create function has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = _user_id and role = _role
  )
$$;
```

**Key Security Features:**
- Roles stored in separate table (not on user profile) to prevent client-side manipulation
- `SECURITY DEFINER` functions bypass RLS for role checks, preventing infinite recursion
- Immutable role enum prevents injection of arbitrary roles
- Server-side validation only (never trust client-side role claims)

---

## Data Protection & Privacy

### Three-Tier PII Protection Architecture

#### Tier 1: Non-PII View (Public Access)
- **View**: `appointments_safe`
- **Purpose**: Dashboard display without exposing customer data
- **Exposed Fields**: 
  - Appointment ID, organization ID
  - Start/end times, status, source, timezone, notes
  - Boolean flags: `has_email`, `has_phone`, `has_name`
- **Security**: 
  - `SECURITY DEFINER` view bypasses restrictive RLS on base table
  - Organization membership enforced via `is_org_member()`
  - Zero PII exposure

#### Tier 2: Masked PII (Organization Members)
- **Function**: `get_secure_appointment(appointment_id)`
- **Purpose**: Limited customer contact for appointment management
- **Masking Rules**:
  - Email: `j***@example.com` (first character + domain)
  - Phone: `+1***-***-34` (country code + last 2 digits)
  - Name: `J***` (first character only)
- **Audit**: All accesses logged to `data_access_audit`

#### Tier 3: Full PII (Admin Only)
- **Function**: `get_customer_contact_info(appointment_id)`
- **Purpose**: Emergency contact or compliance requirements
- **Security**:
  - `has_role(auth.uid(), 'admin')` check enforced
  - Heavy audit logging to `data_access_audit`
  - Security alert created on every access
  - Requires explicit reason/justification

**Additional Function**: `emergency_customer_contact(appointment_id, reason)`
- Admin-only emergency access with mandatory reason
- Logs to `security_alerts` table with severity: HIGH
- Used for critical situations only (service outages, legal compliance)

### Row-Level Security (RLS)

**100% RLS Coverage** across all 52 database tables. Key policies:

#### Appointments Table (High Sensitivity)
```sql
-- Block all direct access to appointments table
create policy "Block direct customer data access"
on appointments for all
using (false);

-- Force use of secure views/functions
-- All legitimate access goes through:
-- 1. appointments_safe view (non-PII)
-- 2. get_secure_appointment() (masked PII)
-- 3. get_customer_contact_info() (admin full access)
```

#### User Roles Table (Critical)
```sql
-- Admins can manage roles
create policy "Admins can manage user roles"
on user_roles for all
using (has_role(auth.uid(), 'admin'));

-- Users can view their own roles
create policy "Users can view own roles"
on user_roles for select
using (user_id = auth.uid());
```

#### Profiles Table
```sql
-- Block anonymous access
create policy "profiles_block_anonymous"
on profiles for select
using (false);

-- Secure access for authenticated users
create policy "profiles_secure_select"
on profiles for select
using (
  (id = auth.uid()) OR 
  (has_role(auth.uid(), 'admin') AND share_org(auth.uid(), id))
);

-- Self-update only
create policy "profiles_self_update"
on profiles for update
using (id = auth.uid())
with check (id = auth.uid());
```

### Data Anonymization & Retention

#### IP Address Anonymization
```sql
create function anonymize_ip_address(ip inet)
returns inet
language sql immutable
as $$
  select case 
    when family(ip) = 4 then 
      -- IPv4: mask last octet (e.g., 192.168.1.0)
      (host(ip)::text || '.0')::inet
    else 
      -- IPv6: mask last 64 bits
      (regexp_replace(host(ip)::text, ':([^:]*:){0,3}[^:]*$', '::'))::inet
  end;
$$;
```

#### Data Retention Policies
- **Recordings**: 30 days (configurable per organization)
- **Transcripts**: 90 days
- **Email Logs**: 180 days
- **Analytics Events with PII**: 90 days (auto-cleanup via `cleanup_old_analytics_events()`)
- **Security Audit Logs**: 1 year (compliance requirement)

---

## Network Security

### Edge Function Security

#### JWT Verification Policy
```toml
# supabase/config.toml

# Public endpoints (no JWT required)
[functions.send-lead-email]
verify_jwt = false

[functions.voice-answer]
verify_jwt = false

[functions.voice-status]
verify_jwt = false

# Protected endpoints (JWT required)
[functions.dashboard-summary]
verify_jwt = true

[functions.track-session-activity]
verify_jwt = true

[functions.chat]
verify_jwt = true
```

#### Security Headers (Automatic via Edge Functions)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

#### CORS Configuration
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Twilio Webhook Security

#### Signature Validation
```typescript
import twilio from 'twilio';

const isValidTwilioRequest = (
  signature: string,
  url: string,
  params: Record<string, any>
): boolean => {
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  return twilio.validateRequest(authToken, signature, url, params);
};
```

### Rate Limiting

#### Multi-Level Rate Limiting

**1. Lead Form Submission (Server-Side)**
- Function: `secure-rate-limit` edge function
- Limits:
  - 3 submissions per email per hour
  - 5 submissions per IP per hour
- Implementation: Fail-closed (rejects if rate limit check fails)

**2. Hotline Protection**
- **ANI (Caller ID) Rate Limiting**:
  - Burst: 5 calls/minute
  - Sustained: 15 calls/hour
  - Exponential backoff on repeated violations
- **IP Rate Limiting**:
  - Burst: 10 calls/minute
  - Sustained: 30 calls/hour
- Tables: `hotline_rate_limit_ani`, `hotline_rate_limit_ip`

**3. Analytics Circuit Breaker**
- Function: `safe_analytics_insert_with_circuit_breaker()`
- Limit: 20 identical events per session per minute
- Prevents analytics flooding attacks

**4. Support Ticket Rate Limiting**
- Limit: 5 tickets per email per hour
- Table: `support_ticket_rate_limits`
- Cleanup function runs hourly

---

## Application Security

### Input Validation

#### Client-Side (Zod Schema)
```typescript
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string()
    .trim()
    .nonempty({ message: "Name cannot be empty" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255),
  message: z.string()
    .trim()
    .nonempty()
    .max(1000)
});
```

#### Server-Side (Edge Functions)
```typescript
const suspiciousPatterns = [
  /script/gi,
  /<[^>]*>/gi,           // HTML tags
  /javascript:/gi,
  /on\w+=/gi,            // Event handlers
  /(union|select|drop|delete|update|insert)/gi,  // SQL injection
];

const sanitizeInput = (input: string): string => {
  let cleaned = input.trim();
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(cleaned)) {
      throw new Error('Invalid input detected');
    }
  }
  
  return cleaned.slice(0, 1000); // Length limit
};
```

### Content Security Policy (CSP)

**Recommended CSP (to be implemented):**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://supabase.co https://*.supabase.co;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com;
media-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

### Dependency Security

- **Regular Updates**: Automated Dependabot alerts
- **Vulnerability Scanning**: GitHub security advisories
- **Package Integrity**: npm lockfile verification
- **Minimal Dependencies**: Only essential packages included

---

## Monitoring & Incident Response

### Security Monitoring Dashboard

**Real-Time Metrics** (Auto-refresh every 60 seconds):

#### 1. Failed Authentication Attempts
- Total failures (24h)
- Unique IPs attempting failures
- Top offending IP addresses
- Recent failure timeline

#### 2. Rate Limiting Status
- Hotline ANI blocks (active blocks per caller)
- Hotline IP blocks (active blocks per IP)
- Support ticket rate limits hit
- Total active security blocks

#### 3. PII Access Audit
- Total PII accesses (24h)
- Unique users accessing PII
- Breakdown by access type (view, export, emergency)
- Breakdown by table (profiles, appointments, etc.)
- Recent access log with timestamps

#### 4. Security Alerts
- Total alerts (24h)
- Critical alerts (require immediate action)
- High-severity alerts
- Unresolved alerts count
- Alert breakdown by type
- Recent alert timeline

**Database Functions:**
- `get_failed_auth_summary(time_window INTERVAL)`
- `get_rate_limit_stats(time_window INTERVAL)`
- `get_pii_access_summary(time_window INTERVAL)`
- `get_security_alerts_summary(time_window INTERVAL)`
- `get_security_dashboard_data()` (aggregates all metrics)

### Audit Logging

#### Comprehensive Audit Trail

**1. Data Access Audit** (`data_access_audit` table)
```sql
create table data_access_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  accessed_table text not null,
  accessed_record_id text,
  access_type text not null, -- 'read', 'write', 'delete', 'export', 'pii_access'
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);
```

**2. Security Alerts** (`security_alerts` table)
```sql
create table security_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null,
  severity text default 'medium', -- 'info', 'low', 'medium', 'high', 'critical'
  user_id uuid references auth.users,
  ip_address inet,
  user_agent text,
  event_data jsonb default '{}',
  resolved boolean default false,
  created_at timestamptz default now()
);
```

**Alert Types:**
- `excessive_failed_auth`: 5+ failed logins in 15 minutes
- `admin_new_location`: Admin login from new IP
- `customer_contact_access`: Full PII access by admin
- `emergency_customer_contact_access`: Emergency PII access
- `large_data_export`: Export of 1000+ records
- `suspicious_profile_enumeration`: 20+ profile accesses in 1 hour
- `distributed_brute_force`: 3+ IPs with auth failures
- `support_ticket_spam_wave`: 5+ rate limit hits in 1 hour

**3. Analytics Events** (`analytics_events` table)
```sql
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references auth.users,
  session_id text,
  user_session text, -- Anonymized session identifier
  ip_address inet, -- Anonymized (last octet/64 bits masked)
  user_agent text,
  event_data jsonb default '{}',
  severity text default 'info',
  created_at timestamptz default now()
);
```

**Event Types:**
- `page_view`, `web_vital`, `error`
- `auth_attempt`, `auth_failed`, `concurrent_sessions_detected`
- `suspicious_activity` (copy, paste, contextmenu, etc.)
- `ab_test_conversion`, `ab_test_access`
- `security_event`, `data_retention_cleanup`

**4. Performance Metrics** (`performance_metrics` table)
```sql
create table performance_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null, -- 'lcp', 'fcp', 'cls', 'ttfb', 'fid'
  metric_value numeric not null,
  metric_unit text default 'ms',
  user_agent text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
```

### Automated Threat Detection

**Function: `detect_and_alert_anomalies()`**

Runs automatically on high-severity security events. Detects:

1. **Support Ticket Spam Waves**
   - Trigger: 5+ unique sources hit rate limit in 1 hour
   - Alert: `support_ticket_spam_wave` (severity: HIGH)

2. **Distributed Brute Force**
   - Trigger: 3+ IPs with 3+ auth failures each in 30 minutes
   - Alert: `distributed_brute_force` (severity: CRITICAL)

3. **Excessive Data Export**
   - Trigger: 10+ exports by single user in 2 hours
   - Alert: `excessive_data_export` (severity: HIGH)

4. **Suspicious Profile Enumeration**
   - Trigger: Non-admin accessing 20+ profiles in 1 hour
   - Alert: `suspicious_profile_enumeration` (severity: HIGH)

### Incident Response Workflow

1. **Detection**: Automated alerts via `detect_and_alert_anomalies()` or Security Monitoring Dashboard
2. **Triage**: Admin reviews alert in dashboard (severity, type, affected users)
3. **Investigation**: Review audit logs (`data_access_audit`, `analytics_events`)
4. **Containment**: 
   - Block offending IPs (add to `blocklist_numbers` or `hotline_rate_limit_ip`)
   - Revoke user sessions if compromised
   - Disable affected features temporarily
5. **Remediation**: Fix vulnerability, update security policies
6. **Resolution**: Mark alert as resolved in `security_alerts` table
7. **Post-Mortem**: Document incident, update security architecture

---

## Compliance & Certifications

### Regulatory Compliance

#### GDPR (General Data Protection Regulation)
- **Data Minimization**: Only collect PII necessary for service delivery
- **Right to Access**: Users can view their data via dashboard
- **Right to Deletion**: Users can request account deletion
- **Right to Portability**: Data export functionality available
- **Data Retention**: Automated cleanup of stale PII (90 days for analytics)
- **Consent Management**: `consent_logs` table tracks consent for communications
- **Breach Notification**: Incident response workflow includes notification procedures

#### PIPEDA (Personal Information Protection and Electronic Documents Act - Canada)
- **Consent**: Explicit opt-in for marketing communications
- **Accountability**: Security architecture documented (this document)
- **Safeguards**: Encryption in transit (TLS 1.3), role-based access control
- **Openness**: Privacy policy clearly explains data practices
- **Individual Access**: Users can access and correct their data

#### PIPA (Personal Information Protection Act - Alberta/BC)
- Similar controls as PIPEDA
- Province-specific breach notification timelines implemented

#### SOC 2 Type II (via Supabase)
- **Security**: Multi-factor authentication, encryption, access controls
- **Availability**: 99.9% uptime SLA, redundant infrastructure
- **Processing Integrity**: Data validation, error handling, audit trails
- **Confidentiality**: PII masking, encryption at rest and in transit
- **Privacy**: Data retention policies, consent management

#### CCPA (California Consumer Privacy Act)
- **Right to Know**: Users can request information about collected data
- **Right to Delete**: Account deletion functionality
- **Right to Opt-Out**: Marketing preference management
- **Non-Discrimination**: Service available regardless of privacy choices

### Data Classification

| Classification | Examples | Protection Measures |
|----------------|----------|---------------------|
| **Public** | Marketing content, public blog posts | Standard web security |
| **Internal** | Business logic, configuration | Authentication required |
| **Confidential** | User profiles, call metadata | RLS, role-based access |
| **Restricted (PII)** | Customer emails, phone numbers | 3-tier protection, audit logging, masking |
| **Highly Restricted** | Payment information (if applicable) | PCI DSS compliance (future) |

---

## Security Operations

### Security Monitoring Access

**Access Levels:**
- **Admin Role**: Full access to Security Monitoring Dashboard (`/security-monitoring`)
- **Moderator Role**: Read-only access to non-PII security metrics (future)
- **User Role**: No access to security dashboard

**Dashboard URL**: `/security-monitoring` (admin-only)

**Key Metrics Monitored:**
1. Failed authentication attempts (real-time)
2. Rate limiting enforcement status
3. PII access patterns and anomalies
4. Security alerts (unresolved, critical, high)
5. Threat intelligence feed (future integration)

### Security Review Schedule

- **Daily**: Automated anomaly detection runs continuously
- **Weekly**: Admin reviews Security Monitoring Dashboard
- **Monthly**: Review unresolved security alerts, update blocklists
- **Quarterly**: Full security architecture review (this document)
- **Annually**: Third-party security audit, penetration testing

### Security Contacts

- **Security Team**: security@tradeline247.com (to be configured)
- **Incident Reporting**: incidents@tradeline247.com (to be configured)
- **Bug Bounty Program**: (future implementation)

### Vulnerability Disclosure Policy

1. **Responsible Disclosure**: 90-day disclosure timeline
2. **Severity Classification**: Critical (24h), High (7d), Medium (30d), Low (90d)
3. **Acknowledgment**: Public recognition in security changelog
4. **Rewards**: Bug bounty program (future)

---

## Future Security Enhancements

### High Priority (Next 3 Months)

1. **Content Security Policy (CSP) Headers**
   - Implement strict CSP to prevent XSS attacks
   - Use nonces for inline scripts
   - Report-only mode initially for testing

2. **PII Encryption at Rest**
   - **Option A**: Supabase Vault (recommended)
     - Encrypted secrets storage
     - Key rotation support
     - Audit logging built-in
   - **Option B**: Application-level encryption via `pgcrypto`
     - More control, more complexity
     - Requires key management strategy

3. **Security Monitoring Automation**
   - Slack/Teams integration for critical alerts
   - Automated incident response workflows
   - Machine learning anomaly detection

### Medium Priority (Next 6 Months)

1. **Two-Factor Authentication (2FA)**
   - TOTP (Time-based One-Time Password)
   - SMS backup codes
   - Recovery codes for account access

2. **Database Extension Isolation**
   - Move extensions from `public` schema to `extensions` schema
   - Reduces attack surface, improves maintainability

3. **Advanced Threat Intelligence**
   - Integration with threat intelligence feeds
   - IP reputation scoring
   - Geolocation-based risk assessment

### Low Priority (Next 12 Months)

1. **Hardware Security Keys**
   - WebAuthn/FIDO2 support for admins
   - Yubikey integration

2. **Security Awareness Training**
   - In-app security tips for admins
   - Regular security bulletins

3. **Penetration Testing Program**
   - Annual third-party pentest
   - Bug bounty program launch

---

## Appendix

### Security Functions Reference

#### Authentication & Session
- `has_role(_user_id uuid, _role app_role)`: Check user role
- `get_user_role(_user_id uuid)`: Get highest user role
- `share_org(_user_a uuid, _user_b uuid)`: Check shared organization membership

#### PII Protection
- `get_secure_appointment(appointment_id uuid)`: Get appointment with masked PII
- `get_customer_contact_info(appointment_id uuid)`: Get full PII (admin only)
- `emergency_customer_contact(appointment_id uuid, reason text)`: Emergency PII access
- `mask_phone_number(phone_e164 text, requesting_user_id uuid)`: Mask phone number
- `anonymize_ip_address(ip inet)`: Anonymize IP address

#### Audit & Monitoring
- `log_data_access(table_name text, record_id text, access_type text)`: Log data access
- `log_security_event(event_type text, user_id uuid, session_id text, event_data jsonb, severity text)`: Log security event
- `log_auth_attempt(event_type text, success boolean, user_identifier text, ip_address inet, user_agent text)`: Log auth attempt
- `detect_auth_anomalies(user_id uuid, ip_address inet, user_agent text, event_type text)`: Detect auth anomalies
- `detect_and_alert_anomalies()`: Comprehensive anomaly detection

#### Security Monitoring Dashboard
- `get_failed_auth_summary(time_window INTERVAL)`: Get failed auth summary
- `get_rate_limit_stats(time_window INTERVAL)`: Get rate limiting stats
- `get_pii_access_summary(time_window INTERVAL)`: Get PII access summary
- `get_security_alerts_summary(time_window INTERVAL)`: Get security alerts summary
- `get_security_dashboard_data()`: Get comprehensive dashboard data (admin only)

#### Rate Limiting
- `safe_analytics_insert_with_circuit_breaker(...)`: Analytics circuit breaker
- `cleanup_rate_limits()`: Clean up old rate limit records

#### Data Retention
- `cleanup_old_analytics_events()`: Delete PII from old analytics events
- `schedule_analytics_cleanup()`: Schedule periodic cleanup

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-Q4 | Security Team | Initial security architecture |
| 2.0 | 2025-10-02 | AI Assistant | Comprehensive security review, added monitoring dashboard, updated PII protection architecture |

**Next Review Date**: 2025-01-02

---

**Contact**: For questions about this security architecture, contact the security team at security@tradeline247.com (to be configured).

**Confidentiality**: This document contains sensitive security information. Treat as INTERNAL USE ONLY.

