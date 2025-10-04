-- ============================================================================
-- CRITICAL FIX #1: Server-Side Rate Limiting Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.secure_rate_limit(
  identifier TEXT,
  max_requests INTEGER,
  window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  window_start TIMESTAMPTZ;
  current_count INTEGER;
  reset_at TIMESTAMPTZ;
BEGIN
  window_start := NOW() - (window_seconds || ' seconds')::INTERVAL;
  
  -- Clean up old records (probabilistic cleanup - 1% of requests)
  IF random() < 0.01 THEN
    DELETE FROM public.support_ticket_rate_limits
    WHERE window_start < NOW() - INTERVAL '1 hour';
  END IF;
  
  -- Count requests in current window
  SELECT COALESCE(SUM(ticket_count), 0)
  INTO current_count
  FROM public.support_ticket_rate_limits
  WHERE support_ticket_rate_limits.identifier = secure_rate_limit.identifier
    AND support_ticket_rate_limits.window_start > window_start;
  
  -- Check if limit exceeded
  IF current_count >= max_requests THEN
    reset_at := (
      SELECT support_ticket_rate_limits.window_start + (window_seconds || ' seconds')::INTERVAL
      FROM public.support_ticket_rate_limits
      WHERE support_ticket_rate_limits.identifier = secure_rate_limit.identifier
      ORDER BY support_ticket_rate_limits.window_start DESC
      LIMIT 1
    );
    
    -- Log exceeded limit
    INSERT INTO public.analytics_events (event_type, event_data, severity)
    VALUES (
      'rate_limit_exceeded',
      jsonb_build_object(
        'identifier', identifier,
        'max_requests', max_requests,
        'window_seconds', window_seconds,
        'current_count', current_count
      ),
      'warning'
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'limit', max_requests,
      'remaining', 0,
      'reset_at', reset_at
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
    'remaining', max_requests - current_count - 1,
    'reset_at', NOW() + (window_seconds || ' seconds')::INTERVAL
  );
END;
$$;

-- Index for fast rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_window 
ON public.support_ticket_rate_limits(identifier, window_start DESC);

-- ============================================================================
-- CRITICAL FIX #2: Dashboard Optimized Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_data_optimized()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Only org members can access
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT jsonb_build_object(
    'kpis', (
      SELECT jsonb_build_object(
        'total_calls', COUNT(*),
        'booked_appointments', COUNT(*) FILTER (WHERE booked = true),
        'active_sessions', COUNT(*) FILTER (WHERE status = 'in_progress')
      )
      FROM public.calls
      WHERE org_id IN (
        SELECT org_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
      AND started_at > NOW() - INTERVAL '30 days'
    ),
    'nextItems', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'start_at', a.start_at,
          'status', a.status,
          'source', a.source,
          'has_customer_info', (a.email IS NOT NULL OR a.e164 IS NOT NULL)
        ) ORDER BY a.start_at
      ), '[]'::jsonb)
      FROM public.appointments a
      WHERE a.organization_id IN (
        SELECT org_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
      AND a.start_at > NOW()
      AND a.status = 'pending'
      LIMIT 10
    ),
    'transcripts', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'call_sid', t.call_sid,
          'created_at', t.created_at,
          'content_preview', LEFT(t.content, 150) || '...',
          'priority', t.priority
        ) ORDER BY t.created_at DESC
      ), '[]'::jsonb)
      FROM public.transcripts t
      WHERE t.org_id IN (
        SELECT org_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
      AND NOT t.archived
      LIMIT 10
    ),
    'lastUpdated', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- CRITICAL FIX #3: A/B Test Helper Functions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_ab_sessions()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.ab_test_assignments
  WHERE created_at < NOW() - INTERVAL '90 days';
$$;

CREATE OR REPLACE FUNCTION public.get_variant_display_data(
  p_test_name TEXT,
  p_variant TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  variant_data JSONB;
BEGIN
  SELECT variants->p_variant
  INTO variant_data
  FROM public.ab_tests
  WHERE test_name = p_test_name
    AND active = true
  LIMIT 1;
  
  -- Return safe display data only (never expose full test configuration)
  IF variant_data IS NULL THEN
    RETURN jsonb_build_object(
      'text', 'Grow Now',
      'color', 'primary',
      'size', 'default'
    );
  END IF;
  
  RETURN variant_data;
END;
$$;