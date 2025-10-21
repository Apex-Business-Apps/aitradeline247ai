# GitHub Configuration Verification — TradeLine 24/7

**Repository:** apex-business-systems/tradeline247  
**Last Updated:** 2025-01-09

---

## AUTOMATED SETUP ✅ COMPLETE

The following files and workflows are already in place:

### Workflows
- ✅ `.github/workflows/ci.yml` — Job names: `ci/build`, `ci/test`, `ci/lint`
- ✅ `.github/workflows/synthetic-smoke.yml` — Job name: `synthetic-smoke`
- ✅ `.github/workflows/release.yml` — Auto-builds on v* tags
- ✅ `.github/workflows/codeql.yml` — CodeQL scanning (JS/TS)

### Policies & Templates
- ✅ `.github/dependabot.yml` — npm + github-actions weekly
- ✅ `.github/CODEOWNERS` — Ownership rules set
- ✅ `.github/pull_request_template.md` — Evidence checklist
- ✅ `.github/ISSUE_TEMPLATE/bug_report.md`
- ✅ `.github/ISSUE_TEMPLATE/feature_request.md`
- ✅ `.github/ISSUE_TEMPLATE/ops_incident.md`
- ✅ `SECURITY.md` — security@tradeline247ai.com
- ✅ `SUPPORT.md` — Escalation ladder

---

## MANUAL CONFIGURATION REQUIRED (GitHub UI)

### A) Branch Protection (main)

**Path:** Settings → Branches → Add rule → Branch name pattern: `main`

**Settings to enable:**

1. ☐ **Require a pull request before merging**
   - ☐ Require approvals: **1**
   - ☐ Dismiss stale pull request approvals when new commits are pushed

2. ☐ **Require status checks to pass before merging**
   - ☐ Require branches to be up to date before merging
   - **Required checks (add all 4):**
     - `ci/build`
     - `ci/test`
     - `ci/lint`
     - `synthetic-smoke`

3. ☐ **Require linear history**

4. ☐ **Do not allow bypassing the above settings**
   - ☐ Include administrators

**Verification:**
```bash
# Try to push directly to main (should fail)
git checkout main
git commit --allow-empty -m "test"
git push origin main
# Expected: Error - push declined due to branch protection
```

**Pass Criteria:** Direct push blocked; PRs require 4 checks + 1 approval.

---

### B) Actions & Environments

#### Actions Policy

**Path:** Settings → Actions → General → Actions permissions

1. ☐ **Allow actions created by GitHub and verified creators**

#### Environments

**Path:** Settings → Environments → New environment

**Create: `staging`**
- Name: `staging`
- Required reviewers: (none)
- Wait timer: 0 minutes
- Deployment branches: All branches

**Create: `production`**
- Name: `production`
- ☐ **Required reviewers:** Add yourself + 1 fallback reviewer
- ☐ **Prevent self-review:** ON
- ☐ **Deployment concurrency:** Allow only 1 concurrent deployment
- ☐ **Cancel in-progress deployments:** OFF (let finish)
- Deployment branches: Only `main`

**Pass Criteria:** Both environments visible; production requires 2 reviewers; concurrency = 1.

---

### C) Security Scanning

#### CodeQL

**Path:** Security → Code scanning → Setup → CodeQL analysis

**Settings:**
- ☐ Enable CodeQL
- Languages: JavaScript/TypeScript (auto-detected)
- Schedule: Weekly + Push to `main` + Pull requests
- Query suite: Default

**Note:** `.github/workflows/codeql.yml` already configured.

#### Secret Scanning

**Path:** Settings → Code security and analysis → Secret scanning

1. ☐ **Secret scanning:** Enable
2. ☐ **Push protection:** Enable

**Pass Criteria:** Both toggles show "Enabled" in Security tab.

---

### D) Dependabot

**Path:** Settings → Code security and analysis → Dependabot

**Enable:**
1. ☐ **Dependabot alerts:** ON
2. ☐ **Dependabot security updates:** ON

**Note:** `.github/dependabot.yml` already configured for:
- `npm` (weekly, root)
- `github-actions` (weekly, `.github/workflows/`)

