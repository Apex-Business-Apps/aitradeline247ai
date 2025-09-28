create extension if not exists pgcrypto;

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  e164 text not null,
  first_name text,
  email text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  tz text not null default 'America/Edmonton',
  source text not null default 'tl247',
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  note text,
  created_at timestamptz not null default now()
);
create unique index if not exists ux_appt_e164_start on appointments(e164, start_at);
create index if not exists idx_appt_start on appointments(start_at);
create index if not exists idx_appt_status on appointments(status);

create table if not exists appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  event text not null check (event in ('created','confirmed','cancelled')),
  meta jsonb,
  created_at timestamptz not null default now()
);

-- RLS off; server uses service role.