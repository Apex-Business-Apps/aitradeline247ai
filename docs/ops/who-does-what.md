# Who Does What — Release v2.0.0

## Operations

**Responsibilities**:
- Attach 3 client numbers via `/onboarding/number`
- Confirm all four webhooks configured on existing Twilio numbers
- Capture evidence screenshots (see `release/EVIDENCE_REQUEST.md`)
- Verify green tiles on `/ops/twilio-evidence` after each attachment
- Perform smoke tests (SMS + Voice) per `docs/ops/smoke-v2.0.0.md`

**Deliverables**:
- [ ] 3 numbers attached with PN SIDs documented
- [ ] Evidence screenshots in `release/evidence-v2.0.0/`
- [ ] Smoke test results logged

## Development

**Responsibilities**:
- Monitor Supabase edge function logs for errors
- Verify no 4xx or 5xx responses after number attachments
- Review database query performance
- Fix any bugs discovered during smoke tests
- Ensure CORS headers and auth gates functioning

**Deliverables**:
- [ ] Edge function logs clean (no errors)
- [ ] Database queries optimized
- [ ] Any hotfixes deployed if needed

## Mobile

**Responsibilities**:
- Confirm Capacitor configuration:
  - `server.url = "https://tradeline247ai.com"`
  - `cleartext = false` (HTTPS enforced)
- Verify configuration in both `capacitor.config.ts` and platform-specific configs
- Perform build sanity check (Android)
- Test app installation and basic navigation

**Deliverables**:
- [ ] Capacitor config verified
- [ ] Android build compiles successfully
- [ ] App opens to correct production URL

## Marketing (James Plofino)

**Responsibilities**:
- Upload feature graphic (1024×500) to Play Console
- Upload ≥2 phone screenshots (real device captures)
- Upload 512×512 app icon to Play Console
- Write store listing copy (no "salesy" language; human, empathic tone)
- Ensure contact info and privacy policy links are correct

**Deliverables**:
- [ ] Feature graphic uploaded
- [ ] Phone screenshots uploaded
- [ ] App icon uploaded
- [ ] Store listing text approved and saved
- [ ] Play Console listing marked as ready

## Support

**Point of Contact**: info@tradeline247ai.com  
**Helpline**: +1 587-742-8885

## Escalation

Any blocker or critical issue → notify all teams immediately via shared channel.