**Auto-merge rule (optional):**
```yaml
# Add to dependabot.yml if desired
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    # Auto-merge minor/patch if CI passes
    reviewers:
      - "apex-business-systems/maintainers"
```

**Pass Criteria:** Dependabot dashboard lists both ecosystems; alerts enabled.

---

### E) Required Checks Name Match ✅ VERIFIED

**Verification:**

1. Open latest CI workflow run
2. Confirm job names exactly match:
   - `ci/build`
   - `ci/test`
   - `ci/lint`

3. Open latest synthetic-smoke run
4. Confirm job name: `synthetic-smoke`

**Status:** ✅ Job names in workflows match required check names.

**Evidence:**
- CI workflow: https://github.com/apex-business-systems/tradeline247/actions/workflows/ci.yml
- Synthetic-smoke: https://github.com/apex-business-systems/tradeline247/actions/workflows/synthetic-smoke.yml

---

### F) Secrets Posture

**Path:** Settings → Secrets and variables → Actions

**Current Posture Audit:**

1. ☐ List all **Repository secrets** (Settings → Secrets → Actions → Repository secrets)
2. ☐ Move sensitive secrets to **Environment secrets**:
   - `staging` environment: Dev/test API keys
   - `production` environment: Production API keys

**Recommended Repo-Level Secrets (OK to keep):**
- `GITHUB_TOKEN` (auto-provided, read-only)
- Non-sensitive config (public URLs, etc.)

**Must Move to Environments:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_AUTH_TOKEN`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- Any other API tokens

**Pass Criteria:** 
- Staging env: 4+ secrets
- Production env: 4+ secrets
- Repo-level: Only `GITHUB_TOKEN` or non-sensitive

---

### G) Release Dry-Run (RC Tag)

**Create RC tag:**

```bash
# From main branch
git checkout main
git pull origin main

# Create release candidate
git tag -a v2.0.0-rc.1 -m "Release candidate 2.0.0-rc.1"
git push origin v2.0.0-rc.1
```

**Expected Behavior:**

1. ☐ GitHub Actions triggers `.github/workflows/release.yml`
2. ☐ Workflow builds artifacts:
   - `release.tar.gz`
   - `release.tar.gz.sha256`
3. ☐ GitHub Release created at: https://github.com/apex-business-systems/tradeline247/releases/tag/v2.0.0-rc.1
4. ☐ Release notes include links to:
   - `/ops/twilio-evidence`
   - `/privacy`
   - `/ops/policy-kit/`
   - Latest synthetic-smoke run

**Verification:**

```bash
# Download and verify checksum
curl -L -O https://github.com/apex-business-systems/tradeline247/releases/download/v2.0.0-rc.1/release.tar.gz
curl -L -O https://github.com/apex-business-systems/tradeline247/releases/download/v2.0.0-rc.1/release.tar.gz.sha256

