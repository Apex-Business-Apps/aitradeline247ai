alter table if exists support_tickets enable row level security;
alter table if exists support_tickets force row level security;

-- Drop any prior policies referencing undefined functions
drop policy if exists "Admins can manage support tickets" on support_tickets;

-- Deny all by default; service role only via API
drop policy if exists "Service role can manage all support tickets" on support_tickets;
create policy "Service role manage"
on support_tickets for all
to service_role
using (true) with check (true);