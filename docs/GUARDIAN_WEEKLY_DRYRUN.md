# Guardian Weekly — Dry Run

## Local Testing
Run the report generator locally without committing to the repository.

## Commands
```bash
# Using npm script (if configured)
npm run report:guardian

# Direct execution
node scripts/reporting/generate_guardian_report.mjs --dry-run
```

## Output
- **Path**: `docs/guardian/weekly/_DRYRUN_YYYY-MM-DD_HHMM.md`
- **Format**: Same as production reports with `_DRYRUN_` prefix
- **Behavior**: Creates report file but does not commit to git

## What Gets Checked
- All production endpoints on both apex and www domains
- Response times and HTTP status codes
- Sample content for `.sha256` files

## Use Cases
- Testing the reporter before enabling scheduled runs
- Investigating current system health manually
- Validating endpoint changes before deployment
- Debugging report generation issues

## Notes
- Dry run output files are gitignored by pattern `_DRYRUN_*`
- Safe to run multiple times without conflicts
- Uses same logic as production scheduler
