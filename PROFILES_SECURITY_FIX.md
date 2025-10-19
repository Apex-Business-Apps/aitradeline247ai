# Profiles Table Security Fix

**Status**: ✅ **FIXED** - Migration applied successfully on 2025-10-07

**Verification**: 
- ✅ Vulnerable RLS policies removed
- ✅ Service role SELECT access revoked  
- ✅ Secure functions created: `get_profile_masked()`, `get_profile_pii_emergency()`
- ✅ Safe view created: `profiles_safe`
- ✅ Comprehensive audit logging active

## Security Vulnerability

**Issue**: Customer Phone Numbers and Names Could Be Stolen  
**Severity**: 🔴 **CRITICAL**  
**Risk**: Hackers could steal customer contact information for spam, phishing, or identity theft

### Original Problem

The `profiles` table contained sensitive PII (phone numbers and full names) with a problematic timing-based RLS policy that could be bypassed:

```sql
-- ❌ VULNERABLE: Timing-based check could be bypassed
CREATE POLICY "Admins must use secure function for profile access"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM data_access_audit
    WHERE user_id = auth.uid()
    AND accessed_table = 'profiles'
    AND created_at > (now() - interval '1 second')
    LIMIT 1
  )
);

-- ❌ VULNERABLE: Service role has full access including SELECT
CREATE POLICY "Service role full access to profiles"
ON public.profiles FOR ALL
USING (true);
```

**Attack Vectors**:
1. **Race Condition**: The 1-second audit window could be exploited
2. **Service Role Compromise**: If service role credentials leaked, all profile data exposed
3. **Direct Table Access**: Admins could bypass secure functions

---

## Security Fix Implementation

### 1. Removed Vulnerable Policies ❌

```sql
-- Dropped problematic timing-based policy
DROP POLICY "Admins must use secure function for profile access" ON public.profiles;

-- Dropped overly permissive service role policy
DROP POLICY "Service role full access to profiles" ON public.profiles;
```

### 2. Created Granular Service Role Policies ✅

```sql
-- Service role can only INSERT (user registration)
CREATE POLICY "Service role can insert profiles"
ON public.profiles FOR INSERT TO service_role WITH CHECK (true);

-- Service role can only UPDATE (system operations)
CREATE POLICY "Service role can update profiles"
ON public.profiles FOR UPDATE TO service_role
USING (true) WITH CHECK (true);

-- Service role can only DELETE (account deletion)
CREATE POLICY "Service role can delete profiles"
ON public.profiles FOR DELETE TO service_role USING (true);

-- ✅ NO SELECT ACCESS for service role - prevents data theft
```

### 3. Created Safe View with Masked Data 🔒

```sql
CREATE VIEW public.profiles_safe AS
SELECT
  id,
  created_at,
  updated_at,
  -- Mask name: "John Doe" → "J***"
  CASE
    WHEN full_name IS NOT NULL AND length(full_name) > 0 THEN
      left(full_name, 1) || '***'
    ELSE NULL
  END as full_name_masked,
  -- Mask phone: "+15551234567" → "***4567"
  CASE
    WHEN phone_e164 IS NOT NULL AND length(phone_e164) >= 4 THEN
      '***' || right(phone_e164, 4)
    WHEN phone_e164 IS NOT NULL THEN
      '***'
    ELSE NULL
  END as phone_e164_masked,
  (full_name IS NOT NULL) as has_name,
  (phone_e164 IS NOT NULL) as has_phone
FROM public.profiles;
```

**Example Output**:
```
id: 123e4567-e89b-12d3-a456-426614174000
full_name_masked: "J***"
phone_e164_masked: "***4567"
has_name: true
has_phone: true
```

### 4. Implemented Secure Functions 🛡️

#### A. Masked Profile Access (All Users)

```sql
CREATE FUNCTION public.get_profile_masked(profile_user_id uuid)
RETURNS TABLE (...masked fields...)
```

**Access Control**:
- ✅ Users can view their own profile
- ✅ Organization members can view each other
- ❌ No access to other users' profiles

**Audit Trail**: Logs every access to `data_access_audit`

#### B. Emergency PII Access (Admins Only)

```sql
CREATE FUNCTION public.get_profile_pii_emergency(
  profile_user_id uuid,
  access_reason text
)
RETURNS TABLE (...unmasked fields...)
```

**Access Control**:
- ✅ Only users with `admin` role
- ✅ Requires mandatory access reason
- ✅ Generates high-severity security alert
- ✅ Comprehensive audit logging

**Example Usage**:
```sql
-- ❌ BLOCKED: Non-admin access
SELECT * FROM get_profile_pii_emergency(
  '123e4567-e89b-12d3-a456-426614174000',
  'Customer support request'
);
-- Error: Access denied: Admin role required

-- ✅ ALLOWED: Admin with valid reason
SELECT * FROM get_profile_pii_emergency(
  '123e4567-e89b-12d3-a456-426614174000',
  'Legal compliance audit - Case #2024-001'
);
-- Returns unmasked data + generates security alert
```

### 5. Audit Logging via Secure Functions 🚨

**Note**: PostgreSQL doesn't support SELECT triggers, so monitoring is implemented through the secure functions:

```sql
-- All access through get_profile_masked() is logged
INSERT INTO data_access_audit (
  user_id, accessed_table, accessed_record_id, access_type
) VALUES (auth.uid(), 'profiles', profile_user_id, 'masked_view');

-- Emergency access through get_profile_pii_emergency() generates alerts
INSERT INTO security_alerts (
  alert_type, user_id, event_data, severity
) VALUES ('admin_pii_access', auth.uid(), ..., 'high');
```

