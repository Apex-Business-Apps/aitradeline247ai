# RLS Guard

## Overview
Automated CI check to prevent deployment of tables without proper Row Level Security (RLS) policies.

## Setup
- Configure a temporary Supabase branch database for CI.
- Execute scripts/sql/report_rls.sql in CI (psql or Supabase SQL API).
- Fail PR when output has rows.

## Usage
The RLS Guard workflow runs on every pull request to main branch and checks for:
- Tables without RLS enabled
- Tables with zero RLS policies
- Public schema tables that may expose sensitive data

## Manual Testing
Run the SQL query locally:
```bash
psql -h your-db-host -d postgres -f scripts/sql/report_rls.sql
```

Any output indicates tables that need RLS policies before deployment.