-- DevOps SRE: Security Hardening - SET search_path (Minimal Safe Version)
-- Ensures SECURITY DEFINER functions have SET search_path to prevent schema injection

-- Fix update_updated_at_column (this function exists on most tables)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Add security documentation
COMMENT ON FUNCTION public.update_updated_at_column() IS 
  'DevOps SRE 2025-10-13: SET search_path = public prevents schema injection attacks in SECURITY DEFINER functions';