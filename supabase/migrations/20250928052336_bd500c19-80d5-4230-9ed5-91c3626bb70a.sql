-- enable uuid generation
create extension if not exists pgcrypto;

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  e164 text unique not null,
  first_name text,
  wa_capable boolean,
  created_at timestamptz not null default now()
);

create table if not exists consent_logs (
  id uuid primary key default gen_random_uuid(),
  e164 text not null,
  channel text not null check (channel in ('sms','whatsapp')),
  status text not null check (status in ('opt_in','opt_out')),
  source text,
  created_at timestamptz not null default now()
);
create index if not exists idx_consent_e164_created on consent_logs(e164, created_at desc);

create table if not exists outreach_sessions (
  id uuid primary key default gen_random_uuid(),
  call_sid text unique not null,
  e164 text not null,
  channel text check (channel in ('sms','whatsapp')),
  state text not null default 'pending' check (state in ('pending','sent','responded','expired','stopped')),
  last_sent_at timestamptz,
  followup_due_at timestamptz,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_sessions_e164_created on outreach_sessions(e164, created_at desc);
create index if not exists idx_sessions_state_due on outreach_sessions(state, followup_due_at);

create table if not exists outreach_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references outreach_sessions(id) on delete cascade,
  direction text not null check (direction in ('in','out')),
  body text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_msgs_session_created on outreach_messages(session_id, created_at);

create table if not exists reply_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references outreach_sessions(id) on delete cascade,
  signal text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_reply_session_created on reply_events(session_id, created_at);

create or replace view v_latest_consent as
select distinct on (e164, channel)
  e164, channel, status, created_at as last_change_at
from consent_logs
order by e164, channel, created_at desc;