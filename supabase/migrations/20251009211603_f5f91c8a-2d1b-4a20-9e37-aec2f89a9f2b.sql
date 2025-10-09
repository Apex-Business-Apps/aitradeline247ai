-- Business profiles table for storing organization business information
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Edmonton',
  service_area TEXT,
  hours JSONB NOT NULL DEFAULT '{}',
  booking_rules JSONB NOT NULL DEFAULT '{}',
  brand_voice JSONB NOT NULL DEFAULT '{"formality": "professional", "tone": "friendly", "tempo": "moderate", "dont_say": [], "do_say": []}',
  faq JSONB NOT NULL DEFAULT '[]',
  escalation JSONB NOT NULL DEFAULT '{}',
  compliance JSONB NOT NULL DEFAULT '{"consent_script_version": "v1"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Org members can view their business profile
CREATE POLICY "Org members can view business profile"
  ON public.business_profiles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.org_id = business_profiles.organization_id
    AND m.user_id = auth.uid()
  ));

-- Admins can update business profile
CREATE POLICY "Admins can update business profile"
  ON public.business_profiles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.organization_members m WHERE m.org_id = business_profiles.organization_id AND m.user_id = auth.uid())
  );

-- Admins can insert business profile
CREATE POLICY "Admins can insert business profile"
  ON public.business_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
    AND EXISTS (SELECT 1 FROM public.organization_members m WHERE m.org_id = business_profiles.organization_id AND m.user_id = auth.uid())
  );

-- Service role full access
CREATE POLICY "Service role can manage business profiles"
  ON public.business_profiles
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add description column to voice_presets if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'voice_presets' AND column_name = 'description') THEN
    ALTER TABLE public.voice_presets ADD COLUMN description TEXT;
  END IF;
END $$;

-- Insert default presets (only if they don't exist)
INSERT INTO public.voice_presets (id, label, description, system_prompt, voice, speaking_rate, max_reply_seconds) 
VALUES
('professional', 'Professional & Warm', 'Standard business receptionist', 
'You are the receptionist for {BusinessName}. Be professional yet warm. Capture caller details, book appointments, and transfer to {HumanNumberE164} when needed. Keep responses under 15 seconds.',
'nova', 1.0, 15),

('concierge', 'Luxury Concierge', 'High-end, attentive service',
'You are the executive assistant for {BusinessName}. Be exceptionally attentive and sophisticated. Prioritize white-glove service. Transfer VIP requests to {HumanNumberE164}.',
'shimmer', 0.9, 18),

('technical', 'Technical Support', 'IT/tech-focused',
'You are technical support for {BusinessName}. Be clear and methodical. Gather: issue description, error messages, system details. Escalate to {HumanNumberE164} for complex issues.',
'onyx', 1.0, 20)
ON CONFLICT (id) DO NOTHING;