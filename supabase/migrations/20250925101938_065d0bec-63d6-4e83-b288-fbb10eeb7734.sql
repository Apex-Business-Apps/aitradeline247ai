-- TASK 3: Indexes (hot paths)
CREATE INDEX IF NOT EXISTS wl_org_created_idx    ON public.wallet_ledger(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wl_related_idx        ON public.wallet_ledger(related_type, related_id);
CREATE INDEX IF NOT EXISTS pi_org_status_idx     ON public.payment_intents(org_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS inv_org_status_idx    ON public.invoices(org_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS cc_org_created_idx    ON public.commission_charges(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wd_provider_idx       ON public.webhook_events(provider, event_type, received_at DESC);
CREATE INDEX IF NOT EXISTS outbox_org_status_idx ON public.outbox_messages(org_id, status, created_at DESC);

-- TASK 4: RLS (tenant isolation via profiles)
ALTER TABLE public.wallet_ledger       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_charges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_messages     ENABLE ROW LEVEL SECURITY;

-- Helper: get caller org (using security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.current_org_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Create RLS policies with safe pattern
DO $$ BEGIN
  -- wallet_ledger policies
  CREATE POLICY wallet_ledger_sel ON public.wallet_ledger
  FOR SELECT USING (org_id = public.current_org_id() OR public.current_org_id() IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY wallet_ledger_ins ON public.wallet_ledger
  FOR INSERT WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY wallet_ledger_upd ON public.wallet_ledger
  FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- payment_intents policies
DO $$ BEGIN
  CREATE POLICY payment_intents_sel ON public.payment_intents
  FOR SELECT USING (org_id = public.current_org_id() OR public.current_org_id() IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY payment_intents_ins ON public.payment_intents
  FOR INSERT WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY payment_intents_upd ON public.payment_intents
  FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- invoices policies
DO $$ BEGIN
  CREATE POLICY invoices_sel ON public.invoices
  FOR SELECT USING (org_id = public.current_org_id() OR public.current_org_id() IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY invoices_ins ON public.invoices
  FOR INSERT WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY invoices_upd ON public.invoices
  FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- commission_charges policies
DO $$ BEGIN
  CREATE POLICY commission_charges_sel ON public.commission_charges
  FOR SELECT USING (org_id = public.current_org_id() OR public.current_org_id() IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY commission_charges_ins ON public.commission_charges
  FOR INSERT WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY commission_charges_upd ON public.commission_charges
  FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- commission_disputes policies
DO $$ BEGIN
  CREATE POLICY commission_disputes_sel ON public.commission_disputes
  FOR SELECT USING (org_id = public.current_org_id() OR public.current_org_id() IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY commission_disputes_ins ON public.commission_disputes
  FOR INSERT WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY commission_disputes_upd ON public.commission_disputes
  FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- webhook_events policies (allow service role access)
DO $$ BEGIN
  CREATE POLICY webhook_events_sel ON public.webhook_events
  FOR SELECT USING (org_id = public.current_org_id() OR public.current_org_id() IS NULL OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY webhook_events_ins ON public.webhook_events
  FOR INSERT WITH CHECK (org_id = public.current_org_id() OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY webhook_events_upd ON public.webhook_events
  FOR UPDATE USING (org_id = public.current_org_id() OR auth.role() = 'service_role') 
  WITH CHECK (org_id = public.current_org_id() OR auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- outbox_messages policies
DO $$ BEGIN
  CREATE POLICY outbox_messages_sel ON public.outbox_messages
  FOR SELECT USING (org_id = public.current_org_id() OR public.current_org_id() IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY outbox_messages_ins ON public.outbox_messages
  FOR INSERT WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY outbox_messages_upd ON public.outbox_messages
  FOR UPDATE USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Organizations policies
DO $$ BEGIN
  CREATE POLICY organizations_sel ON public.organizations
  FOR SELECT USING (id = public.current_org_id() OR public.current_org_id() IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY organizations_ins ON public.organizations
  FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY organizations_upd ON public.organizations
  FOR UPDATE USING (id = public.current_org_id()) WITH CHECK (id = public.current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;