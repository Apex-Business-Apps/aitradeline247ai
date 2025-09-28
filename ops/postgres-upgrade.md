# Postgres Minor Upgrade — Runbook
## Scope
Apply latest security patches on Postgres. Zero code changes.

## Preflight
- Confirm dev passes integration tests.
- List extensions in prod and dev; ensure parity (pgcrypto only if possible).
- Snapshot/backup both databases.

## Steps (DEV → PROD)
1) DEV: Supabase Dashboard → Upgrade Postgres (minor).
2) Run DB smoke: schema diff, RLS report, migrations apply clean.
3) PROD: Announce 30-min window; take snapshot.
4) Upgrade Postgres; run app smokes:
   - /healthz 200
   - /status.json ok:true
   - Auth sign-in + /api/settings (JWT) 200
   - Stripe webhook test (200), Twilio test call
5) Roll-forward notes: If failure, restore snapshot and open incident.

## Rollback
- Restore snapshot.
- Disable new connections if needed; re-run smokes.

## Owners
- CTO/DevOps