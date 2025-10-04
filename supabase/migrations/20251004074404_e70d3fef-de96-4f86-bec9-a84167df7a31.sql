-- =========================================================
-- FIX RLS-BYPASSING VIEW: appointments_safe
-- =========================================================
-- Make appointments_safe respect caller's RLS policies
-- instead of running with owner's privileges (which bypass RLS)

-- PG15+ feature: security_invoker makes view use caller's permissions
-- security_barrier prevents planner from leaking data around predicates

ALTER VIEW public.appointments_safe
  SET (security_invoker = true, security_barrier = true);

-- Add comment explaining the security model
COMMENT ON VIEW public.appointments_safe IS 
  'Masked view of appointments. Uses security_invoker to respect caller RLS policies (not owner privileges).';

-- Verification query (run manually to confirm):
-- SELECT relname, reloptions 
-- FROM pg_class c 
-- JOIN pg_namespace n ON n.oid = c.relnamespace 
-- WHERE c.relkind = 'v' AND c.relname = 'appointments_safe' AND n.nspname = 'public';