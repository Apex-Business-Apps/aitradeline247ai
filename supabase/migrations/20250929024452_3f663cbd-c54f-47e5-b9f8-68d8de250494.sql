-- Harden appointments table for PII protection: enforce non-null organization_id via trigger
-- Keep this migration idempotent and minimal.

-- 1) Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 2) Attach validation trigger to prohibit rows without organization_id
DROP TRIGGER IF EXISTS ensure_appointment_org ON public.appointments;
CREATE TRIGGER ensure_appointment_org
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_organization();
