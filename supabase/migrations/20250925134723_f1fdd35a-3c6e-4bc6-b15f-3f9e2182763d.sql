-- FIX: User Profile Data Security - Block Anonymous Access

-- Remove any existing permissive policies and create restrictive ones
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create secure policies that block anonymous access completely

-- 1. Block ALL anonymous access to profiles
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Authenticated users can only view their own profile
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 3. Authenticated users can only insert their own profile
CREATE POLICY "Users can create own profile only" 
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 4. Authenticated users can only update their own profile
CREATE POLICY "Users can update own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 5. Admins can view all profiles for administrative purposes
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() IS NOT NULL
);

-- 6. Add security audit trigger to log profile modifications (not SELECT operations)
DROP TRIGGER IF EXISTS audit_profile_access ON public.profiles;
CREATE TRIGGER audit_profile_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_security_event_enhanced();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;