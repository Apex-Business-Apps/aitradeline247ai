-- Create twilio_hosted_sms_orders table to track Hosted SMS requests
CREATE TABLE IF NOT EXISTS public.twilio_hosted_sms_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  order_sid TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending-loa',
  contact_email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  legal_address TEXT NOT NULL,
  subaccount_sid TEXT,
  order_data JSONB DEFAULT '{}'::jsonb,
  submission_id TEXT,
  loa_signed_at TIMESTAMPTZ,
  verification_completed_at TIMESTAMPTZ,
  messaging_service_added_at TIMESTAMPTZ,
  test_sms_sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.twilio_hosted_sms_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view twilio_hosted_sms_orders"
  ON public.twilio_hosted_sms_orders
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage twilio_hosted_sms_orders"
  ON public.twilio_hosted_sms_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_hosted_sms_orders_tenant ON public.twilio_hosted_sms_orders(tenant_id);
CREATE INDEX idx_hosted_sms_orders_phone ON public.twilio_hosted_sms_orders(phone_number);
CREATE INDEX idx_hosted_sms_orders_status ON public.twilio_hosted_sms_orders(status);

-- Add trigger for updated_at
CREATE TRIGGER update_twilio_hosted_sms_orders_updated_at
  BEFORE UPDATE ON public.twilio_hosted_sms_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
