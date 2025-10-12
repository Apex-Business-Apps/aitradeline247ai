-- Create twilio_port_orders table to track comprehensive porting workflow
CREATE TABLE IF NOT EXISTS public.twilio_port_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  port_order_sid TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending-loa',
  authorized_person TEXT NOT NULL,
  current_carrier TEXT,
  contact_email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  legal_address TEXT NOT NULL,
  subaccount_sid TEXT,
  bill_upload_url TEXT,
  fallback_e164 TEXT,
  
  -- LOA tracking
  loa_signed_at TIMESTAMPTZ,
  loa_document_url TEXT,
  
  -- Port timing
  estimated_foc_date TIMESTAMPTZ,
  actual_foc_date TIMESTAMPTZ,
  port_completed_at TIMESTAMPTZ,
  
  -- Temporary forwarding during port
  temporary_did TEXT,
  temporary_forwarding_active BOOLEAN DEFAULT false,
  temporary_forwarding_removed_at TIMESTAMPTZ,
  
  -- Pre-provisioning
  webhook_config JSONB DEFAULT '{}'::jsonb,
  pre_provisioned BOOLEAN DEFAULT false,
  
  -- Trust Hub & A2P
  trust_hub_profile_sid TEXT,
  a2p_brand_sid TEXT,
  a2p_campaign_sid TEXT,
  
  -- Port data from Twilio
  port_data JSONB DEFAULT '{}'::jsonb,
  
  -- Test verification
  test_call_verified_at TIMESTAMPTZ,
  test_sms_verified_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.twilio_port_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view twilio_port_orders"
  ON public.twilio_port_orders
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage twilio_port_orders"
  ON public.twilio_port_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_port_orders_tenant ON public.twilio_port_orders(tenant_id);
CREATE INDEX idx_port_orders_phone ON public.twilio_port_orders(phone_number);
CREATE INDEX idx_port_orders_status ON public.twilio_port_orders(status);
CREATE INDEX idx_port_orders_foc_date ON public.twilio_port_orders(estimated_foc_date);

-- Add trigger for updated_at
CREATE TRIGGER update_twilio_port_orders_updated_at
  BEFORE UPDATE ON public.twilio_port_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
