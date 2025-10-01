# Guardian Weekly — Rollback

## Immediate Disable (Soft Kill)
To stop scheduled runs without removing code:

1. Edit `.github/workflows/guardian-weekly.yml`
2. Set `GUARDIAN_WEEKLY_ENABLED: "false"`
3. Commit and push to main branch

```yaml
env:
  GUARDIAN_WEEKLY_ENABLED: "false"  # Change from "true"
```

## Permanent Removal (Hard Kill)
To completely remove the Guardian Weekly feature:

1. Delete `.github/workflows/guardian-weekly.yml`
2. Optionally delete `scripts/reporting/generate_guardian_report.mjs`
3. Create PR for review
4. Merge to main branch

## Preserving Audit Trail
**Recommended**: Keep documentation files for historical reference:
- `docs/GUARDIAN_WEEKLY_ENABLE.md`
- `docs/GUARDIAN_WEEKLY_DRYRUN.md`
- `docs/GUARDIAN_WEEKLY_ROLLBACK.md`
- `docs/guardian/weekly/*.md` (generated reports)

## Emergency Rollback
If the workflow causes issues:

1. Immediately disable via GitHub UI:
   - Navigate to Actions → Guardian Weekly Report
   - Click "..." menu → Disable workflow
2. Follow soft kill procedure above
3. Investigate root cause from generated reports

## Verifying Rollback
- Check GitHub Actions UI to confirm no scheduled runs
- Verify no new reports appear in `docs/guardian/weekly/`
- Monitor for any residual automated commits

## Re-enabling
To re-enable after rollback:
1. Set `GUARDIAN_WEEKLY_ENABLED: "true"`
2. Or restore the deleted workflow file
3. Test with manual trigger before relying on schedule
