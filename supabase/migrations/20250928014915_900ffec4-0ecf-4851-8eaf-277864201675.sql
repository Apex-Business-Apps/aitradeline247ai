-- Fix the analytics insert function to use correct column names
CREATE OR REPLACE FUNCTION public.safe_analytics_insert_with_circuit_breaker(
  p_event_type text,
  p_event_data jsonb DEFAULT '{}',
  p_user_session text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count integer;
BEGIN
  -- Circuit breaker: check for excessive events from same session in last minute
  SELECT COUNT(*) INTO v_recent_count
  FROM public.analytics_events
  WHERE 
    session_id = p_user_session
    AND created_at > (NOW() - INTERVAL '1 minute')
    AND event_type = p_event_type;
  
  -- If more than 20 similar events in 1 minute, skip insertion
  IF v_recent_count > 20 THEN
    RETURN FALSE;
  END IF;
  
  -- Insert the analytics event
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    session_id,
    user_agent,
    ip_address,
    severity
  ) VALUES (
    p_event_type,
    p_event_data,
    p_user_session,
    p_user_agent,
    p_ip_address,
    'info'
  );
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail completely
    RAISE NOTICE 'Analytics insert failed: %', SQLERRM;
    RETURN FALSE;
END;
$$;