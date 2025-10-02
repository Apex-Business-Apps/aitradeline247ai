# PII Encryption at Rest - Implementation Guide

**Status:** Recommended for Future Implementation  
**Priority:** Medium  
**Estimated Effort:** 3-5 days

---

## Overview

TradeLine 24/7 currently implements **encryption in transit** (TLS 1.3) and **access control** (RLS, masking, audit logging) for PII protection. This guide outlines options for adding **encryption at rest** for sensitive customer data.

---

## Why Encrypt PII at Rest?

**Current Protection:**
- ✅ Data encrypted in transit (TLS 1.3)
- ✅ Access control via RLS and role-based permissions
- ✅ PII masking for non-admin users
- ✅ Comprehensive audit logging

**Additional Benefits of Encryption at Rest:**
1. **Defense-in-Depth**: Protects data even if database backups are compromised
2. **Compliance**: Some regulations (e.g., HIPAA, PCI DSS) require encryption at rest
3. **Data Breach Mitigation**: Encrypted data is useless without decryption keys
4. **Customer Trust**: Demonstrates commitment to data security

**Trade-offs:**
- Increased complexity (key management, rotation)
- Performance impact (encryption/decryption overhead)
- Migration effort (encrypting existing data)

---

## Option 1: Supabase Vault (Recommended)

Supabase Vault is a managed secrets and encryption service built into Supabase.

### Pros
- **Built-in Key Management**: No need to manage encryption keys manually
- **Key Rotation**: Automatic or manual key rotation support
- **Audit Logging**: Built-in access logs for encrypted data
- **Performance**: Optimized for Supabase infrastructure
- **Easy Integration**: SQL functions for encrypt/decrypt operations

### Cons
- **Vendor Lock-in**: Tied to Supabase platform
- **Limited Control**: Less flexibility than application-level encryption

### Implementation Steps

#### 1. Enable Supabase Vault

Supabase Vault is available by default. No special setup required.

#### 2. Create Encryption Keys

```sql
-- Create a master encryption key for PII
INSERT INTO vault.secrets (name, secret)
VALUES (
  'pii_encryption_key',
  encode(gen_random_bytes(32), 'base64') -- 256-bit key
);
```

#### 3. Migrate Appointments Table

**Step 3a: Add Encrypted Columns**

```sql
-- Add encrypted columns for PII fields
ALTER TABLE appointments
ADD COLUMN email_encrypted BYTEA,
ADD COLUMN e164_encrypted BYTEA,
ADD COLUMN first_name_encrypted BYTEA;
```

**Step 3b: Create Encryption/Decryption Functions**

```sql
-- Function to encrypt PII using Vault
CREATE OR REPLACE FUNCTION encrypt_pii(plaintext TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  key TEXT;
BEGIN
  -- Retrieve encryption key from Vault
  SELECT decrypted_secret INTO key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key';
  
  -- Encrypt using AES-256-GCM
  RETURN pgp_sym_encrypt(plaintext, key, 'cipher-algo=aes256');
END;
$$;

-- Function to decrypt PII using Vault
CREATE OR REPLACE FUNCTION decrypt_pii(ciphertext BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  key TEXT;
BEGIN
  -- Retrieve encryption key from Vault
  SELECT decrypted_secret INTO key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key';
  
  -- Decrypt
  RETURN pgp_sym_decrypt(ciphertext, key);
END;
$$;
```

**Step 3c: Migrate Existing Data**

```sql
-- Encrypt existing PII data (run in batches for large tables)
UPDATE appointments
SET 
  email_encrypted = encrypt_pii(email),
  e164_encrypted = encrypt_pii(e164),
  first_name_encrypted = encrypt_pii(first_name)
WHERE email IS NOT NULL OR e164 IS NOT NULL OR first_name IS NOT NULL;

-- Verify encryption worked
SELECT 
  id,
  email,
  decode(email_encrypted, 'base64') AS email_encrypted_preview,
  decrypt_pii(email_encrypted) AS email_decrypted
FROM appointments
LIMIT 5;

-- Once verified, drop plaintext columns
ALTER TABLE appointments
DROP COLUMN email,
DROP COLUMN e164,
DROP COLUMN first_name;

-- Rename encrypted columns
ALTER TABLE appointments
RENAME COLUMN email_encrypted TO email;
ALTER TABLE appointments
RENAME COLUMN e164_encrypted TO e164;
ALTER TABLE appointments
RENAME COLUMN first_name_encrypted TO first_name;
```

**Step 3d: Update Application Code**

