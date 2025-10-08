-- Prompt G: Integrity & idempotency guards

-- Voice Stream Logs (Prompt C)
CREATE TABLE IF NOT EXISTS public.voice_stream_logs (
  call_sid TEXT PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  elapsed_ms INTEGER,
  fell_back BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SMS Reply Logs (Prompt D)
CREATE TABLE IF NOT EXISTS public.sms_reply_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_sid TEXT NOT NULL,
  from_e164 TEXT NOT NULL,
  to_e164 TEXT NOT NULL,
  body TEXT,
  source TEXT NOT NULL DEFAULT 'twilio',
  external_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source, external_id)
);

-- SMS Status Logs (Prompt D)
CREATE TABLE IF NOT EXISTS public.sms_status_logs (
  message_sid TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Twilio Endpoints (Prompt E)
CREATE TABLE IF NOT EXISTS public.twilio_endpoints (
  number_e164 TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  phone_sid TEXT NOT NULL,
  subaccount_sid TEXT,
  voice_url TEXT NOT NULL,
  sms_url TEXT NOT NULL,
  call_status_callback TEXT NOT NULL,
  sms_status_callback TEXT NOT NULL,
  stream_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messaging Compliance (Prompt H - A2P tracking)
CREATE TABLE IF NOT EXISTS public.messaging_compliance (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id),
  brand_sid TEXT,
  campaign_sid TEXT,
  messaging_service_sid TEXT,
  a2p_status TEXT NOT NULL DEFAULT 'not_started',
  us_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Twilio Buy Number Logs (Prompt F)
CREATE TABLE IF NOT EXISTS public.twilio_buy_number_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  number_e164 TEXT NOT NULL,
  phone_sid TEXT NOT NULL,
  subaccount_sid TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.voice_stream_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_reply_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twilio_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messaging_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twilio_buy_number_logs ENABLE ROW LEVEL SECURITY;

-- Service role only for webhooks (Prompt G)
CREATE POLICY "Service role can manage voice_stream_logs" ON public.voice_stream_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage sms_reply_logs" ON public.sms_reply_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage sms_status_logs" ON public.sms_status_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage twilio_endpoints" ON public.twilio_endpoints
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage messaging_compliance" ON public.messaging_compliance
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage twilio_buy_number_logs" ON public.twilio_buy_number_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Org-scoped policies for UI (Prompt G)
CREATE POLICY "Admins can view org voice_stream_logs" ON public.voice_stream_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view org sms_reply_logs" ON public.sms_reply_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view org sms_status_logs" ON public.sms_status_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view org twilio_endpoints" ON public.twilio_endpoints
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

CREATE POLICY "Admins can view org messaging_compliance" ON public.messaging_compliance
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

CREATE POLICY "Admins can view org twilio_buy_number_logs" ON public.twilio_buy_number_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

-- Create indexes for performance
CREATE INDEX idx_sms_reply_logs_created ON public.sms_reply_logs(created_at DESC);
CREATE INDEX idx_sms_status_logs_updated ON public.sms_status_logs(updated_at DESC);
CREATE INDEX idx_voice_stream_logs_created ON public.voice_stream_logs(created_at DESC);
CREATE INDEX idx_twilio_buy_number_logs_created ON public.twilio_buy_number_logs(created_at DESC);
CREATE INDEX idx_twilio_endpoints_org ON public.twilio_endpoints(organization_id);