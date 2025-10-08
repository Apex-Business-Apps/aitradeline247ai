-- Add system_prompts table for versioning
CREATE TABLE IF NOT EXISTS public.system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, name, version)
);

ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system prompts"
  ON public.system_prompts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

CREATE POLICY "Service role can manage system prompts"
  ON public.system_prompts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add consent tracking to call_logs
ALTER TABLE public.call_logs 
  ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS amd_detected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS llm_session_id TEXT;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_call_logs_consent ON public.call_logs(consent_given);
CREATE INDEX IF NOT EXISTS idx_call_logs_amd ON public.call_logs(amd_detected);