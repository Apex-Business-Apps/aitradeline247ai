# Release Guardrails — v2.0.0

## Change Freeze

The following areas are **LOCKED** for v2.0.0 release. Do not modify without explicit approval.

### 1. Do Not Touch Headers/Backgrounds

**Affected Components**:
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/sections/HeroRoiDuo.tsx`
- Any CSS files affecting global backgrounds

**Rationale**: Visual consistency verified; changes risk breaking mobile layouts.

**Exception Process**: Requires approval from Design + QA + Mobile teams.

---

### 2. Do Not Add Onboarding Routes

**Protected Routes**:
- `/onboarding/*` (except `/onboarding/number`)

**Approved Route**: `/onboarding/number` ONLY

**Rationale**: Single entry point for number attachment ensures predictable user flow and evidence tracking.

**What's Blocked**:
- New onboarding steps
- Multi-step wizards
- Alternate onboarding paths

**Exception Process**: Requires Product + Ops approval and updated smoke tests.

---

### 3. Do Not Buy/Port Numbers

**Blocked Operations**:
- Twilio number purchase via API
- Number porting workflows
- Hosted SMS setup (requires external LOA)

**Allowed Operations**:
- Attach existing Twilio numbers via `/onboarding/number`
- Update webhooks on existing numbers
- View number status in Twilio Console

**Rationale**: Release focuses on attach-only flow; purchasing/porting adds regulatory complexity.

**Future Work**: Schedule for v2.1.0 with proper LOA templates and carrier approval flow.

---

### 4. Evidence Dashboard as Go/No-Go Gate

**Required Before Deploy**:
- All 3 tiles on `/ops/twilio-evidence` must be GREEN
- SMS round-trip < 30 seconds
- Voice callbacks firing successfully
- No 4xx/5xx errors in edge function logs

**Evidence Dashboard Tiles**:
1. SMS Inbound (last 15 min)
2. SMS Delivered Status (last 15 min)
3. Voice Answer + Status Callbacks (last 15 min)

**Rationale**: Evidence-first operations ensure production reliability.

**Deployment Blocker**: Any red tile = deployment HALTED until resolved.

---

## Enforcement

- **Code Review**: PRs modifying protected areas require dual approval
- **Automated Checks**: CI/CD blocks changes to protected file paths
- **Smoke Tests**: Must pass before any production deployment
- **Rollback Plan**: Documented in `docs/ops/smoke-v2.0.0.md`

## Expiration

These guardrails apply through v2.0.0 release and first 7 days of production monitoring. Review for v2.1.0 planning.

## Questions

Contact Ops team before attempting changes to protected areas.
