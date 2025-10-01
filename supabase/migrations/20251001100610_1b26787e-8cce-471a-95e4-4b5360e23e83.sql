-- Fix profiles table RLS policies to prevent unauthorized data access
-- Drop existing potentially permissive policies
DROP POLICY IF EXISTS "profiles_select_own_org_admins" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;

-- Create a single, clear policy for profile access
-- Users can only see their own profile
-- Admins can see profiles of users in their shared organizations
CREATE POLICY "profiles_secure_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can see their own profile
  (id = auth.uid())
  OR
  -- Admins can see profiles in shared organizations
  (
    public.has_role(auth.uid(), 'admin'::app_role) 
    AND public.share_org(auth.uid(), id)
  )
);

-- Ensure no anonymous access is possible
-- This policy explicitly blocks unauthenticated users
CREATE POLICY "profiles_block_anonymous"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Verify RLS is enabled (it should be already)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;