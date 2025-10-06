-- Add follow-up tracking for campaigns
CREATE TABLE IF NOT EXISTS public.campaign_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.campaign_members(id) ON DELETE CASCADE,
  followup_number integer NOT NULL DEFAULT 1,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  halted_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, followup_number)
);

-- Enable RLS
ALTER TABLE public.campaign_followups ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view org campaign followups"
ON public.campaign_followups
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_followups.campaign_id
    AND is_org_member(c.organization_id)
  )
);

CREATE POLICY "Service role can manage campaign followups"
ON public.campaign_followups
FOR ALL
USING (auth.role() = 'service_role');

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_campaign_followups_scheduled 
ON public.campaign_followups(scheduled_at) 
WHERE status = 'pending';

-- Add country and phone columns to leads table for easier filtering
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'country') THEN
    ALTER TABLE public.leads ADD COLUMN country text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'phone') THEN
    ALTER TABLE public.leads ADD COLUMN phone text;
  END IF;
END $$;

COMMENT ON TABLE public.campaign_followups IS 'Tracks automated follow-up emails for campaigns';