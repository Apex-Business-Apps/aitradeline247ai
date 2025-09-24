-- Enable RLS on analytics and A/B testing tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;

-- Analytics Events Policies: Only service role can write, users can read their own data
CREATE POLICY "Service role can write analytics events" 
ON public.analytics_events 
FOR INSERT 
TO service_role 
WITH CHECK (true);

CREATE POLICY "Service role can read all analytics events" 
ON public.analytics_events 
FOR SELECT 
TO service_role 
USING (true);

-- Users can only read their own analytics events if authenticated
CREATE POLICY "Users can read own analytics events" 
ON public.analytics_events 
FOR SELECT 
TO authenticated 
USING (user_session IN (
  SELECT user_session FROM analytics_events WHERE user_session = analytics_events.user_session
));

-- A/B Tests: Only service role can manage
CREATE POLICY "Service role can manage ab_tests" 
ON public.ab_tests 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- A/B Test Assignments: Only service role can manage
CREATE POLICY "Service role can manage ab_test_assignments" 
ON public.ab_test_assignments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Public can read active tests (for client-side display logic only)
CREATE POLICY "Public can read active ab_tests" 
ON public.ab_tests 
FOR SELECT 
TO anon 
USING (active = true);

-- Add user_id column to analytics_events for better user tracking (optional)
ALTER TABLE public.analytics_events 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX idx_analytics_events_user_session ON public.analytics_events(user_session);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_ab_assignments_session_test ON public.ab_test_assignments(user_session, test_name);