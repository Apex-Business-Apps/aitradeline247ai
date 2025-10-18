-- Create twilio_subaccounts table
CREATE TABLE IF NOT EXISTS public.twilio_subaccounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  subaccount_sid TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create twilio_messaging_services table
CREATE TABLE IF NOT EXISTS public.twilio_messaging_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  subaccount_sid TEXT,
  messaging_service_sid TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.twilio_subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twilio_messaging_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for twilio_subaccounts
CREATE POLICY "Admins can view twilio_subaccounts"
  ON public.twilio_subaccounts
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage twilio_subaccounts"
  ON public.twilio_subaccounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for twilio_messaging_services
CREATE POLICY "Admins can view twilio_messaging_services"
  ON public.twilio_messaging_services
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage twilio_messaging_services"
  ON public.twilio_messaging_services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_twilio_subaccounts_tenant ON public.twilio_subaccounts(tenant_id);
CREATE INDEX idx_twilio_messaging_services_tenant ON public.twilio_messaging_services(tenant_id);

-- Add trigger for updated_at
CREATE TRIGGER update_twilio_subaccounts_updated_at
  BEFORE UPDATE ON public.twilio_subaccounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_twilio_messaging_services_updated_at
  BEFORE UPDATE ON public.twilio_messaging_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
