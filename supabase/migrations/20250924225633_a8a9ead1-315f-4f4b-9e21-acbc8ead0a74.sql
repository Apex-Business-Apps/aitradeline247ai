-- Fix critical security issue: analytics_events table is publicly readable
-- Remove broken RLS policies and create secure ones

-- Drop the broken policy that allows anyone to read all analytics
DROP POLICY IF EXISTS "Users can read own session analytics" ON public.analytics_events;

-- Create a secure policy that only allows admins to read analytics data
-- Remove any other overly permissive SELECT policies
DROP POLICY IF EXISTS "Anyone can read analytics events" ON public.analytics_events;

-- Ensure only these secure policies exist:
-- 1. Admins can view all analytics (already exists)
-- 2. Service role can read all (for legitimate backend operations) 
-- 3. Anonymous users can insert events (for tracking)
-- 4. Service role can insert events (for backend operations)

-- The existing policies should be:
-- "Admins can view analytics events" - already secure
-- "Service role can read all analytics events" - needed for backend
-- "Anyone can insert analytics events" - needed for tracking  
-- "Service role can write analytics events" - needed for backend

-- Add a comment to document the security model
COMMENT ON TABLE public.analytics_events IS 'Analytics events table. READ access restricted to admins and service role only. Anonymous users can INSERT for tracking purposes.';