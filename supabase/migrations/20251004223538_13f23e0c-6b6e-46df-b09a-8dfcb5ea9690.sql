-- Fix profiles table RLS policies to prevent unauthorized access
-- Drop the ineffective blocking policy
DROP POLICY IF EXISTS "profiles_block_anonymous" ON public.profiles;

-- Drop the current policy that might allow unauthorized access
DROP POLICY IF EXISTS "profiles_secure_select_restricted" ON public.profiles;

-- Create a new, explicit policy that only allows:
-- 1. Users to view their own profile (must be authenticated)
-- 2. Admins to view all profiles (must be authenticated)
CREATE POLICY "Users can only view own profile or admin can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (id = auth.uid()) OR 
  (public.has_role(auth.uid(), 'admin'::app_role))
);

-- Ensure the self-update policy is properly restricted
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;

CREATE POLICY "Users can only update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());