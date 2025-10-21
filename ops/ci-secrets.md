# CI and Preview Secrets

To keep Supabase migrations disabled by default across CI and Lovable preview environments, set the following secret:

- `SUPABASE_DEPLOY=0`

## Repository Defaults

- Document this variable in environment setup files so local contributors inherit `SUPABASE_DEPLOY=0` unless they explicitly opt in to deploying Supabase migrations.

## Lovable Preview Environment

In the Lovable preview UI, open **Environment Variables → Secrets** for the target preview and add `SUPABASE_DEPLOY` with the value `0`. This ensures preview builds run without triggering Supabase migrations.

