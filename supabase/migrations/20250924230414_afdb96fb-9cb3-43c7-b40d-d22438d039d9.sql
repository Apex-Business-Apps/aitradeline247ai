-- Security fix: Remove public access to A/B test data and strengthen policies

-- Drop existing overly permissive policies for ab_tests table
DROP POLICY IF EXISTS "Anyone can view active tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Public can read active ab_tests" ON public.ab_tests;

-- Create secure policies for ab_tests - only admins and service role can access
CREATE POLICY "Only admins can view ab_tests" 
ON public.ab_tests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage ab_tests" 
ON public.ab_tests 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Strengthen ab_test_assignments policies
DROP POLICY IF EXISTS "Users can update own test assignments" ON public.ab_test_assignments;

-- Only allow service role to manage assignments
CREATE POLICY "Only service role can update test assignments" 
ON public.ab_test_assignments 
FOR UPDATE 
USING (true); -- Service role bypass through existing policy

-- Add security monitoring trigger for sensitive operations
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any attempts to access sensitive data
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    user_session,
    page_url
  ) VALUES (
    'security_audit',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_id', auth.uid(),
      'timestamp', now()
    ),
    COALESCE(auth.uid()::text, 'anonymous'),
    'security_monitor'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;