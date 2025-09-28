# Supabase Auth Hardening

## Overview
Security configurations for Supabase Authentication to prevent weak passwords and compromised credentials.

## Required Configuration Steps

### Password Security Settings
Navigate to: **Supabase Dashboard → Authentication → Settings**

1. **Enable Password Strength Checks**
   - Toggle ON: "Password strength validation"
   - Set minimum length: ≥ 10 characters
   - Require: Numbers and symbols
   - This prevents users from setting weak passwords

2. **Enable Leaked Password Protection**
   - Toggle ON: "Leaked password protection"
   - Uses HaveIBeenPwned (HIBP) database
   - Automatically rejects passwords found in data breaches
   - Protects against credential stuffing attacks

### Authentication Flow Notes
- **Primary Method**: Magic Link authentication (recommended)
- **Secondary**: Password authentication (hardened with above settings)
- These settings only affect password-based authentication flows
- Magic Link remains unaffected and provides better security by default

## Verification Steps

### Test Password Strength
1. Attempt registration with weak password (e.g., "password123")
2. Verify rejection with appropriate error message
3. Confirm strong password acceptance (e.g., "MyStr0ng!P@ssw0rd")

### Monitor Auth Events
1. Check **Supabase Dashboard → Authentication → Logs**
2. Verify password validation events appear
3. Look for "password_strength_failed" events for rejected attempts
4. Confirm HIBP integration working for compromised passwords

## Security Benefits
- **Prevents weak passwords**: Enforces complexity requirements
- **Blocks compromised credentials**: HIBP integration stops reused breached passwords
- **Reduces account takeovers**: Makes brute force and credential stuffing harder
- **Maintains UX**: Magic Link flow remains seamless for users

## Additional Recommendations
- Consider implementing account lockout after failed attempts
- Monitor authentication logs for suspicious patterns
- Regularly review and update password policies
- Educate users on password manager usage