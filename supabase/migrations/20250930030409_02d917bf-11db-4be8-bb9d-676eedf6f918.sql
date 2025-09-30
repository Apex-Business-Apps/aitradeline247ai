
-- Add RLS policies for retention_policies table
-- This table was missing policies after cleanup

-- Organization members can view their org's retention policies
CREATE POLICY "Organization members can view retention policies"
ON public.retention_policies
FOR SELECT
TO authenticated
USING (is_org_member(org_id));

-- Only admins can update retention policies
CREATE POLICY "Admins can update retention policies"
ON public.retention_policies
FOR UPDATE
TO authenticated
USING (
  is_org_member(org_id) 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  is_org_member(org_id) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Service role can manage retention policies
CREATE POLICY "Service role can manage retention policies"
ON public.retention_policies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
