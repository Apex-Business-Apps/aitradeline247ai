# GitHub Preflight — Configuration Complete

## ✅ Completed (Files Created)

### GH-4: Code Scanning
- ✅ Created `.github/workflows/codeql.yml` (JavaScript/TypeScript, weekly + push/PR)
- 📝 **Manual:** Enable "Secret scanning" and "Push protection" in Settings → Code security

### GH-5: Dependabot
- ✅ Created `.github/dependabot.yml` (npm weekly, github-actions weekly)
- 📝 **Manual:** Enable "Dependabot alerts" and "Dependabot security updates" in Settings → Code security

### GH-6: CI Gates
- ✅ Created `.github/workflows/ci.yml` with jobs: `ci/build`, `ci/test`, `ci/lint`
- ✅ Existing: `synthetic-smoke` (already created)

### GH-7: Releases
- ✅ Created `.github/workflows/release.yml` (tag-driven, generates SHA256, includes evidence links)

### GH-8: CODEOWNERS
- ✅ Created `.github/CODEOWNERS` (assigns @apex-business-systems to all paths)

### GH-9: PR / Issue Templates
- ✅ Created `.github/pull_request_template.md` (ops-ready checklist)
- ✅ Created `.github/ISSUE_TEMPLATE/bug_report.md`
- ✅ Created `.github/ISSUE_TEMPLATE/feature_request.md`
- ✅ Created `.github/ISSUE_TEMPLATE/ops_incident.md` (CallSid/MessageSid/Debugger link)

### GH-10: Security & Support Documentation
- ✅ Created `SECURITY.md` (security@tradeline247ai.com, 48h triage, coordinated disclosure)
- ✅ Created `SUPPORT.md` (escalation ladder, diagnostic steps, contact info)

---

## 📋 Manual Configuration Required (GitHub UI)

### GH-0: Preflight Detection
- 📝 **Repo slug:** `apex-business-systems/tradeline247` (verify in Settings)
- 📝 **Default branch:** `main` (verify in Settings → Default branch)

### GH-1: Repository Settings
Navigate to **Settings → General**:
- 📝 Set **Description:** "TradeLine 24/7 — AI-powered 24/7 receptionist with Twilio voice, SMS, and realtime WebSocket streaming"
- 📝 Set **Website:** `https://tradeline247ai.com`
- 📝 Add **Topics:** `ai-receptionist`, `twilio`, `supabase`, `realtime`, `websocket`, `saas`
- 📝 **Disable:** Wiki, Projects
- 📝 **Enable:** Discussions (for support)
- 📝 **Enable:** "Require linear history" under Pull Requests

### GH-2: Branch Protection (main)
Navigate to **Settings → Branches → Add rule** for `main`:
- 📝 **Require pull request reviews before merging** (1 approving review)
- 📝 **Dismiss stale pull request approvals when new commits are pushed**
- 📝 **Require status checks to pass before merging:**
  - `ci/build`
  - `ci/test`
  - `ci/lint`
  - `synthetic-smoke`
- 📝 **Require signed commits** (optional, only if GPG is set up)
- 📝 **Include administrators** (enforce for everyone)
- 📝 **Restrict who can push to matching branches** (admins only)

### GH-3: Actions & Environments
Navigate to **Settings → Actions → General**:
- 📝 **Actions permissions:** "Allow GitHub Actions" + "Allow actions created by GitHub and verified creators"

Navigate to **Settings → Environments**:
- 📝 Create **staging** environment (no required reviewers)
- 📝 Create **production** environment:
  - Required reviewers: `apex-business-systems` + 1 fallback
  - Deployment branches: `main` only
  - Environment secrets: add sensitive secrets here (not repo-level)
- 📝 **Concurrency:** Enable "Prevent concurrent deployments" for production

### GH-4: Code Security (Additional)
Navigate to **Settings → Code security**:
- 📝 **Enable:** Dependency graph
- 📝 **Enable:** Dependabot alerts
- 📝 **Enable:** Dependabot security updates
- 📝 **Enable:** Private vulnerability reporting
- 📝 **Enable:** Secret scanning
- 📝 **Enable:** Push protection

---

## 🧪 Acceptance Checklist

### Required Status Checks (Before Merge to Main)
- [ ] `ci/build` — passing
- [ ] `ci/test` — passing
- [ ] `ci/lint` — passing
- [ ] `synthetic-smoke` — passing (already runs every 5 minutes)

### Release Flow (Tag v*)
- [ ] Push tag `v1.0.0` → workflow creates GitHub Release
- [ ] Release includes:
  - `release.tar.gz`
  - `release.tar.gz.sha256`
  - Links to `/ops/twilio-evidence` and latest `synthetic-smoke` run
  - Installation instructions

### Security Verification
- [ ] CodeQL enabled and scanning weekly + on push/PR
- [ ] Secret scanning enabled (alerts on accidental commits)
- [ ] Push protection enabled (blocks secret commits)
- [ ] Dependabot alerts enabled (weekly PRs for npm + github-actions)

### Documentation Access
- [ ] `SECURITY.md` visible in repo root (shows "Security" tab in GitHub)
- [ ] `SUPPORT.md` accessible (linked from README or issues)
- [ ] PR template appears automatically when creating new PRs
- [ ] Issue templates appear when creating new issues (Bug, Feature, Ops Incident)

### CODEOWNERS Enforcement
- [ ] Pull requests automatically request review from `@apex-business-systems`
- [ ] Changes to `.github/` require approval from CODEOWNERS

---

## 🔗 Quick Links (After Manual Setup)

- **Settings:** `https://github.com/apex-business-systems/tradeline247/settings`
- **Branch Protection:** `https://github.com/apex-business-systems/tradeline247/settings/branches`
- **Actions:** `https://github.com/apex-business-systems/tradeline247/settings/actions`
- **Environments:** `https://github.com/apex-business-systems/tradeline247/settings/environments`
- **Code Security:** `https://github.com/apex-business-systems/tradeline247/settings/security_analysis`
- **Dependabot:** `https://github.com/apex-business-systems/tradeline247/network/updates`

---

## 📸 Evidence Screenshots (Post-Setup)

Once manual configuration is complete, capture:
1. **Branch protection rules** (Settings → Branches)
2. **Actions policy** (Settings → Actions → General)
3. **Environments** (Settings → Environments → production)
4. **Code security enabled** (Settings → Code security)
5. **Latest release** (Releases page showing tarball + SHA256)
6. **Dependabot PRs** (Pull requests page after first weekly run)

---

## 🚀 Next Steps

1. **Manual Setup** (15 minutes):
   - Configure repository settings (GH-1)
   - Set up branch protection (GH-2)
   - Create environments (GH-3)
   - Enable security features (GH-4)

2. **Test Workflows** (5 minutes):
   - Create a test PR → verify all 4 status checks run
   - Merge PR → verify synthetic-smoke continues running every 5 minutes
   - Push tag `v0.1.0` → verify release workflow creates GitHub Release

3. **Verify Security** (5 minutes):
   - Check CodeQL has run at least once
   - Verify Secret scanning is active
   - Wait for first Dependabot PR (Monday mornings)

4. **Document Evidence** (5 minutes):
   - Take screenshots per "Evidence Screenshots" section above
   - Verify `/ops/twilio-evidence` link works in release notes
   - Confirm `SECURITY.md` appears in "Security" tab

---

**Status:** Files created ✅ | Manual UI configuration required 📝
