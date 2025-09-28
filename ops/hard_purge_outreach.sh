#!/bin/bash
# Run only if legacy outreach files exist; safe to re-run.

echo "Purging legacy outreach files..."

# Remove old outreach libs if they exist
git rm -f server/outreach/sms.mjs || true
git rm -f server/outreach/whatsapp.mjs || true
git rm -f server/telephony.status.mjs || true

# Remove old route files if they exist
git rm -f server/routes/outreach.legacy.mjs || true
git rm -f server/routes/webhooks.legacy.mjs || true

# Remove old UI files if they exist
git rm -f src/components/outreach/ || true
git rm -f src/pages/OutreachLegacy.tsx || true

# Remove old docs if they exist
git rm -f docs/outreach-old.md || true

echo "Legacy outreach files purged. Run 'git status' to see what was removed."
echo "Remember to commit the changes if any files were removed."