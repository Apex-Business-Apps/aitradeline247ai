-- Guardian Phase G-T1 to G-T4: Synthetic monitoring, circuit breakers, auto-heal, and reporting

-- Synthetic check results table
CREATE TABLE IF NOT EXISTS public.guardian_synthetic_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_run_id UUID NOT NULL,
  target_id TEXT NOT NULL,
  target_url TEXT NOT NULL,
  check_type TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  validation_results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_guardian_synthetic_checks_run ON public.guardian_synthetic_checks(check_run_id);
CREATE INDEX idx_guardian_synthetic_checks_created ON public.guardian_synthetic_checks(created_at DESC);
CREATE INDEX idx_guardian_synthetic_checks_success ON public.guardian_synthetic_checks(success);

-- Circuit breaker events table (observe-only mode)
CREATE TABLE IF NOT EXISTS public.guardian_circuit_breaker_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('closed', 'open', 'half_open')),
  previous_state TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_guardian_breaker_service ON public.guardian_circuit_breaker_events(service_name);
CREATE INDEX idx_guardian_breaker_created ON public.guardian_circuit_breaker_events(created_at DESC);

-- Auto-heal actions table
CREATE TABLE IF NOT EXISTS public.guardian_autoheal_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('worker_restart', 'disable_integration', 'connection_pool_scale', 'observe_only')),
  trigger_reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('initiated', 'success', 'failed', 'skipped')),
  mode TEXT NOT NULL DEFAULT 'dry_run' CHECK (mode IN ('dry_run', 'active')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_guardian_autoheal_created ON public.guardian_autoheal_actions(created_at DESC);
CREATE INDEX idx_guardian_autoheal_type ON public.guardian_autoheal_actions(action_type);

-- Concurrency locks table for synthetic checks
CREATE TABLE IF NOT EXISTS public.guardian_concurrency_locks (
  lock_key TEXT PRIMARY KEY,
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lock_ttl_seconds INTEGER NOT NULL DEFAULT 600,
  worker_id TEXT NOT NULL
);

-- Guardian configuration table
CREATE TABLE IF NOT EXISTS public.guardian_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial configuration
INSERT INTO public.guardian_config (key, value) VALUES
  ('synthetic_enabled', 'false'::jsonb),
  ('autoheal_mode', '"dry_run"'::jsonb),
  ('circuit_breaker_mode', '"observe_only"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Function to acquire distributed lock
CREATE OR REPLACE FUNCTION public.acquire_guardian_lock(p_lock_key TEXT, p_worker_id TEXT, p_ttl_seconds INTEGER DEFAULT 600)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up expired locks
  DELETE FROM public.guardian_concurrency_locks
  WHERE lock_key = p_lock_key
  AND acquired_at + (lock_ttl_seconds || ' seconds')::interval < NOW();
  
  -- Try to acquire lock
  INSERT INTO public.guardian_concurrency_locks (lock_key, acquired_at, lock_ttl_seconds, worker_id)
  VALUES (p_lock_key, NOW(), p_ttl_seconds, p_worker_id)
  ON CONFLICT (lock_key) DO NOTHING;
  
  -- Check if we got the lock
  RETURN EXISTS (
    SELECT 1 FROM public.guardian_concurrency_locks
    WHERE lock_key = p_lock_key AND worker_id = p_worker_id
  );
END;
$$;

-- Function to release distributed lock
CREATE OR REPLACE FUNCTION public.release_guardian_lock(p_lock_key TEXT, p_worker_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.guardian_concurrency_locks
  WHERE lock_key = p_lock_key AND worker_id = p_worker_id;
  
  RETURN FOUND;
END;
$$;

-- Function to check if auto-heal is allowed (rate limiting)
CREATE OR REPLACE FUNCTION public.is_autoheal_allowed(p_action_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  -- Check for actions of same type in last 60 minutes
  SELECT COUNT(*) INTO v_recent_count
  FROM public.guardian_autoheal_actions
  WHERE action_type = p_action_type
  AND created_at > (NOW() - INTERVAL '60 minutes')
  AND status IN ('success', 'initiated');
  
  -- Allow if no recent actions (rate limit: 1 per hour)
  RETURN v_recent_count = 0;
END;
$$;

-- Function to get guardian metrics for reporting
CREATE OR REPLACE FUNCTION public.get_guardian_metrics(p_start_time TIMESTAMP WITH TIME ZONE, p_end_time TIMESTAMP WITH TIME ZONE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_checks INTEGER;
  v_successful_checks INTEGER;
  v_failed_checks INTEGER;
  v_autoheal_actions INTEGER;
  v_breaker_transitions INTEGER;
BEGIN
  -- Get synthetic check stats
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE success = true) as successful,
    COUNT(*) FILTER (WHERE success = false) as failed
  INTO v_total_checks, v_successful_checks, v_failed_checks
  FROM public.guardian_synthetic_checks
  WHERE created_at BETWEEN p_start_time AND p_end_time;
  
  -- Get auto-heal action count
  SELECT COUNT(*) INTO v_autoheal_actions
  FROM public.guardian_autoheal_actions
  WHERE created_at BETWEEN p_start_time AND p_end_time
  AND mode = 'active';
  
  -- Get circuit breaker transition count
  SELECT COUNT(*) INTO v_breaker_transitions
  FROM public.guardian_circuit_breaker_events
  WHERE created_at BETWEEN p_start_time AND p_end_time
  AND state != previous_state;
  
  v_result := jsonb_build_object(
    'period_start', p_start_time,
    'period_end', p_end_time,
    'synthetic_checks', jsonb_build_object(
      'total', v_total_checks,
      'successful', v_successful_checks,
      'failed', v_failed_checks,
      'success_rate', CASE WHEN v_total_checks > 0 THEN 
        ROUND((v_successful_checks::numeric / v_total_checks::numeric) * 100, 2)
      ELSE 0 END
    ),
    'autoheal_actions', v_autoheal_actions,
    'breaker_transitions', v_breaker_transitions
  );
  
  RETURN v_result;
END;
$$;

-- Enable RLS
ALTER TABLE public.guardian_synthetic_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_circuit_breaker_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_autoheal_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_concurrency_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service role only for internal operations)
CREATE POLICY "Service role can manage guardian_synthetic_checks"
ON public.guardian_synthetic_checks FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage guardian_circuit_breaker_events"
ON public.guardian_circuit_breaker_events FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage guardian_autoheal_actions"
ON public.guardian_autoheal_actions FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage guardian_concurrency_locks"
ON public.guardian_concurrency_locks FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage guardian_config"
ON public.guardian_config FOR ALL
USING (auth.role() = 'service_role');

-- Admins can view guardian data
CREATE POLICY "Admins can view guardian_synthetic_checks"
ON public.guardian_synthetic_checks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view guardian_circuit_breaker_events"
ON public.guardian_circuit_breaker_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view guardian_autoheal_actions"
ON public.guardian_autoheal_actions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view guardian_config"
ON public.guardian_config FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));