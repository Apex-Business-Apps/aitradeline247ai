-- Fix security definer view warning by adding organization membership check
-- This ensures the view respects access control even as a security definer

DROP VIEW IF EXISTS appointments_safe;

CREATE OR REPLACE VIEW appointments_safe AS
SELECT 
  a.id,
  a.organization_id,
  a.start_at,
  a.end_at,
  a.status,
  a.source,
  a.tz,
  a.note,
  a.created_at,
  -- Boolean flags instead of actual data
  (a.email IS NOT NULL) as has_email,
  (a.e164 IS NOT NULL) as has_phone,
  (a.first_name IS NOT NULL) as has_name
FROM public.appointments a
-- Add organization membership check directly in the view
WHERE a.organization_id IS NOT NULL 
  AND is_org_member(a.organization_id);

-- Grant access to authenticated users
GRANT SELECT ON appointments_safe TO authenticated;

-- Add comment explaining security model
COMMENT ON VIEW appointments_safe IS 
'Safe view of appointments without PII. Includes org membership check to respect access control.';