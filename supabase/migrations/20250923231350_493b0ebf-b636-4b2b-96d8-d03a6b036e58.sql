-- Fix critical security issue: Update profiles RLS policy to restrict access to own profiles only
DROP POLICY "Authenticated users can view profiles" ON public.profiles;

-- Create new restrictive policy for profile access
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);