-- Remove anonymous insert access for A/B test assignments
DROP POLICY IF EXISTS "Anyone can insert test assignments" ON public.ab_test_assignments;

-- Create service-role-only insert policy for A/B test assignments
CREATE POLICY "Service role can insert test assignments" 
ON public.ab_test_assignments 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Add data retention function for analytics events
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_data()
RETURNS void AS $$
BEGIN
  -- Delete analytics events older than 90 days
  DELETE FROM public.analytics_events 
  WHERE created_at < now() - interval '90 days';
  
  -- Anonymize IP addresses older than 30 days
  UPDATE public.analytics_events 
  SET ip_address = 'anonymized'
  WHERE created_at < now() - interval '30 days' 
    AND ip_address IS NOT NULL 
    AND ip_address != 'anonymized';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add session timeout tracking table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions"
ON public.user_sessions
FOR ALL
USING (auth.role() = 'service_role');

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enhanced security audit logging
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    user_session,
    page_url,
    ip_address
  ) VALUES (
    'security_audit_enhanced',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_id', auth.uid(),
      'timestamp', now(),
      'row_id', COALESCE(NEW.id, OLD.id),
      'severity', CASE 
        WHEN TG_TABLE_NAME IN ('user_roles', 'ab_tests') THEN 'high'
        WHEN TG_TABLE_NAME = 'leads' THEN 'medium'
        ELSE 'low'
      END
    ),
    COALESCE(auth.uid()::text, 'anonymous'),
    'database_operation',
    NULL
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;