## Changes

<!-- Brief description of what changed -->

## React Hooks Checklist (H310-8)

- [ ] All hooks are at top-level (no conditional/looped hooks)
- [ ] No component function calls (e.g., `Component()` → use `<Component/>`)
- [ ] No early returns before hooks complete
- [ ] ESLint passes with zero hook warnings

## Evidence

- [ ] Evidence attached (links to `/ops/twilio-evidence` or test results)
- [ ] Synthetic-smoke passing ([latest run](https://github.com/apex-business-systems/tradeline247/actions/workflows/synthetic-smoke.yml))
- [ ] No new secrets in repo (all secrets go to GitHub environments)
- [ ] Store disclosure unchanged or updated (if applicable)

## Testing

<!-- How was this tested? -->

## Deployment Notes

<!-- Any special deployment considerations? -->

---

**For Ops Incidents:** Include CallSid/MessageSid, endpoint, timestamp, and [Twilio Debugger](https://console.twilio.com/us1/monitor/debugger) link.
