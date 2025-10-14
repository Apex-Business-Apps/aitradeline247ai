-- Security Hotfix: RLS + SECURITY DEFINER search_path
-- Idempotent security hardening for TradeLine 24/7

-- ============================================================
-- Helper: share_org(user_a, user_b) -> bool
-- ============================================================
-- Returns true if both users share at least one org via 
-- organization_members(user_id, org_id)

CREATE OR REPLACE FUNCTION public.share_org(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members ma
    JOIN organization_members mb ON mb.org_id = ma.org_id
    WHERE ma.user_id = user_a
      AND mb.user_id = user_b
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.share_org(uuid, uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.share_org(uuid, uuid) IS 
  'Security definer function to check if two users share at least one organization. Used in RLS policies to avoid infinite recursion.';