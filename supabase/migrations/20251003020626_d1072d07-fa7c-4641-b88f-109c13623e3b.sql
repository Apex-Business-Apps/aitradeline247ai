-- ============================================================================
-- CRITICAL SECURITY FIX: Restrict Profile PII Access
-- ============================================================================
-- Issue: profiles_secure_select policy allows org members to view PII of other org members
-- Fix: Restrict to self-access and admin-only access

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "profiles_secure_select" ON public.profiles;

-- Create new restrictive policy: only self or admins can view profiles
CREATE POLICY "profiles_secure_select_restricted" 
ON public.profiles 
FOR SELECT 
USING (
  (id = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================================================
-- CRITICAL SECURITY FIX: Separate Integration Secrets from Org Settings
-- ============================================================================
-- Issue: org_settings exposes sensitive webhook URLs and credentials to all org members
-- Fix: Create separate table with admin-only access

-- Create new table for sensitive integration secrets
CREATE TABLE IF NOT EXISTS public.org_integration_secrets (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  slack_webhook_url text,
  teams_webhook_url text,
  zap_outgoing_url text,
  gcal_service jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new secrets table
ALTER TABLE public.org_integration_secrets ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy for secrets
CREATE POLICY "org_integration_secrets_admin_only" 
ON public.org_integration_secrets 
FOR ALL 
USING (
  is_org_member(organization_id) AND 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  is_org_member(organization_id) AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Service role can manage secrets (for migrations and backend operations)
CREATE POLICY "org_integration_secrets_service_role" 
ON public.org_integration_secrets 
FOR ALL 
USING (auth.role() = 'service_role');

-- Migrate existing sensitive data from org_settings to org_integration_secrets
INSERT INTO public.org_integration_secrets (
  organization_id,
  slack_webhook_url,
  teams_webhook_url,
  zap_outgoing_url,
  gcal_service
)
SELECT 
  organization_id,
  slack_webhook_url,
  teams_webhook_url,
  zap_outgoing_url,
  gcal_service
FROM public.org_settings
WHERE slack_webhook_url IS NOT NULL 
   OR teams_webhook_url IS NOT NULL 
   OR zap_outgoing_url IS NOT NULL 
   OR gcal_service IS NOT NULL
ON CONFLICT (organization_id) DO UPDATE SET
  slack_webhook_url = EXCLUDED.slack_webhook_url,
  teams_webhook_url = EXCLUDED.teams_webhook_url,
  zap_outgoing_url = EXCLUDED.zap_outgoing_url,
  gcal_service = EXCLUDED.gcal_service,
  updated_at = now();

-- Remove sensitive columns from org_settings (they're now in org_integration_secrets)
ALTER TABLE public.org_settings 
  DROP COLUMN IF EXISTS slack_webhook_url,
  DROP COLUMN IF EXISTS teams_webhook_url,
  DROP COLUMN IF EXISTS zap_outgoing_url,
  DROP COLUMN IF EXISTS gcal_service;

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_org_integration_secrets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_org_integration_secrets_updated_at
  BEFORE UPDATE ON public.org_integration_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_org_integration_secrets_updated_at();

-- Log security fix completion
INSERT INTO public.analytics_events (
  event_type,
  event_data,
  severity
) VALUES (
  'security_fix_applied',
  jsonb_build_object(
    'fix_type', 'critical_pii_access_restriction',
    'fixes', jsonb_build_array(
      'profiles_secure_select_restricted',
      'org_integration_secrets_created',
      'sensitive_data_migrated'
    ),
    'timestamp', now()
  ),
  'info'
);