No changes needed! The encryption/decryption functions are transparent to the application.

**Step 3e: Update Security Functions**

```sql
-- Update get_secure_appointment to decrypt and mask
CREATE OR REPLACE FUNCTION public.get_secure_appointment(appointment_id uuid)
RETURNS TABLE(
  id uuid,
  organization_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  status text,
  source text,
  tz text,
  note text,
  created_at timestamptz,
  email_masked text,
  e164_masked text,
  first_name_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Check access permissions
  IF NOT public.is_org_member((SELECT organization_id FROM public.appointments WHERE id = appointment_id LIMIT 1)) THEN
    RAISE EXCEPTION 'Access denied: Not a member of the organization';
  END IF;

  -- Log access
  PERFORM public.log_data_access('appointments', appointment_id::text, 'secure_appointment_view');
  
  -- Fetch and decrypt
  SELECT * INTO appointment_record FROM public.appointments WHERE appointments.id = appointment_id;
  
  -- Return masked data
  RETURN QUERY
  SELECT 
    appointment_record.id,
    appointment_record.organization_id,
    appointment_record.start_at,
    appointment_record.end_at,
    appointment_record.status,
    appointment_record.source,
    appointment_record.tz,
    appointment_record.note,
    appointment_record.created_at,
    -- Decrypt and mask
    CASE 
      WHEN appointment_record.email IS NOT NULL THEN 
        LEFT(decrypt_pii(appointment_record.email), 1) || '***@' || 
        SPLIT_PART(decrypt_pii(appointment_record.email), '@', 2)
      ELSE NULL 
    END as email_masked,
    public.mask_phone_number(decrypt_pii(appointment_record.e164), auth.uid()) as e164_masked,
    CASE 
      WHEN appointment_record.first_name IS NOT NULL THEN 
        LEFT(decrypt_pii(appointment_record.first_name), 1) || '***'
      ELSE NULL 
    END as first_name_masked;
END;
$$;
```

#### 4. Key Rotation Strategy

```sql
-- Create a new encryption key
INSERT INTO vault.secrets (name, secret)
VALUES (
  'pii_encryption_key_v2',
  encode(gen_random_bytes(32), 'base64')
);

-- Re-encrypt data with new key (in batches)
UPDATE appointments
SET 
  email = encrypt_pii_v2(decrypt_pii(email)),
  e164 = encrypt_pii_v2(decrypt_pii(e164)),
  first_name = encrypt_pii_v2(decrypt_pii(first_name))
WHERE id IN (
  SELECT id FROM appointments LIMIT 1000 OFFSET 0
);

-- Once all data re-encrypted, deactivate old key
UPDATE vault.secrets
SET secret = NULL
WHERE name = 'pii_encryption_key';
```

---

## Option 2: Application-Level Encryption (pgcrypto)

Use PostgreSQL's built-in `pgcrypto` extension for encryption without Supabase Vault.

### Pros
- **Full Control**: Manage encryption keys in your infrastructure
- **No Vendor Lock-in**: Works on any PostgreSQL database
- **Flexibility**: Custom encryption algorithms, key derivation

### Cons
- **Complexity**: Manual key management, rotation, backup
- **Security Risk**: Keys stored in environment variables or external key management system
- **Performance**: Slightly slower than Supabase Vault

### Implementation Steps

#### 1. Enable pgcrypto Extension

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

#### 2. Store Encryption Key Securely

**Option A: Environment Variable (Simple but less secure)**

```bash
# In .env or Supabase secrets
PII_ENCRYPTION_KEY=base64-encoded-256-bit-key
```

**Option B: External Key Management (Recommended for production)**
- AWS KMS (Key Management Service)
- Google Cloud KMS
- HashiCorp Vault
- Azure Key Vault

#### 3. Create Encryption Functions

```sql
-- Function to encrypt PII
CREATE OR REPLACE FUNCTION encrypt_pii(plaintext TEXT, key TEXT)
RETURNS BYTEA
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT pgp_sym_encrypt(plaintext, key, 'cipher-algo=aes256');
$$;

-- Function to decrypt PII
CREATE OR REPLACE FUNCTION decrypt_pii(ciphertext BYTEA, key TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT pgp_sym_decrypt(ciphertext, key);
$$;
```

#### 4. Migrate Data (Similar to Supabase Vault)

