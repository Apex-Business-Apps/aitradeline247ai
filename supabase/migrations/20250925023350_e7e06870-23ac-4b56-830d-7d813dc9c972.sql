-- Security Fix: Remove anonymous lead insertion and restrict to service role only
-- This ensures all lead submissions go through the secure edge function with proper validation

-- Drop the problematic anonymous insert policy
DROP POLICY IF EXISTS "Anonymous users can insert leads" ON public.leads;

-- Create a more secure policy that only allows service role to insert leads
-- This ensures all insertions go through the secure-lead-submission edge function
CREATE POLICY "Only service role can insert leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Keep existing admin policies intact for viewing and managing leads
-- "Admins can manage all leads" and "Only admins can view leads" remain unchanged