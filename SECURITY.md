# Security Policy

## Reporting a Vulnerability

**TradeLine 24/7** takes security seriously. We appreciate responsible disclosure of security vulnerabilities.

### Contact

**Email:** security@tradeline247ai.com  
**Response Time:** We aim to triage reports within **48 hours**.

### Coordinated Disclosure

1. **Report privately** to security@tradeline247ai.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

2. **Do not disclose publicly** until we've had a chance to address the issue.

3. We will:
   - Acknowledge receipt within 48 hours
   - Provide an estimated timeline for a fix
   - Credit you in release notes (unless you prefer to remain anonymous)
   - Coordinate public disclosure timing

### Scope

Security issues include but are not limited to:
- Authentication/authorization bypasses
- Data exposure or leaks
- SQL injection, XSS, CSRF
- Twilio webhook signature bypass
- PII encryption failures
- Session hijacking

### Out of Scope

- Social engineering attacks on staff
- Physical attacks on infrastructure
- Denial of service (DoS) attacks
- Issues in third-party dependencies (report to the dependency maintainers first)

## Security Features

- **Encryption at rest:** AES-256
- **Encryption in transit:** TLS 1.3
- **Row-level security:** All database tables
- **Webhook signature verification:** All Twilio webhooks
- **Regular security audits:** Automated and manual

## Contact

**Apex Business Systems**  
**Phone:** +1-587-742-8885  
**Email:** info@tradeline247ai.com  
**Address:** Edmonton, AB, Canada

