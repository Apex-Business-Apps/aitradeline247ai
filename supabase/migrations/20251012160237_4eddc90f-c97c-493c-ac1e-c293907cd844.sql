-- Billing events table for idempotent webhook processing
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on event_id to prevent duplicate processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_event_id ON public.billing_events(event_id);

-- Partial index for pending events (faster queries)
CREATE INDEX IF NOT EXISTS idx_billing_events_pending ON public.billing_events(processing_status, received_at) 
WHERE processing_status IN ('pending', 'failed');

-- Index for event type lookups
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON public.billing_events(event_type, received_at DESC);

-- Billing invoices table
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID,
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  billing_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_stripe_id ON public.billing_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer ON public.billing_invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_user ON public.billing_invoices(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_invoices_org ON public.billing_invoices(organization_id) WHERE organization_id IS NOT NULL;

-- Billing payments table
CREATE TABLE IF NOT EXISTS public.billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  payment_method TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_stripe_id ON public.billing_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_customer ON public.billing_payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_user ON public.billing_payments(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_payments_org ON public.billing_payments(organization_id) WHERE organization_id IS NOT NULL;

-- RLS policies for billing_events (admin only)
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage billing_events"
  ON public.billing_events
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view billing_events"
  ON public.billing_events
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for billing_invoices
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage billing_invoices"
  ON public.billing_invoices
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own invoices"
  ON public.billing_invoices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org invoices"
  ON public.billing_invoices
  FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- RLS policies for billing_payments
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage billing_payments"
  ON public.billing_payments
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own payments"
  ON public.billing_payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org payments"
  ON public.billing_payments
  FOR SELECT
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billing_invoices_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

CREATE TRIGGER update_billing_payments_updated_at
  BEFORE UPDATE ON public.billing_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();