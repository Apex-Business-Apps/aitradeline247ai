-- ONB-1: Onboarding and Billing Tables
create extension if not exists pgcrypto;

create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email_to text not null,
  target_e164 text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_orgs_email_to on orgs(lower(email_to));

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  plan text not null check (plan in ('basic','pro','enterprise')),
  status text not null check (status in ('incomplete','active','past_due','canceled','trialing')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_subs_org on subscriptions(org_id);

create table if not exists org_settings (
  org_id uuid primary key references orgs(id) on delete cascade,
  business_name text not null,
  email_recipients text[] not null default '{}',
  business_target_e164 text not null,
  updated_at timestamptz not null default now()
);