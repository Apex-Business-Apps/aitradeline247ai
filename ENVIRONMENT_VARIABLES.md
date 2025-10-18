# Environment Variables Guide - TradeLine 24/7

This document lists all environment variables used in the application and their security implications.

## 📋 Required Variables

### Frontend (Public - Safe to expose)
| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://hysvqdwmhxnblxfqnszn.supabase.co` | ✅ Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJhbGci...` | ✅ Yes |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | `hysvqdwmhxnblxfqnszn` | ✅ Yes |

### Backend (Secrets - Never expose to frontend)
| Variable | Purpose | Security Level | Required |
|----------|---------|----------------|----------|
| `TWILIO_AUTH_TOKEN` | Twilio webhook signature validation | 🔴 Critical | ✅ Yes (if using Twilio) |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | 🟡 Moderate | ✅ Yes (if using Twilio) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin access | 🔴 Critical | ✅ Yes (edge functions) |

## 🔒 Security-Sensitive Variables

### ALLOW_INSECURE_TWILIO_WEBHOOKS
**⚠️ CRITICAL SECURITY VARIABLE**

- **Purpose**: Bypass Twilio webhook signature validation
- **Default**: `false` (must not be set in production)
- **Development**: May be `true` only in local dev
- **Production**: **MUST BE `false` OR NOT SET**

**Security Impact:**
- ✅ `false` or unset: Webhooks validated via HMAC-SHA1
- ❌ `true` in production: **BLOCKS DEPLOYMENT** via CI/CD

**Deployment Guard:**
```bash
# CI/CD will FAIL if this is true in production
if [ "$NODE_ENV" = "production" ] && [ "$ALLOW_INSECURE_TWILIO_WEBHOOKS" = "true" ]; then
  echo "❌ SECURITY: Deployment blocked"
  exit 1
fi
```

### TWILIO_IP_ALLOWLIST (Optional)
- **Purpose**: Defense-in-depth IP filtering for Twilio webhooks
- **Format**: Comma-separated IP addresses
- **Example**: `54.172.60.0,54.244.51.0,54.171.127.192`
- **Required**: No (optional additional security layer)

**Security Note:**
- Primary security is HMAC signature validation
- IP allowlist is secondary defense
- Twilio IPs may change - verify at: https://www.twilio.com/docs/usage/webhooks/ip-addresses

## 🚀 Deployment Environments

### Local Development
```bash
NODE_ENV=development
ALLOW_INSECURE_TWILIO_WEBHOOKS=true  # OK for local dev
TWILIO_AUTH_TOKEN=your_dev_token
```

### Staging
```bash
NODE_ENV=staging
ALLOW_INSECURE_TWILIO_WEBHOOKS=false  # Must be false
TWILIO_AUTH_TOKEN=your_staging_token
TWILIO_IP_ALLOWLIST=54.172.60.0,54.244.51.0
```

### Production
```bash
NODE_ENV=production
# ALLOW_INSECURE_TWILIO_WEBHOOKS must NOT be set or must be false
TWILIO_AUTH_TOKEN=your_prod_token
TWILIO_IP_ALLOWLIST=54.172.60.0,54.244.51.0,54.171.127.192
```

## 🔍 Security Validation

### Pre-deployment Checks
Run before every deployment:
```bash
bash scripts/predeploy-security.sh
```

This script verifies:
1. ✅ `ALLOW_INSECURE_TWILIO_WEBHOOKS` is not `true` in production
2. ✅ Required variables are set
3. ✅ IP allowlist format is valid
4. ✅ Twilio auth token is configured

### CI/CD Gates
GitHub Actions automatically runs security gates:
- `.github/workflows/security.yml` - Pre-deploy security check
- Blocks merge if insecure configuration detected
- Validates all environment variables

## 📝 Adding New Variables

When adding a new environment variable:

1. **Determine Sensitivity**:
   - Public (VITE_*): Safe to expose in frontend
   - Secret: Keep in backend only (edge functions)

2. **Document It**:
   - Add to this file
   - Note security implications
   - Provide example value

3. **Update Validation**:
   - Add to `scripts/predeploy-security.sh` if required
   - Update CI/CD workflows if needed

4. **Set in Environments**:
   - Local: `.env` file (gitignored)
   - Supabase Edge Functions: Project secrets
   - GitHub Actions: Repository secrets

## 🛡️ Security Best Practices

1. **Never commit secrets** to version control
2. **Use different keys** for dev/staging/prod
3. **Rotate secrets** regularly (quarterly minimum)
4. **Audit access** to production secrets
5. **Monitor usage** via logging and alerts

## 📚 References

- [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [Twilio Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Last Updated**: 2025-10-14  
**Maintained By**: DevOps + Security Team  
**Review Schedule**: Monthly
