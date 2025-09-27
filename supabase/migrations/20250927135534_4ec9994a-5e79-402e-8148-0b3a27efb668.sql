-- Tighten RLS on profiles to prevent public or overly broad access
-- 1) Helper function: check if two users share at least one organization
create or replace function public.share_org(_user_a uuid, _user_b uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m1
    join public.organization_members m2
      on m1.org_id = m2.org_id
    where m1.user_id = _user_a
      and m2.user_id = _user_b
  );
$$;

-- 2) Replace overly permissive SELECT policy on profiles
--    Remove admin-wide access; allow only owner or same-organization members
drop policy if exists "Users can view own profile, admins can view all" on public.profiles;

-- Ensure RLS is enabled (no-op if already enabled)
alter table public.profiles enable row level security;

-- Allow users to select their own profile
create policy "profiles_select_self"
  on public.profiles
  for select
  using (id = auth.uid());

-- Allow users to view profiles of users who share at least one organization
create policy "profiles_select_same_org"
  on public.profiles
  for select
  using (
    public.share_org(auth.uid(), id)
  );

-- Keep existing self-update policy intact; do not broaden UPDATE/INSERT/DELETE
-- Default-deny remains for any other access
