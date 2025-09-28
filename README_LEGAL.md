# Legal Pages & Security

## Overview
Legal compliance pages and security disclosure setup for Canadian business requirements.

## Files Created
- `src/routes/privacy.tsx` - Privacy policy page (PIPEDA compliant)
- `src/routes/terms.tsx` - Terms of service page  
- `public/.well-known/security.txt` - Security contact info

## Pages

### Privacy Policy (`/privacy`)
- PIPEDA compliance statements
- CASL consent requirements
- Data collection/usage disclosure
- Contact: info@tradeline247ai.com

### Terms of Service (`/terms`)
- Canadian law governance
- Service description
- Liability limitations
- Business contact information

### Security Disclosure (`/.well-known/security.txt`)
- Security contact: info@tradeline247ai.com
- Responsible disclosure policy
- Scope definition

## Integration
Add these routes to your router:
```tsx
<Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />
```

## Footer Links
Update footer to include:
- Privacy Policy
- Terms of Service
- Security Contact

## Compliance Notes
- Review content with legal counsel
- Update contact information as needed
- Consider bilingual versions (French) for Quebec
- Regular content review recommended