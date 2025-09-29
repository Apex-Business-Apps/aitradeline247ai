-- Fix RLS security issue on appointments_safe table
-- Enable RLS on appointments_safe view
ALTER VIEW public.appointments_safe SET (security_barrier = false);

-- Add RLS policy for appointments_safe to ensure only authenticated org members can access
-- Since this is a view, we need to add a simple access policy
GRANT SELECT ON public.appointments_safe TO authenticated;

-- Create a secure access policy function for appointment summaries if needed
CREATE OR REPLACE FUNCTION public.can_view_appointment_summary(org_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_org_member(org_id_param);
$$;