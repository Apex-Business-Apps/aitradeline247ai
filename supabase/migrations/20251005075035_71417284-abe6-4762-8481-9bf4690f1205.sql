-- Fix ambiguous column reference in secure_rate_limit function causing rate limit RPC failures
-- This prevents false negatives (deny on error) in useSecureFormSubmission

CREATE OR REPLACE FUNCTION public.secure_rate_limit(identifier text, max_requests integer, window_seconds integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (window_seconds || ' seconds')::INTERVAL;
  
  -- Probabilistic cleanup (1%) with qualified column to avoid ambiguity
  IF random() < 0.01 THEN
    DELETE FROM public.support_ticket_rate_limits
    WHERE public.support_ticket_rate_limits.window_start < NOW() - INTERVAL '1 hour';
  END IF;
  
  -- Count requests in current window (qualify columns + use distinct variable name)
  SELECT COALESCE(SUM(public.support_ticket_rate_limits.ticket_count), 0)
  INTO v_current_count
  FROM public.support_ticket_rate_limits
  WHERE public.support_ticket_rate_limits.identifier = identifier
    AND public.support_ticket_rate_limits.window_start > v_window_start;
  
  -- Check if limit exceeded
  IF v_current_count >= max_requests THEN
    SELECT public.support_ticket_rate_limits.window_start + (window_seconds || ' seconds')::INTERVAL
    INTO v_reset_at
    FROM public.support_ticket_rate_limits
    WHERE public.support_ticket_rate_limits.identifier = identifier
    ORDER BY public.support_ticket_rate_limits.window_start DESC
    LIMIT 1;
    
    -- Log exceeded limit
    INSERT INTO public.analytics_events (event_type, event_data, severity)
    VALUES (
      'rate_limit_exceeded',
      jsonb_build_object(
        'identifier', identifier,
        'max_requests', max_requests,
        'window_seconds', window_seconds,
        'current_count', v_current_count
      ),
      'warning'
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'limit', max_requests,
      'remaining', 0,
      'reset_at', v_reset_at
    );
  END IF;
  
  -- Record this request
  INSERT INTO public.support_ticket_rate_limits (identifier, identifier_type, window_start, ticket_count)
  VALUES (identifier, 'ip_or_user', NOW(), 1)
  ON CONFLICT (identifier, window_start)
  DO UPDATE SET ticket_count = public.support_ticket_rate_limits.ticket_count + 1;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'limit', max_requests,
    'remaining', max_requests - v_current_count - 1,
    'reset_at', NOW() + (window_seconds || ' seconds')::INTERVAL
  );
END;
$function$;