```sql
-- Add encrypted columns
ALTER TABLE appointments
ADD COLUMN email_encrypted BYTEA,
ADD COLUMN e164_encrypted BYTEA,
ADD COLUMN first_name_encrypted BYTEA;

-- Encrypt existing data (using key from environment variable)
-- Note: In a real implementation, fetch key from secure storage
UPDATE appointments
SET 
  email_encrypted = encrypt_pii(email, 'YOUR_ENCRYPTION_KEY_HERE'),
  e164_encrypted = encrypt_pii(e164, 'YOUR_ENCRYPTION_KEY_HERE'),
  first_name_encrypted = encrypt_pii(first_name, 'YOUR_ENCRYPTION_KEY_HERE')
WHERE email IS NOT NULL OR e164 IS NOT NULL OR first_name IS NOT NULL;

-- Drop plaintext columns after verification
ALTER TABLE appointments
DROP COLUMN email,
DROP COLUMN e164,
DROP COLUMN first_name;
```

#### 5. Application-Side Decryption (Edge Functions)

```typescript
// supabase/functions/get-appointment/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const encryptionKey = Deno.env.get('PII_ENCRYPTION_KEY')!;
  
  // Fetch encrypted appointment
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();
  
  if (error) throw error;
  
  // Decrypt PII fields
  const decrypted = {
    ...data,
    email: await decryptPII(data.email_encrypted, encryptionKey),
    e164: await decryptPII(data.e164_encrypted, encryptionKey),
    first_name: await decryptPII(data.first_name_encrypted, encryptionKey),
  };
  
  // Mask if needed
  const masked = {
    ...decrypted,
    email: maskEmail(decrypted.email),
    e164: maskPhone(decrypted.e164),
    first_name: maskName(decrypted.first_name),
  };
  
  return new Response(JSON.stringify(masked), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## Comparison Matrix

| Feature | Supabase Vault | pgcrypto (App-Level) |
|---------|---------------|----------------------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ Very Easy | ⭐⭐⭐ Moderate |
| **Key Management** | ⭐⭐⭐⭐⭐ Built-in | ⭐⭐ Manual |
| **Key Rotation** | ⭐⭐⭐⭐⭐ Automated | ⭐⭐ Manual |
| **Performance** | ⭐⭐⭐⭐⭐ Optimized | ⭐⭐⭐⭐ Good |
| **Audit Logging** | ⭐⭐⭐⭐⭐ Built-in | ⭐⭐ Manual |
| **Vendor Lock-in** | ⭐⭐ High | ⭐⭐⭐⭐⭐ None |
| **Cost** | Included | Free (pgcrypto) |
| **Security** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good (depends on key mgmt) |

---

## Recommendation

**For TradeLine 24/7, we recommend Supabase Vault** because:
1. Already using Supabase infrastructure (no new services to manage)
2. Built-in key rotation and audit logging
3. Minimal performance overhead
4. Easy to implement (no external key management system needed)
5. Compliance-ready (SOC 2, GDPR, etc.)

**When to Consider pgcrypto:**
- If planning to migrate away from Supabase in the future
- If requiring custom encryption algorithms
- If integrating with existing key management infrastructure (AWS KMS, etc.)

---

## Migration Checklist

- [ ] **Planning**
  - [ ] Identify all PII fields to encrypt
  - [ ] Estimate data volume and migration time
  - [ ] Plan for downtime or rolling migration
  
- [ ] **Testing**
  - [ ] Test encryption/decryption functions in staging
  - [ ] Verify performance impact (measure encryption overhead)
  - [ ] Test all application queries still work with encrypted data
  
- [ ] **Migration**
  - [ ] Run migration script in batches (avoid locking large tables)
  - [ ] Verify encrypted data integrity
  - [ ] Update application code (if needed)
  - [ ] Update security functions (masking, etc.)
  
- [ ] **Post-Migration**
  - [ ] Monitor performance metrics
  - [ ] Verify audit logs capture encrypted data access
  - [ ] Update Security Architecture documentation
  - [ ] Train admins on key rotation procedures

---

## Next Steps

1. **Review this guide** with the development team
2. **Estimate effort** for Supabase Vault implementation (3-5 days)
3. **Schedule implementation** in next sprint or milestone
4. **Create Jira/GitHub issue** with this guide as reference

---

## References

- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [PostgreSQL pgcrypto Extension](https://www.postgresql.org/docs/current/pgcrypto.html)
- [NIST Encryption Standards (FIPS 140-2)](https://csrc.nist.gov/publications/detail/fips/140/2/final)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-02 | AI Assistant | Initial PII encryption implementation guide |

**Next Review Date**: Before implementation (when scheduled)
