-- RLS Policies for Org Data (tenant isolation)
alter table if exists orgs enable row level security;
alter table if exists org_settings enable row level security;
alter table if exists subscriptions enable row level security;

-- Org users mapping table
create table if not exists org_users (
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null,            -- Supabase auth uid
  role text not null check (role in ('owner','admin','member')) default 'owner',
  primary key (org_id, user_id),
  created_at timestamptz default now()
);
alter table org_users enable row level security;

-- RLS Policies for orgs table
drop policy if exists orgs_select on orgs;
create policy orgs_select on orgs for select using (
  exists (select 1 from org_users ou where ou.org_id=orgs.id and ou.user_id=auth.uid())
);

drop policy if exists orgs_update on orgs;
create policy orgs_update on orgs for update using (
  exists (select 1 from org_users ou where ou.org_id=orgs.id and ou.user_id=auth.uid() and ou.role in ('owner','admin'))
);

-- RLS Policies for org_settings table  
drop policy if exists settings_select on org_settings;
create policy settings_select on org_settings for select using (
  exists (select 1 from org_users ou where ou.org_id=org_settings.organization_id and ou.user_id=auth.uid())
);

drop policy if exists settings_update on org_settings;
create policy settings_update on org_settings for update using (
  exists (select 1 from org_users ou where ou.org_id=org_settings.organization_id and ou.user_id=auth.uid() and ou.role in ('owner','admin'))
);

-- RLS Policies for subscriptions table
drop policy if exists subs_select on subscriptions;
create policy subs_select on subscriptions for select using (
  exists (select 1 from org_users ou where ou.org_id=subscriptions.org_id and ou.user_id=auth.uid())
);