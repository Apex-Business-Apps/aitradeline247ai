-- TASK 0: Preflight - Check and create organizations table if needed
-- Log current user context for debugging
SELECT 
  current_user as db_user,
  current_setting('request.jwt.claims', true) as jwt_claims;

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add organization_id to profiles if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- TASK 1: Create enums (safe to re-run)
DO $$ BEGIN
  CREATE TYPE public.currency_code AS ENUM ('CAD'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('requires_payment','processing','succeeded','canceled','requires_action','failed'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ledger_entry_type AS ENUM ('top_up','authorization','capture','refund','adjustment'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft','open','paid','uncollectible','void','refunded'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.txn_type AS ENUM ('wallet_top_up','commission_charge','subscription_invoice','refund'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TASK 2: Core tables (ledger-first, idempotent)
-- Wallet ledger (source of truth)
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entry_type    public.ledger_entry_type NOT NULL,
  amount_cents  bigint NOT NULL,              -- positive for credits, negative for debits
  currency      public.currency_code NOT NULL DEFAULT 'CAD',
  related_type  text,                         -- e.g., 'call','invoice','payment_intent'
  related_id    uuid,                         -- uuid of related entity where applicable
  idempotency_key text UNIQUE,                -- prevents double posting
  memo          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid                          -- actor (may be system)
);

-- Readable balance view (per org)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.wallet_balances AS
  SELECT org_id, COALESCE(SUM(amount_cents),0)::bigint AS balance_cents
  FROM public.wallet_ledger
  GROUP BY org_id;

CREATE UNIQUE INDEX IF NOT EXISTS wallet_balances_org_idx ON public.wallet_balances(org_id);

-- Payment intents (gateway-agnostic)
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  intent_type     public.txn_type NOT NULL,
  amount_cents    bigint NOT NULL,
  currency        public.currency_code NOT NULL DEFAULT 'CAD',
  status          public.payment_status NOT NULL DEFAULT 'requires_payment',
  provider        text,                -- 'stripe','square','manual'
  provider_id     text,                -- gateway payment id
  idempotency_key text UNIQUE,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Invoices (monthly predictable, or summary docs)
CREATE TABLE IF NOT EXISTS public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  number          text UNIQUE,                 -- human-readable
  status          public.invoice_status NOT NULL DEFAULT 'draft',
  period_start    date,
  period_end      date,
  subtotal_cents  bigint NOT NULL DEFAULT 0,
  tax_cents       bigint NOT NULL DEFAULT 0,
  total_cents     bigint GENERATED ALWAYS AS (subtotal_cents + tax_cents) STORED,
  currency        public.currency_code NOT NULL DEFAULT 'CAD',
  provider        text,                        -- if mirrored in Stripe
  provider_id     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Commission charges (per qualified appointment)
CREATE TABLE IF NOT EXISTS public.commission_charges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  call_id         uuid,                        -- FK to calls table if present
  call_sid        text,                        -- Twilio SID fallback
  qualified       boolean NOT NULL DEFAULT false,
  rules_snapshot  jsonb NOT NULL DEFAULT '{}'::jsonb,  -- the 5 rules captured at charge time
  amount_cents    bigint NOT NULL,             -- normally 14900
  currency        public.currency_code NOT NULL DEFAULT 'CAD',
  ledger_entry_id uuid REFERENCES public.wallet_ledger(id),
  invoice_id      uuid REFERENCES public.invoices(id),
  idempotency_key text UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Disputes for commission
CREATE TABLE IF NOT EXISTS public.commission_disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id       uuid NOT NULL REFERENCES public.commission_charges(id) ON DELETE CASCADE,
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reason          text NOT NULL,
  status          text NOT NULL DEFAULT 'open',  -- open|approved|denied
  decision_memo   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  decided_at      timestamptz
);

-- Webhook event log (payments, invoices)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  provider      text NOT NULL,
  event_type    text NOT NULL,
  payload       jsonb NOT NULL,
  dedupe_key    text UNIQUE,      -- provider event id to avoid replays
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz
);

-- Outbox for emails/receipts (optional but handy)
CREATE TABLE IF NOT EXISTS public.outbox_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind          text NOT NULL,    -- 'receipt','invoice','dispute_update'
  to_email      text NOT NULL,
  subject       text NOT NULL,
  body_html     text,
  body_text     text,
  status        text NOT NULL DEFAULT 'queued', -- queued|sent|failed
  attempts      int NOT NULL DEFAULT 0,
  last_error    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  sent_at       timestamptz
);