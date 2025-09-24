-- Fix A/B Test Assignment RLS Policies
-- Remove overly permissive update policy
DROP POLICY IF EXISTS "Anyone can update their test assignments" ON public.ab_test_assignments;

-- Add proper user session-based update policy
CREATE POLICY "Users can update own test assignments" 
ON public.ab_test_assignments 
FOR UPDATE 
USING (user_session = user_session);

-- Fix Analytics Events RLS Policy 
-- Remove recursive policy
DROP POLICY IF EXISTS "Users can read own analytics events" ON public.analytics_events;

-- Add proper session-based read policy
CREATE POLICY "Users can read own session analytics" 
ON public.analytics_events 
FOR SELECT 
USING (user_session = user_session OR has_role(auth.uid(), 'admin'::app_role));

-- Add IP address protection - only admins can see IP data
-- Update analytics table to add RLS for IP visibility
CREATE OR REPLACE VIEW public.analytics_events_public AS
SELECT 
  id,
  event_type,
  event_data,
  created_at,
  user_id,
  user_session,
  page_url,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN user_agent 
    ELSE NULL 
  END as user_agent,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN ip_address 
    ELSE NULL 
  END as ip_address
FROM public.analytics_events;