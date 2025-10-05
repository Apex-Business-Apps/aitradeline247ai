-- Fix profiles table RLS policy to enforce audit logging
-- Remove the 'OR true' bypass that allows admins unrestricted access

-- Drop the existing flawed policy
DROP POLICY IF EXISTS "Admins can view all profiles with audit" ON public.profiles;

-- Recreate the policy WITHOUT the 'OR true' bypass
-- This enforces that admins MUST access profiles through get_profile_secure()
-- which logs the access before returning data
CREATE POLICY "Admins must use secure function for profile access"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM public.data_access_audit
    WHERE data_access_audit.user_id = auth.uid()
      AND data_access_audit.accessed_table = 'profiles'
      AND data_access_audit.created_at > (now() - interval '1 second')
    LIMIT 1
  )
);

-- Add a helpful comment explaining the security model
COMMENT ON POLICY "Admins must use secure function for profile access" ON public.profiles IS 
'Admins can only view profiles through get_profile_secure() or profiles_safe view, which log access to data_access_audit. Direct SELECT queries will fail unless preceded by proper audit logging within 1 second.';