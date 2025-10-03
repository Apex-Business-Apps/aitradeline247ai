
-- Remove security definer view (linter error 0010_security_definer_view)
-- This view is unused and bypasses RLS policies, creating a security risk.
-- Proper access is handled via security definer functions:
--   - get_appointments_summary() for non-PII data
--   - get_org_appointments_secure() for masked PII data
--   - get_customer_contact_info() for admin-only full PII access

DROP VIEW IF EXISTS public.appointments_safe CASCADE;

-- Add comment to document the removal
COMMENT ON TABLE public.appointments IS 
'Use security functions for safe access:
- get_appointments_summary(org_id, limit) for summary view
- get_org_appointments_secure(org_id, limit) for masked PII
- get_customer_contact_info(appointment_id) for admin-only full access';
