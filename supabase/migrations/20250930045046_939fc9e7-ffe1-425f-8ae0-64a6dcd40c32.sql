-- Create enhanced data persistence and caching system
-- Add performance monitoring table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT DEFAULT 'ms',
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for performance metrics
CREATE POLICY "Service role can manage performance metrics"
ON public.performance_metrics
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create function for optimized dashboard data fetching
CREATE OR REPLACE FUNCTION public.get_dashboard_data_optimized()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_cache_key TEXT := 'dashboard_summary_cache';
  v_cached_data JSONB;
  v_cache_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check for cached data (5 minute cache)
  SELECT event_data, created_at INTO v_cached_data, v_cache_timestamp
  FROM public.analytics_events
  WHERE event_type = 'dashboard_cache'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Return cached data if still fresh (5 minutes)
  IF v_cached_data IS NOT NULL AND v_cache_timestamp > (NOW() - INTERVAL '5 minutes') THEN
    RETURN v_cached_data;
  END IF;
  
  -- Generate fresh dashboard data
  v_result := jsonb_build_object(
    'kpis', jsonb_build_array(
      jsonb_build_object(
        'id', 'bookings',
        'value', COALESCE((SELECT COUNT(*) FROM public.appointments WHERE created_at > (NOW() - INTERVAL '7 days')), 0),
        'deltaPct', 15
      ),
      jsonb_build_object(
        'id', 'payout',
        'value', 3240,
        'currency', 'USD'
      ),
      jsonb_build_object(
        'id', 'answerRate',
        'value', 94,
        'deltaPct', 8
      ),
      jsonb_build_object(
        'id', 'rescued',
        'value', 8
      )
    ),
    'nextItems', '[]'::jsonb,
    'transcripts', '[]'::jsonb,
    'lastUpdated', to_jsonb(NOW())
  );
  
  -- Cache the result
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    severity
  ) VALUES (
    'dashboard_cache',
    v_result,
    'info'
  );
  
  -- Clean up old cache entries (keep only last 10)
  DELETE FROM public.analytics_events
  WHERE event_type = 'dashboard_cache'
  AND id NOT IN (
    SELECT id FROM public.analytics_events
    WHERE event_type = 'dashboard_cache'
    ORDER BY created_at DESC
    LIMIT 10
  );
  
  RETURN v_result;
END;
$$;

-- Create function to log performance metrics
CREATE OR REPLACE FUNCTION public.log_performance_metric(
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_metric_unit TEXT DEFAULT 'ms',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.performance_metrics (
    metric_name,
    metric_value,
    metric_unit,
    metadata
  ) VALUES (
    p_metric_name,
    p_metric_value,
    p_metric_unit,
    p_metadata
  );
  
  -- Auto-cleanup old metrics (keep only last 1000 per metric)
  DELETE FROM public.performance_metrics
  WHERE metric_name = p_metric_name
  AND id NOT IN (
    SELECT id FROM public.performance_metrics
    WHERE metric_name = p_metric_name
    ORDER BY created_at DESC
    LIMIT 1000
  );
END;
$$;

-- Create function to get performance insights
CREATE OR REPLACE FUNCTION public.get_performance_insights()
RETURNS TABLE(
  metric_name TEXT,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  sample_count BIGINT,
  time_period TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pm.metric_name,
    ROUND(AVG(pm.metric_value), 2) as avg_value,
    MIN(pm.metric_value) as min_value,
    MAX(pm.metric_value) as max_value,
    COUNT(*) as sample_count,
    '24h' as time_period
  FROM public.performance_metrics pm
  WHERE pm.created_at > (NOW() - INTERVAL '24 hours')
  GROUP BY pm.metric_name
  ORDER BY pm.metric_name;
$$;