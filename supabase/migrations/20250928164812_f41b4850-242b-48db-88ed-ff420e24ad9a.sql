alter table if exists org_users enable row level security;
alter table if exists org_users force row level security;

-- Drop existing policies first
drop policy if exists org_users_select_self on org_users;
drop policy if exists org_users_manage_by_admin on org_users;
drop policy if exists org_users_update_by_admin on org_users;
drop policy if exists org_users_delete_by_admin on org_users;

-- Only the signed-in user can see their own membership rows
create policy org_users_select_self
on org_users for select
to authenticated
using (user_id = auth.uid());

-- Owners/Admins can manage members within their org
create policy org_users_manage_by_admin
on org_users for insert
to authenticated
with check (
  exists (
    select 1 from org_users me
    where me.org_id = org_users.org_id
      and me.user_id = auth.uid()
      and me.role in ('owner','admin')
  )
);

create policy org_users_update_by_admin
on org_users for update
to authenticated
using (
  exists (
    select 1 from org_users me
    where me.org_id = org_users.org_id
      and me.user_id = auth.uid()
      and me.role in ('owner','admin')
  )
);

create policy org_users_delete_by_admin
on org_users for delete
to authenticated
using (
  exists (
    select 1 from org_users me
    where me.org_id = org_users.org_id
      and me.user_id = auth.uid()
      and me.role in ('owner','admin')
  )
);