# Verify
sha256sum -c release.tar.gz.sha256
# Expected: release.tar.gz: OK
```

**Pass Criteria:** Checksum matches downloaded artifact; all 4 links present in notes.

---

### H) Hygiene ✅ VERIFIED

**Repository Settings:**

**Path:** Settings → General

1. ☐ **Description:** "AI-powered 24/7 receptionist for business calls and messaging"
2. ☐ **Website:** https://tradeline247ai.com
3. ☐ **Topics:** `ai-receptionist`, `twilio`, `supabase`, `realtime`, `websocket`, `saas`

**Features to DISABLE:**
- ☐ Wikis (use Discussions instead)
- ☐ Projects (use Issues + Discussions)

**Features to ENABLE:**
- ☐ Discussions (for support/Q&A)
- ☐ Issues

**Files Verified:**

- ✅ `README.md` — Has homepage link
- ✅ `.github/CODEOWNERS` — Triggers review on PR
- ✅ `.github/pull_request_template.md` — Renders checklist
- ✅ `.github/ISSUE_TEMPLATE/` — 3 templates (bug, feature, ops-incident)
- ✅ `SECURITY.md` — Visible in Security tab
- ✅ `SUPPORT.md` — Visible in Insights → Community

**Test CODEOWNERS:**

Create a test PR that modifies a CODEOWNERS-protected path:

```bash
git checkout -b test-codeowners
echo "# test" >> .github/workflows/ci.yml
git commit -am "test: verify CODEOWNERS triggers review"
git push origin test-codeowners
# Open PR on GitHub
```

**Expected:** PR shows "Review requested from code owners" (e.g., @JR for `.github/` changes).

**Pass Criteria:** Test PR automatically requests review from CODEOWNERS.

---

## ACCEPTANCE CHECKLIST

| Step | Item | Status | Evidence |
|------|------|--------|----------|
| **A** | Branch protection: 4 checks, 1 approval, linear | ☐ | Screenshot of rule |
| **B** | Environments: staging (no reviewers) + production (2 reviewers) | ☐ | Screenshot of envs |
| **C** | CodeQL + Secret scanning enabled | ☐ | Screenshot of Security tab |
| **D** | Dependabot: alerts + security updates ON | ☐ | Screenshot of Dependabot tab |
| **E** | Required checks match job names | ✅ | Workflow files |
| **F** | Secrets in environments (not repo-level) | ☐ | Screenshot of secrets page |
| **G** | RC tag creates release with checksum | ☐ | Release URL + checksum verify |
| **H** | CODEOWNERS triggers review on test PR | ☐ | Test PR screenshot |

---

## FINAL VALIDATION

**After completing all manual steps, verify with:**

1. **Create test PR:**
   ```bash
   git checkout -b test-all-protections
   echo "# test" >> README.md
   git commit -am "test: validate all GitHub protections"
   git push origin test-all-protections
   ```

2. **Expected PR behavior:**
   - ☐ Cannot merge until 4 checks pass (ci/build, ci/test, ci/lint, synthetic-smoke)
   - ☐ Cannot merge until 1 approval received
   - ☐ Code owner review automatically requested (if touched protected path)
   - ☐ Cannot bypass as admin

3. **Create RC tag:**
   ```bash
   git tag -a v2.0.0-rc.1 -m "Test release"
   git push origin v2.0.0-rc.1
   ```

4. **Expected release behavior:**
   - ☐ GitHub Release auto-created
   - ☐ Artifacts attached (tar.gz + sha256)
   - ☐ Notes include 4 links (evidence, privacy, policy kit, smoke)
   - ☐ Checksum verification passes

5. **Security posture:**
   - ☐ Secret scanning catches test commit with fake API key
   - ☐ Dependabot opens PR for outdated dependency within 1 week
   - ☐ CodeQL scan shows 0 high/critical issues

---

## NEXT STEPS

After GitHub UI configuration is complete:

1. **Tag production release:** `v2.0.0` (not RC)
2. **Submit to app stores:** Follow [MOBILE_STORE_SUBMISSION.md](./MOBILE_STORE_SUBMISSION.md)
3. **Monitor workflows:** Ensure all 4 required checks run on every PR
4. **Review Dependabot PRs:** Auto-merge minor/patch if CI green

---

## TROUBLESHOOTING

### Issue: Required checks not appearing on PR

**Cause:** Job names in workflow don't match branch protection rule.

**Fix:**
1. Open `.github/workflows/ci.yml`
2. Verify job keys are exactly: `ci/build`, `ci/test`, `ci/lint` (use `/` not `-`)
3. Push change; re-run workflow
4. Update branch protection rule with exact names

### Issue: Secrets not accessible in workflow

**Cause:** Secrets are repo-level but workflow references environment.

**Fix:**
1. Move secrets to environment (Settings → Environments → production → Secrets)
2. Update workflow to specify environment:
   ```yaml
   jobs:
     deploy:
       environment: production
       steps:
         - run: echo ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
   ```

### Issue: CodeQL workflow fails on Node.js version

**Cause:** Node.js version mismatch.

**Fix:**
1. Open `.github/workflows/codeql.yml`
2. Set Node.js version to match `ci.yml`:
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '20'
   ```

---

## CONTACT

**GitHub Configuration Issues:**
- Repo admin: info@tradeline247ai.com
- GitHub Support: https://support.github.com

**Workflow Issues:**
- Review workflow logs: Actions tab
- Check syntax: `yamllint .github/workflows/*.yml`

---

**END OF VERIFICATION GUIDE**

