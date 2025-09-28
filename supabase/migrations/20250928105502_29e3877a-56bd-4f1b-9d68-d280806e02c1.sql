-- Audit Log System
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  user_id uuid,
  org_id uuid,
  action text not null,
  target text,
  payload jsonb
);
create index if not exists idx_audit_org_ts on audit_logs(org_id, ts desc);