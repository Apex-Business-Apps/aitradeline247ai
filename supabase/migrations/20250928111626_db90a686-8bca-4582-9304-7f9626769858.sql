-- Support tickets table for customer support portal
create extension if not exists pgcrypto;

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open','closed'))
);

-- Enable RLS on support tickets
alter table support_tickets enable row level security;

-- Service role can manage all support tickets
create policy "Service role can manage all support tickets"
on support_tickets
for all
to service_role
using (true)
with check (true);

-- Admins can view and manage support tickets
create policy "Admins can manage support tickets"
on support_tickets
for all
to authenticated
using (has_role(auth.uid(), 'admin'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role));