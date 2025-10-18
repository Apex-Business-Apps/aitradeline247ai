-- Create table for phone number to tenant mappings
CREATE TABLE IF NOT EXISTS public.tenant_phone_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  twilio_number_sid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  number_type TEXT NOT NULL DEFAULT 'voice', -- 'voice', 'sms', 'both'
  provisioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(twilio_number_sid),
  UNIQUE(tenant_id, phone_number)
);

-- Create usage counters table for billing
CREATE TABLE IF NOT EXISTS public.tenant_usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone_mapping_id UUID NOT NULL REFERENCES public.tenant_phone_mappings(id) ON DELETE CASCADE,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  voice_minutes_inbound INTEGER NOT NULL DEFAULT 0,
  voice_minutes_outbound INTEGER NOT NULL DEFAULT 0,
  sms_count_inbound INTEGER NOT NULL DEFAULT 0,
  sms_count_outbound INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, phone_mapping_id, billing_period_start)
);

-- Create detailed usage log for audit trail
CREATE TABLE IF NOT EXISTS public.tenant_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone_mapping_id UUID NOT NULL REFERENCES public.tenant_phone_mappings(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL, -- 'voice_inbound', 'voice_outbound', 'sms_inbound', 'sms_outbound'
  quantity NUMERIC NOT NULL, -- minutes for voice, count for sms
  call_sid TEXT,
  message_sid TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_phone_mappings_tenant ON public.tenant_phone_mappings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_phone_mappings_phone ON public.tenant_phone_mappings(phone_number);
CREATE INDEX IF NOT EXISTS idx_usage_counters_tenant_period ON public.tenant_usage_counters(tenant_id, billing_period_start);
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant ON public.tenant_usage_logs(tenant_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_call_sid ON public.tenant_usage_logs(call_sid) WHERE call_sid IS NOT NULL;

-- Function to get or create current billing period counter
CREATE OR REPLACE FUNCTION public.get_or_create_usage_counter(
  p_tenant_id UUID,
  p_phone_mapping_id UUID,
  p_occurred_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_counter_id UUID;
BEGIN
  -- Calculate billing period (monthly, starting on 1st)
  v_period_start := DATE_TRUNC('month', p_occurred_at);
  v_period_end := v_period_start + INTERVAL '1 month';
  
  -- Get or create counter for this period
  INSERT INTO public.tenant_usage_counters (
    tenant_id,
    phone_mapping_id,
    billing_period_start,
    billing_period_end
  ) VALUES (
    p_tenant_id,
    p_phone_mapping_id,
    v_period_start,
    v_period_end
  )
  ON CONFLICT (tenant_id, phone_mapping_id, billing_period_start) 
  DO UPDATE SET last_updated_at = NOW()
  RETURNING id INTO v_counter_id;
  
  RETURN v_counter_id;
END;
$$;

-- Function to log voice usage and update counters
CREATE OR REPLACE FUNCTION public.log_voice_usage(
  p_tenant_id UUID,
  p_phone_number TEXT,
  p_call_sid TEXT,
  p_direction TEXT, -- 'inbound' or 'outbound'
  p_duration_seconds INTEGER,
  p_occurred_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone_mapping_id UUID;
  v_counter_id UUID;
  v_minutes NUMERIC;
BEGIN
  -- Get phone mapping
  SELECT id INTO v_phone_mapping_id
  FROM public.tenant_phone_mappings
  WHERE tenant_id = p_tenant_id AND phone_number = p_phone_number
  LIMIT 1;
  
  IF v_phone_mapping_id IS NULL THEN
    RAISE EXCEPTION 'Phone mapping not found for tenant % and number %', p_tenant_id, p_phone_number;
  END IF;
  
  -- Calculate minutes (round up)
  v_minutes := CEIL(p_duration_seconds / 60.0);
  
  -- Get or create counter for current period
  v_counter_id := public.get_or_create_usage_counter(p_tenant_id, v_phone_mapping_id, p_occurred_at);
  
  -- Update counter
  IF p_direction = 'inbound' THEN
    UPDATE public.tenant_usage_counters
    SET voice_minutes_inbound = voice_minutes_inbound + v_minutes,
        last_updated_at = NOW()
    WHERE id = v_counter_id;
  ELSE
    UPDATE public.tenant_usage_counters
    SET voice_minutes_outbound = voice_minutes_outbound + v_minutes,
        last_updated_at = NOW()
    WHERE id = v_counter_id;
  END IF;
  
  -- Log usage
  INSERT INTO public.tenant_usage_logs (
    tenant_id,
    phone_mapping_id,
    usage_type,
    quantity,
    call_sid,
    occurred_at
  ) VALUES (
    p_tenant_id,
    v_phone_mapping_id,
    'voice_' || p_direction,
    v_minutes,
    p_call_sid,
    p_occurred_at
  );
END;
$$;

-- Function to log SMS usage and update counters
CREATE OR REPLACE FUNCTION public.log_sms_usage(
  p_tenant_id UUID,
  p_phone_number TEXT,
  p_message_sid TEXT,
  p_direction TEXT, -- 'inbound' or 'outbound'
  p_occurred_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone_mapping_id UUID;
  v_counter_id UUID;
BEGIN
  -- Get phone mapping
  SELECT id INTO v_phone_mapping_id
  FROM public.tenant_phone_mappings
  WHERE tenant_id = p_tenant_id AND phone_number = p_phone_number
  LIMIT 1;
  
  IF v_phone_mapping_id IS NULL THEN
    RAISE EXCEPTION 'Phone mapping not found for tenant % and number %', p_tenant_id, p_phone_number;
  END IF;
  
  -- Get or create counter for current period
  v_counter_id := public.get_or_create_usage_counter(p_tenant_id, v_phone_mapping_id, p_occurred_at);
  
  -- Update counter
  IF p_direction = 'inbound' THEN
    UPDATE public.tenant_usage_counters
    SET sms_count_inbound = sms_count_inbound + 1,
        last_updated_at = NOW()
    WHERE id = v_counter_id;
  ELSE
    UPDATE public.tenant_usage_counters
    SET sms_count_outbound = sms_count_outbound + 1,
        last_updated_at = NOW()
    WHERE id = v_counter_id;
  END IF;
  
  -- Log usage
  INSERT INTO public.tenant_usage_logs (
    tenant_id,
    phone_mapping_id,
    usage_type,
    quantity,
    message_sid,
    occurred_at
  ) VALUES (
    p_tenant_id,
    v_phone_mapping_id,
    'sms_' || p_direction,
    1,
    p_message_sid,
    p_occurred_at
  );
END;
$$;

-- RLS Policies for tenant_phone_mappings
ALTER TABLE public.tenant_phone_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all phone mappings"
  ON public.tenant_phone_mappings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org members can view own mappings"
  ON public.tenant_phone_mappings FOR SELECT
  USING (is_org_member(tenant_id));

CREATE POLICY "Service role can manage phone mappings"
  ON public.tenant_phone_mappings FOR ALL
  USING (auth.role() = 'service_role'::text);

-- RLS Policies for tenant_usage_counters
ALTER TABLE public.tenant_usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all usage counters"
  ON public.tenant_usage_counters FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org members can view own usage"
  ON public.tenant_usage_counters FOR SELECT
  USING (is_org_member(tenant_id));

CREATE POLICY "Service role can manage usage counters"
  ON public.tenant_usage_counters FOR ALL
  USING (auth.role() = 'service_role'::text);

-- RLS Policies for tenant_usage_logs
ALTER TABLE public.tenant_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all usage logs"
  ON public.tenant_usage_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org members can view own usage logs"
  ON public.tenant_usage_logs FOR SELECT
  USING (is_org_member(tenant_id));

CREATE POLICY "Service role can manage usage logs"
  ON public.tenant_usage_logs FOR ALL
  USING (auth.role() = 'service_role'::text);