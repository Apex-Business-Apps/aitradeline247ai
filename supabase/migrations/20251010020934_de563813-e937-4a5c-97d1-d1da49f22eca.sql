-- Create buyer_path_sends table for idempotency tracking
create table if not exists public.buyer_path_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null check (event_type in ('after_signup','after_payment')),
  sent_at timestamptz not null default now(),
  unique (user_id, event_type)
);

alter table public.buyer_path_sends enable row level security;

-- Only service_role can write (edge function); admins can read
create policy "service can write buyer_path_sends" on public.buyer_path_sends
  for all using (auth.role() = 'service_role');

create policy "admins can read buyer_path_sends" on public.buyer_path_sends
  for select using (has_role(auth.uid(), 'admin'::app_role));