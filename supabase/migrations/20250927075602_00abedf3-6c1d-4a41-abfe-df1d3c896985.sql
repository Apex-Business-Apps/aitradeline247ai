-- Create FAQs table
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  q text not null, 
  a text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_org_idx on public.faqs(organization_id);

-- Add new columns to calls table
alter table public.calls
  add column if not exists intent text,
  add column if not exists outcome text check (outcome in ('lead','support','spam','unknown')),
  add column if not exists booked boolean default false,
  add column if not exists redacted boolean default false;

-- Create org settings table
create table if not exists public.org_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  emergency_number text,
  business_hours jsonb default '{}'::jsonb,
  language text default 'en',
  voice_id text default 'default',
  slack_webhook_url text,
  teams_webhook_url text,
  zap_outgoing_url text,
  calendly_url text,
  gcal_service jsonb,
  updated_at timestamptz not null default now()
);

-- Create blocklist numbers table
create table if not exists public.blocklist_numbers (
  phone_e164 text primary key,
  reason text,
  created_at timestamptz not null default now()
);