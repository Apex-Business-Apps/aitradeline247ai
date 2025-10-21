# Acceptance Tests - TradeLine 24/7

Quick manual verification tests to run before deployment.

## 🔐 Security Tests

### 1. RLS (Row Level Security) - Profiles

**Test: User can only see own profile + org members**

```sql
-- In Supabase SQL Editor

-- Login as User A (org X):
-- Should see: self + org X members, NOT org Y members
SELECT id, full_name FROM profiles;

-- Login as User B (org Y):
-- Should NOT see org X members
SELECT id, full_name FROM profiles;

-- Login as Admin:
-- Should see all profiles
SELECT id, full_name FROM profiles;
```

**Expected Results:**
- ✅ User A sees self + org X
- ✅ User B cannot see org X
- ✅ Admin sees all

### 2. Database Functions - search_path

**Test: SECURITY DEFINER functions have SET search_path = public**

```sql
-- In Supabase SQL Editor
SELECT 
  p.proname,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosecdef = true  -- SECURITY DEFINER
  AND n.nspname = 'public';
```

**Expected Results:**
- ✅ Each function shows `SET search_path = public` in definition
- ✅ Specifically check: `has_role()`, `share_org()`, `get_profile_masked()`

### 3. Twilio Webhook Validation

**Test: Valid webhook with correct signature → 200**

```bash
# Use Twilio's webhook testing tool or:
curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/webhooks-twilio-voice \
  -H "X-Twilio-Signature: <valid-signature>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=CA123&From=+15551234567&To=+15559876543"
```

**Expected Results:**
- ✅ Returns 200 with valid signature
- ❌ Returns 401/403 with invalid/missing signature
- ❌ Returns 403 if IP not in allowlist (when TWILIO_IP_ALLOWLIST set)

### 4. CI Deployment Guard

**Test: CI refuses to deploy if ALLOW_INSECURE_TWILIO_WEBHOOKS=true and NODE_ENV=production**

```bash
# Locally run the security check:
NODE_ENV=production \
ALLOW_INSECURE_TWILIO_WEBHOOKS=true \
bash scripts/predeploy-security.sh
```

**Expected Results:**
- ✅ Script exits with error code 1
- ✅ Shows: "❌ SECURITY: ALLOW_INSECURE_TWILIO_WEBHOOKS must not be true in production"

## 🎨 Admin UI Tests

### 5. Admin Route Protection

**Test: Directly visiting /admin when not admin → blank/redirects**

1. **Not logged in:**
   - Visit: https://tradeline247ai.com/security-monitoring
   - Expected: Redirect to login or blank screen (no feature hints)

2. **Logged in as non-admin:**
   - Visit: https://tradeline247ai.com/security-monitoring
   - Expected: Blank screen or "Access Denied" (no data leaks)

3. **Logged in as admin:**
   - Visit: https://tradeline247ai.com/security-monitoring
   - Expected: Dashboard loads with data after `/api/auth/admin-check` returns 200

### 6. Admin API Protection

**Test: /api/auth/admin-check validates JWT + role on server**

```bash
# Without auth (should fail)
curl https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/admin-check

# With valid JWT but non-admin role (should fail)
curl https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/admin-check \
  -H "Authorization: Bearer <user-jwt>"

# With valid admin JWT (should succeed)
curl https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/admin-check \
  -H "Authorization: Bearer <admin-jwt>"
```

**Expected Results:**
- ❌ No auth: 401
- ❌ Non-admin: 403
- ✅ Admin: 200 with `{ ok: true }`

### 7. CSP Headers (Optional)

**Test: Response includes Content-Security-Policy headers**

```bash
curl -I https://tradeline247ai.com
```

**Expected Headers (if helmet enabled):**
```
content-security-policy: default-src 'self'; script-src 'self'; ...
x-content-type-options: nosniff
x-frame-options: DENY
```

## 🔄 Rollback Tests

### 8. SQL Rollback (if needed)

**Test: Can revert RLS policy changes**

```sql
-- To revert profiles RLS, drop new policies:
DROP POLICY IF EXISTS "Users can view own profile or org members" ON public.profiles;

-- Then re-apply previous policy (not recommended - prefer forward fixes)
```

**Recommended:** Apply new migration to fix issues, don't manually revert.

### 9. Code Rollback

**Test: Can revert via Git/GitHub**

```bash
# In GitHub
git revert <commit-hash>
git push origin main
```

**CI:** Automatically redeploys reverted version.

### 10. CI Action Removal

**Test: Remove security gate if blocking legitimate deployment**

**Steps:**
1. Edit `.github/workflows/security.yml`
2. Comment out or remove problematic check
3. Push to trigger new workflow run

**⚠️ Warning:** Only do this if absolutely necessary and with security team approval.

## ✅ Checklist Before Deployment

- [ ] All database SECURITY DEFINER functions have `SET search_path = public`
- [ ] RLS tests pass (users see correct data)
- [ ] Twilio webhooks reject invalid signatures
- [ ] CI blocks `ALLOW_INSECURE_TWILIO_WEBHOOKS=true` in production
- [ ] Admin routes protected (server-side `/admin-check` validates)
- [ ] Admin UI shows blank/redirects for non-admins
- [ ] CSP headers present (if enabled)
- [ ] Load testing completed (if scheduled)
- [ ] Security dashboard accessible (admin only)

## 📊 Automated Tests

These tests run automatically in CI:
- ✅ Pre-deploy security check (`.github/workflows/security.yml`)
- ✅ Conditional hooks scan
- ✅ Database function search_path validation
- ✅ Build verification
- ✅ Smoke tests
- ✅ CodeQL security scanning

## 🚨 Emergency Procedures

If acceptance tests fail:
1. **DO NOT DEPLOY** to production
2. Review failure in test logs
3. Fix issue in development
4. Re-run tests until all pass
5. Document issue in incident log

See: `INCIDENT_RESPONSE_PLAN.md` for detailed procedures.

---

**Last Updated**: 2025-10-14  
**Test Owner**: QA + Security Team  
**Run Frequency**: Before every production deployment

