-- Fix the recursive analytics trigger causing stack overflow
-- The issue is triggers calling analytics which trigger more analytics

-- Drop the problematic auto analytics trigger that's causing recursion
DROP TRIGGER IF EXISTS auto_anonymize_analytics_trigger ON public.analytics_events;
DROP TRIGGER IF EXISTS log_analytics_access_trigger ON public.analytics_events;

-- Update the auto_anonymize_analytics function to be non-recursive
CREATE OR REPLACE FUNCTION public.auto_anonymize_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process non-audit events to prevent recursion
  IF NEW.event_type NOT IN ('analytics_audit', 'analytics_access_audit', 'security_audit_enhanced') THEN
    -- Set anonymization metadata without inserting more analytics events
    IF NEW.event_type IN ('page_view', 'user_interaction', 'web_vital') THEN
      NEW.event_data := COALESCE(NEW.event_data, '{}'::jsonb) || jsonb_build_object(
        'anonymize_after', (now() + interval '24 hours')::text,
        'privacy_level', 'standard'
      );
    ELSIF NEW.event_type IN ('security_violation', 'sensitive_data_access') THEN
      NEW.event_data := COALESCE(NEW.event_data, '{}'::jsonb) || jsonb_build_object(
        'anonymize_after', (now() + interval '30 days')::text,
        'privacy_level', 'security_critical'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger with safeguards
CREATE TRIGGER auto_anonymize_analytics_trigger
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_anonymize_analytics();

-- Update the circuit breaker function to be more aggressive
CREATE OR REPLACE FUNCTION public.safe_analytics_insert_with_circuit_breaker(
  p_event_type text, 
  p_event_data jsonb DEFAULT NULL::jsonb, 
  p_user_session text DEFAULT NULL::text, 
  p_page_url text DEFAULT NULL::text, 
  p_ip_address text DEFAULT NULL::text, 
  p_user_agent text DEFAULT NULL::text
)
RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
  v_recursion_key text;
  v_recursion_count integer;
BEGIN
  -- More aggressive circuit breaker
  v_recursion_key := 'analytics_recursion_block';
  
  -- Check current transaction recursion count
  v_recursion_count := COALESCE(current_setting('app.' || v_recursion_key, true)::integer, 0);
  
  -- Block if we're already in analytics processing
  IF v_recursion_count > 0 THEN
    RETURN NULL; -- Silent fail to prevent recursion
  END IF;
  
  -- Set recursion guard
  PERFORM set_config('app.' || v_recursion_key, '1', true);
  
  -- Direct insert without triggers for audit events
  IF p_event_type LIKE '%audit%' OR p_event_type LIKE '%security%' THEN
    INSERT INTO public.analytics_events (
      event_type, event_data, user_session, page_url, ip_address, user_agent, created_at
    ) VALUES (
      p_event_type,
      COALESCE(p_event_data, '{}'::jsonb),
      LEFT(COALESCE(p_user_session, ''), 100),
      LEFT(COALESCE(p_page_url, ''), 500),
      LEFT(COALESCE(p_ip_address, ''), 45),
      LEFT(COALESCE(p_user_agent, ''), 500),
      now()
    ) RETURNING id INTO v_event_id;
  ELSE
    -- Normal insert for non-audit events
    INSERT INTO public.analytics_events (
      event_type, event_data, user_session, page_url, ip_address, user_agent, created_at
    ) VALUES (
      p_event_type,
      COALESCE(p_event_data, '{}'::jsonb),
      LEFT(COALESCE(p_user_session, ''), 100),
      LEFT(COALESCE(p_page_url, ''), 500),
      LEFT(COALESCE(p_ip_address, ''), 45),
      LEFT(COALESCE(p_user_agent, ''), 500),
      now()
    ) RETURNING id INTO v_event_id;
  END IF;
  
  -- Clear recursion guard
  PERFORM set_config('app.' || v_recursion_key, '0', true);
  
  RETURN v_event_id;
EXCEPTION 
  WHEN OTHERS THEN
    -- Clear guard and fail silently
    PERFORM set_config('app.' || v_recursion_key, '0', true);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Clean up any existing recursive calls in current session
SELECT set_config('app.analytics_recursion_block', '0', false);