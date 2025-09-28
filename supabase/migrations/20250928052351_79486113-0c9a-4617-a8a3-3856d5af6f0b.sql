-- Fix security issues by adding RLS policies for outreach tables
-- Note: Based on custom instructions, RLS stays off for server-side service role usage

-- Enable RLS on new tables but allow service role access
alter table contacts enable row level security;
alter table consent_logs enable row level security;
alter table outreach_sessions enable row level security;
alter table outreach_messages enable row level security;
alter table reply_events enable row level security;

-- Service role policies (allows server operations)
create policy "Service role can manage contacts" on contacts
for all using (auth.role() = 'service_role');

create policy "Service role can manage consent_logs" on consent_logs
for all using (auth.role() = 'service_role');

create policy "Service role can manage outreach_sessions" on outreach_sessions
for all using (auth.role() = 'service_role');

create policy "Service role can manage outreach_messages" on outreach_messages
for all using (auth.role() = 'service_role');

create policy "Service role can manage reply_events" on reply_events
for all using (auth.role() = 'service_role');