**Monitoring**:
- All masked access logged to `data_access_audit`
- Emergency PII access generates **HIGH** severity security alerts
- Comprehensive audit trail for compliance

---

## Security Benefits

| Before | After |
|--------|-------|
| ❌ Timing-based policy could be bypassed | ✅ No timing dependencies |
| ❌ Service role had full SELECT access | ✅ Service role has no SELECT access |
| ❌ Admins could view PII without audit | ✅ All PII access heavily audited |
| ❌ No data masking | ✅ Masked data by default |
| ❌ No access reason required | ✅ Emergency access requires justification |
| ❌ Weak audit trail | ✅ Comprehensive logging + security alerts |

---

## Developer Guidelines

### ✅ SAFE: Using Masked Data

```typescript
// Frontend: Display masked profile
const { data } = await supabase
  .from('profiles_safe')
  .select('*')
  .eq('id', userId)
  .single();

console.log(data.full_name_masked); // "J***"
console.log(data.phone_e164_masked); // "***4567"
```

```typescript
// Backend: Get masked profile with audit
const { data } = await supabase
  .rpc('get_profile_masked', { profile_user_id: userId });
```

### ⚠️ UNSAFE: Direct Table Access

```typescript
// ❌ NEVER DO THIS - Violates RLS policies
const { data } = await supabase
  .from('profiles')
  .select('full_name, phone_e164')
  .eq('id', userId);
// Will fail: RLS blocks direct access to PII fields
// Users can only see their own profile, no PII access for others
```

### 🚨 EMERGENCY ONLY: Unmasked PII Access

```typescript
// ⚠️ Admin only - generates security alert
const { data } = await supabase
  .rpc('get_profile_pii_emergency', {
    profile_user_id: userId,
    access_reason: 'Legal compliance audit - Case #2024-001'
  });
// Returns: { full_name: "John Doe", phone_e164: "+15551234567" }
// Alert severity: HIGH
```

---

## Monitoring & Alerts

### Security Alert Types

1. **HIGH**: Emergency PII access
   - Alert: `admin_pii_access`
   - Event data includes: profile_id, access_reason, timestamp
   - Action: Review access reason, confirm legitimacy

2. **INFO**: Masked profile access
   - Logged in: `data_access_audit` 
   - Access type: `masked_view`
   - Action: Standard monitoring, no action needed

### Audit Log Queries

```sql
-- View all profile PII access in last 24 hours
SELECT 
  user_id,
  accessed_record_id,
  access_type,
  created_at
FROM data_access_audit
WHERE accessed_table = 'profiles'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- View all security alerts
SELECT 
  alert_type,
  user_id,
  event_data,
  severity,
  created_at
FROM security_alerts
WHERE alert_type LIKE '%profile%'
  AND created_at > now() - interval '7 days'
ORDER BY created_at DESC;
```

---

## Impact on Existing Code

### ✅ No Frontend Changes Required

The existing code in your application does not directly query the `profiles` table for PII, so no changes are needed.

**Confirmed Safe**:
- `src/hooks/useAuth.ts` - Uses `auth.users` not `profiles`
- `src/components/security/SecurityMonitor.tsx` - No profile queries
- All pages and components - No direct profile PII access

### 🔄 Future Development

When you need to display profile information:

```typescript
// ✅ CORRECT: Use safe view
const { data: profile } = await supabase
  .from('profiles_safe')
  .select('*')
  .eq('id', auth.uid())
  .single();

// Display: "J***" and "***4567"
```

```typescript
// 🚨 EMERGENCY ONLY: Unmasked access
const { data: profile } = await supabase
  .rpc('get_profile_pii_emergency', {
    profile_user_id: userId,
    access_reason: 'Customer support ticket #12345'
  });

// Returns: "John Doe" and "+15551234567"
// Generates HIGH severity security alert
```

---

## Compliance Benefits

- ✅ **GDPR Article 32**: Pseudonymization of personal data
- ✅ **PIPEDA Principle 7**: Security safeguards for personal information
- ✅ **SOC 2 CC6.6**: Logical access controls
- ✅ **Data Minimization**: Only expose data when necessary
- ✅ **Audit Trail**: Complete record of PII access
- ✅ **Accountability**: Access reasons required and logged

---

## Testing

### Test 1: Verify Masked Data

```sql
-- Should return masked data
SELECT * FROM profiles_safe WHERE id = auth.uid();
-- Expected: full_name_masked = "J***", phone_e164_masked = "***4567"
```

### Test 2: Verify Direct Access Protection

```sql
-- Users can only see their own basic profile
SELECT * FROM profiles WHERE id = auth.uid();
-- Works: Returns own profile (RLS policy: "Users can only view their own profile")

-- Non-service accounts cannot see other profiles
SELECT * FROM profiles WHERE id != auth.uid();
-- Returns empty result: RLS blocks access to other users' profiles
```

### Test 3: Verify Emergency Access

```sql
-- Non-admin should fail
SELECT * FROM get_profile_pii_emergency(
  '123e4567-e89b-12d3-a456-426614174000',
  'Test reason'
);
-- Expected: Error: Access denied

-- Admin should succeed with alert
SELECT * FROM get_profile_pii_emergency(
  '123e4567-e89b-12d3-a456-426614174000',
  'Security audit'
);
-- Expected: Unmasked data + HIGH severity alert
```

---

## Summary

🎯 **Security Vulnerability Fixed**  
✅ Removed timing-based policy bypass  
✅ Restricted service role SELECT access  
✅ Implemented data masking by default  
✅ Added comprehensive audit logging  
✅ Required justification for PII access  
✅ Real-time security alerting

**Result**: Profile PII is now **fully protected** with multiple layers of defense and complete audit trail.

