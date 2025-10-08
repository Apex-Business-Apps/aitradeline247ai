-- Create call_logs table for tracking all voice calls
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  call_sid TEXT NOT NULL UNIQUE,
  from_e164 TEXT NOT NULL,
  to_e164 TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_sec INTEGER,
  mode TEXT CHECK (mode IN ('llm', 'bridge')),
  pickup_mode TEXT,
  ring_attempted BOOLEAN DEFAULT false,
  ring_seconds INTEGER,
  human_answered BOOLEAN DEFAULT false,
  handoff BOOLEAN DEFAULT false,
  handoff_reason TEXT,
  status TEXT NOT NULL DEFAULT 'initiated',
  recording_url TEXT,
  transcript_url TEXT,
  transcript TEXT,
  summary TEXT,
  captured_fields JSONB DEFAULT '{}'::jsonb,
  capture_completeness INTEGER DEFAULT 0,
  fail_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's calls
CREATE POLICY "Org members can view call logs"
  ON public.call_logs FOR SELECT
  USING (is_org_member(organization_id));

-- Service role can manage all call logs (for webhooks)
CREATE POLICY "Service role can manage call logs"
  ON public.call_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for fast lookups
CREATE INDEX idx_call_logs_org_id ON public.call_logs(organization_id);
CREATE INDEX idx_call_logs_call_sid ON public.call_logs(call_sid);
CREATE INDEX idx_call_logs_started_at ON public.call_logs(started_at DESC);
CREATE INDEX idx_call_logs_status ON public.call_logs(status);

-- Create voice config table for org settings
CREATE TABLE IF NOT EXISTS public.voice_config (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id),
  pickup_mode TEXT NOT NULL DEFAULT 'immediate' CHECK (pickup_mode IN ('immediate', 'after_rings', 'never')),
  rings_before_pickup INTEGER DEFAULT 2 CHECK (rings_before_pickup BETWEEN 1 AND 6),
  pickup_seconds INTEGER GENERATED ALWAYS AS (rings_before_pickup * 5) STORED,
  llm_enabled BOOLEAN DEFAULT true,
  llm_voice TEXT DEFAULT 'alloy',
  llm_speaking_rate NUMERIC DEFAULT 1.0 CHECK (llm_speaking_rate BETWEEN 0.5 AND 2.0),
  llm_max_reply_seconds INTEGER DEFAULT 15 CHECK (llm_max_reply_seconds BETWEEN 5 AND 30),
  system_prompt TEXT,
  amd_enable BOOLEAN DEFAULT true,
  ring_target TEXT,
  max_ring_reroutes INTEGER DEFAULT 3,
  ringback_tone TEXT DEFAULT 'default',
  fail_open BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on voice_config
ALTER TABLE public.voice_config ENABLE ROW LEVEL SECURITY;

-- Org members can view their voice config
CREATE POLICY "Org members can view voice config"
  ON public.voice_config FOR SELECT
  USING (is_org_member(organization_id));

-- Admins can update voice config
CREATE POLICY "Admins can update voice config"
  ON public.voice_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

-- Service role full access
CREATE POLICY "Service role can manage voice config"
  ON public.voice_config FOR ALL
  USING (auth.role() = 'service_role');

-- Create voice config audit log
CREATE TABLE IF NOT EXISTS public.voice_config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  changes JSONB NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_config_audit ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view voice config audit"
  ON public.voice_config_audit FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

-- Service role can insert audit entries
CREATE POLICY "Service role can insert voice config audit"
  ON public.voice_config_audit FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Create index
CREATE INDEX idx_voice_config_audit_org ON public.voice_config_audit(organization_id, created_at DESC);

-- Create twilio_numbers table
CREATE TABLE IF NOT EXISTS public.twilio_numbers (
  phone_e164 TEXT PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  friendly_name TEXT,
  voice_url TEXT,
  voice_status_callback TEXT,
  sms_url TEXT,
  capabilities JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.twilio_numbers ENABLE ROW LEVEL SECURITY;

-- Org members can view their numbers
CREATE POLICY "Org members can view twilio numbers"
  ON public.twilio_numbers FOR SELECT
  USING (is_org_member(organization_id));

-- Admins can manage numbers
CREATE POLICY "Admins can manage twilio numbers"
  ON public.twilio_numbers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

-- Service role full access
CREATE POLICY "Service role can manage twilio numbers"
  ON public.twilio_numbers FOR ALL
  USING (auth.role() = 'service_role');