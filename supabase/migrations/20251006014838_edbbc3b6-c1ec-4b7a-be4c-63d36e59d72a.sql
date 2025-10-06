-- Campaign Management Tables and Policies

-- Create unsubscribes table
CREATE TABLE IF NOT EXISTS public.unsubscribes (
  email TEXT NOT NULL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  source TEXT DEFAULT 'email_link'
);

-- Enable RLS on unsubscribes
ALTER TABLE public.unsubscribes ENABLE ROW LEVEL SECURITY;

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  consent_basis_filter TEXT[] NOT NULL DEFAULT ARRAY['express']::TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create campaign_members table
CREATE TABLE IF NOT EXISTS public.campaign_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

-- Enable RLS on campaign_members
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON public.campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON public.campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_status ON public.campaign_members(status);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON public.unsubscribes(email);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for campaigns updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create v_sendable_members view
CREATE OR REPLACE VIEW public.v_sendable_members AS
SELECT 
  cm.id AS member_id,
  cm.campaign_id,
  cm.lead_id,
  l.email,
  l.name,
  l.company,
  c.subject,
  c.body_template,
  c.organization_id
FROM public.campaign_members cm
JOIN public.leads l ON cm.lead_id = l.id
JOIN public.campaigns c ON cm.campaign_id = c.id
WHERE cm.status = 'pending'
  AND l.email IS NOT NULL
  AND l.email NOT IN (SELECT email FROM public.unsubscribes);

-- RLS Policies for unsubscribes
CREATE POLICY "Service role can manage unsubscribes"
  ON public.unsubscribes
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can insert unsubscribe"
  ON public.unsubscribes
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for campaigns
CREATE POLICY "Service role can manage campaigns"
  ON public.campaigns
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view org campaigns"
  ON public.campaigns
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND is_org_member(organization_id)
  );

CREATE POLICY "Admins can create org campaigns"
  ON public.campaigns
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    AND is_org_member(organization_id)
  );

CREATE POLICY "Admins can update org campaigns"
  ON public.campaigns
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND is_org_member(organization_id)
  );

-- RLS Policies for campaign_members
CREATE POLICY "Service role can manage campaign_members"
  ON public.campaign_members
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view org campaign_members"
  ON public.campaign_members
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.campaigns c 
      WHERE c.id = campaign_id 
      AND is_org_member(c.organization_id)
    )
  );

-- Grant access to view
GRANT SELECT ON public.v_sendable_members TO authenticated;
GRANT SELECT ON public.v_sendable_members TO service_role;