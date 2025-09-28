-- Enable RLS on audit_logs table and add policies
alter table audit_logs enable row level security;

-- RLS policy for audit_logs (admin access only)
create policy audit_logs_admin_select on audit_logs for select using (
  exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin'::app_role)
);

-- Data Retention System
create table if not exists retention_policies (
  org_id uuid primary key references orgs(id) on delete cascade,
  recordings_days int not null default 30,
  transcripts_days int not null default 90,
  email_logs_days int not null default 180,
  updated_at timestamptz default now()
);
alter table retention_policies enable row level security;

-- RLS policy for retention_policies
create policy retention_policies_select on retention_policies for select using (
  exists (select 1 from org_users ou where ou.org_id=retention_policies.org_id and ou.user_id=auth.uid())
);