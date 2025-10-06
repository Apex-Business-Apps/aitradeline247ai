-- Fix SECURITY DEFINER View Warning for v_sendable_members
-- Apply the same security settings that were used for appointments_safe

-- PostgreSQL 15+ feature: security_invoker makes view use caller's permissions
-- security_barrier prevents query planner from leaking data around security predicates

ALTER VIEW public.v_sendable_members
  SET (security_invoker = true, security_barrier = true);

-- Add explanatory comment
COMMENT ON VIEW public.v_sendable_members IS 
  'View of campaign members eligible for sending. Uses security_invoker to respect caller RLS policies instead of owner privileges. Filters out unsubscribed emails and only shows pending members.';

-- Verification note:
-- This ensures the view respects the caller's permissions and RLS policies
-- rather than running with elevated owner privileges which could bypass security