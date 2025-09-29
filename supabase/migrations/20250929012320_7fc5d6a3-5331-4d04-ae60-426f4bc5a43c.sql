-- Fix security vulnerability in appointments table RLS policies
-- Remove public access when organization_id is NULL

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Organization members can manage their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Organization members can view their appointments" ON public.appointments;

-- Create secure RLS policies that require organization membership
-- Users can only access appointments for organizations they belong to
CREATE POLICY "Organization members can view appointments" 
ON public.appointments 
FOR SELECT 
USING (
  organization_id IS NOT NULL 
  AND is_org_member(organization_id)
);

CREATE POLICY "Organization members can insert appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  organization_id IS NOT NULL 
  AND is_org_member(organization_id)
);

CREATE POLICY "Organization members can update appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  organization_id IS NOT NULL 
  AND is_org_member(organization_id)
)
WITH CHECK (
  organization_id IS NOT NULL 
  AND is_org_member(organization_id)
);

CREATE POLICY "Organization members can delete appointments" 
ON public.appointments 
FOR DELETE 
USING (
  organization_id IS NOT NULL 
  AND is_org_member(organization_id)
);

-- Keep service role policy for system operations
-- Service role can manage appointments (already exists)

-- Add data validation trigger to ensure organization_id is always set
CREATE OR REPLACE FUNCTION validate_appointment_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure organization_id is not NULL for new appointments
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Appointments must be associated with an organization';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce organization_id requirement
DROP TRIGGER IF EXISTS ensure_appointment_organization ON public.appointments;
CREATE TRIGGER ensure_appointment_organization
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_organization();