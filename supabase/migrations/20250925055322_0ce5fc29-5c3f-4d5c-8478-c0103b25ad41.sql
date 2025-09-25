-- Security fix: Remove any public read access to analytics_events table
-- and ensure only admins and service role can read sensitive tracking data

-- Drop any existing policies that might allow public read access
DROP POLICY IF EXISTS "Public can view analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can view analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view analytics events" ON public.analytics_events;

-- Ensure we have the correct restrictive policies
-- Keep the admin and service role read policies if they exist, otherwise create them
DROP POLICY IF EXISTS "Admins can view analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can read all analytics events" ON public.analytics_events;

-- Create secure policies for reading analytics events
CREATE POLICY "Admins can view analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can read all analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Keep insert policies for analytics tracking functionality
-- Recreate insert policies to ensure they're clean
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can write analytics events" ON public.analytics_events;

CREATE POLICY "Service role can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Allow anonymous analytics event insertion through edge functions only
CREATE POLICY "Edge functions can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (auth.role() = 'anon' AND auth.jwt() IS NULL);

-- Add data retention trigger to automatically anonymize old data
CREATE OR REPLACE FUNCTION public.anonymize_old_analytics_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize IP addresses and user agents older than 7 days
  UPDATE public.analytics_events 
  SET 
    ip_address = 'anonymized',
    user_agent = 'anonymized'
  WHERE created_at < now() - interval '7 days' 
    AND (ip_address IS NOT NULL OR user_agent IS NOT NULL)
    AND ip_address != 'anonymized' 
    AND user_agent != 'anonymized';
    
  -- Delete analytics events older than 90 days
  DELETE FROM public.analytics_events 
  WHERE created_at < now() - interval '90 days';
END;
$$;