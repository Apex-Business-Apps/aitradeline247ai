# Legal Pages & Security

## Overview
Legal compliance pages and security disclosure setup for Canadian business requirements.

## Files Created
- `src/routes/privacy.tsx` - Privacy policy page (PIPEDA/CASL compliant)
- `src/routes/terms.tsx` - Terms of service page  
- `public/.well-known/security.txt` - Security contact info (RFC 9116)

## Pages

### Privacy Policy (`/privacy`)
- PIPEDA compliance statements
- CASL consent requirements
- Data collection/usage disclosure
- Contact: info@tradeline247ai.com

### Terms of Service (`/terms`)
- Canadian law governance (Alberta provincial)
- Service description with CASL/PIPEDA compliance
- Liability limitations under Canadian law
- Business contact information

### Security Disclosure (`/.well-known/security.txt`)
- Security contact: info@tradeline247ai.com
- Policy link placeholder
- Follows RFC 9116 standard

## Integration
These routes should be added to your router:
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
- Consider bilingual versions (French) for Quebec operations
- Regular content review recommended (annual)

## Updates
Update dates in files when content changes:
- Last updated dates in component headers
- Review business contact information quarterly