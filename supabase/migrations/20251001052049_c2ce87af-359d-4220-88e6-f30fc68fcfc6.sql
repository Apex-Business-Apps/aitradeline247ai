-- Phase H-I1 & H-I4: Database schema for hotline security, rate limiting, and consent tracking

-- Table for tracking rate limits per phone number (ANI)
CREATE TABLE IF NOT EXISTS public.hotline_rate_limit_ani (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ani_hash TEXT NOT NULL, -- SHA256 hash of phone number for privacy
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 1,
  block_until TIMESTAMP WITH TIME ZONE,
  block_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotline_rate_limit_ani_hash ON public.hotline_rate_limit_ani(ani_hash);
CREATE INDEX IF NOT EXISTS idx_hotline_rate_limit_ani_window ON public.hotline_rate_limit_ani(window_start);

-- Table for tracking rate limits per IP address
CREATE TABLE IF NOT EXISTS public.hotline_rate_limit_ip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL, -- SHA256 hash of IP for privacy
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 1,
  block_until TIMESTAMP WITH TIME ZONE,
  block_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotline_rate_limit_ip_hash ON public.hotline_rate_limit_ip(ip_hash);
CREATE INDEX IF NOT EXISTS idx_hotline_rate_limit_ip_window ON public.hotline_rate_limit_ip(window_start);

-- Table for consent audit logs
CREATE TABLE IF NOT EXISTS public.hotline_consent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL,
  ani_hash TEXT NOT NULL, -- Hashed phone number
  consent_status TEXT NOT NULL, -- 'granted', 'denied', 'timeout'
  language TEXT NOT NULL, -- 'en' or 'fr-CA'
  dtmf_input TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotline_consent_call_sid ON public.hotline_consent_audit(call_sid);
CREATE INDEX IF NOT EXISTS idx_hotline_consent_created ON public.hotline_consent_audit(created_at);

-- Table for call session tracking
CREATE TABLE IF NOT EXISTS public.hotline_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL UNIQUE,
  ani_hash TEXT NOT NULL,
  call_status TEXT NOT NULL, -- 'in-progress', 'completed', 'failed'
  route_taken TEXT, -- 'support', 'sales', 'voicemail'
  consent_given BOOLEAN,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_hotline_calls_sid ON public.hotline_call_sessions(call_sid);
CREATE INDEX IF NOT EXISTS idx_hotline_calls_status ON public.hotline_call_sessions(call_status);
CREATE INDEX IF NOT EXISTS idx_hotline_calls_created ON public.hotline_call_sessions(created_at);

-- Enable RLS on all hotline tables (admin-only access)
ALTER TABLE public.hotline_rate_limit_ani ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotline_rate_limit_ip ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotline_consent_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotline_call_sessions ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admin can view ANI rate limits" ON public.hotline_rate_limit_ani
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can view IP rate limits" ON public.hotline_rate_limit_ip
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can view consent audit" ON public.hotline_consent_audit
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can view call sessions" ON public.hotline_call_sessions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert/update for edge functions
CREATE POLICY "Service role can manage ANI rate limits" ON public.hotline_rate_limit_ani
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage IP rate limits" ON public.hotline_rate_limit_ip
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert consent audit" ON public.hotline_consent_audit
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage call sessions" ON public.hotline_call_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_hotline_rate_limit(
  p_ani_hash TEXT,
  p_ip_hash TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ani_record RECORD;
  v_ip_record RECORD;
  v_blocked BOOLEAN := false;
  v_reason TEXT := '';
  v_block_duration INTEGER := 0;
BEGIN
  -- Check ANI rate limit
  SELECT * INTO v_ani_record
  FROM public.hotline_rate_limit_ani
  WHERE ani_hash = p_ani_hash
  AND window_start > (NOW() - INTERVAL '1 hour')
  ORDER BY window_start DESC
  LIMIT 1;

  -- Check if ANI is currently blocked
  IF v_ani_record.block_until IS NOT NULL AND v_ani_record.block_until > NOW() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ani_blocked',
      'block_until', v_ani_record.block_until
    );
  END IF;

  -- Check ANI burst limit (5 calls/minute)
  IF v_ani_record IS NOT NULL AND 
     v_ani_record.window_start > (NOW() - INTERVAL '1 minute') AND
     v_ani_record.request_count >= 5 THEN
    v_blocked := true;
    v_reason := 'ani_burst_limit';
    v_block_duration := 60 * POWER(2, LEAST(v_ani_record.block_count, 3)); -- Exponential backoff
  END IF;

  -- Check ANI hourly limit (15 calls/hour)
  IF NOT v_blocked AND v_ani_record IS NOT NULL AND v_ani_record.request_count >= 15 THEN
    v_blocked := true;
    v_reason := 'ani_hourly_limit';
    v_block_duration := 300; -- 5 minutes
  END IF;

  -- Check IP rate limit
  SELECT * INTO v_ip_record
  FROM public.hotline_rate_limit_ip
  WHERE ip_hash = p_ip_hash
  AND window_start > (NOW() - INTERVAL '1 hour')
  ORDER BY window_start DESC
  LIMIT 1;

  -- Check if IP is currently blocked
  IF v_ip_record.block_until IS NOT NULL AND v_ip_record.block_until > NOW() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_blocked',
      'block_until', v_ip_record.block_until
    );
  END IF;

  -- Check IP burst limit (20 calls/minute)
  IF NOT v_blocked AND v_ip_record IS NOT NULL AND 
     v_ip_record.window_start > (NOW() - INTERVAL '1 minute') AND
     v_ip_record.request_count >= 20 THEN
    v_blocked := true;
    v_reason := 'ip_burst_limit';
    v_block_duration := 60;
  END IF;

  -- If blocked, update records
  IF v_blocked THEN
    -- Update ANI record
    IF v_reason LIKE 'ani%' THEN
      UPDATE public.hotline_rate_limit_ani
      SET block_until = NOW() + (v_block_duration || ' seconds')::INTERVAL,
          block_count = block_count + 1,
          updated_at = NOW()
      WHERE ani_hash = p_ani_hash;
    END IF;

    -- Update IP record
    IF v_reason LIKE 'ip%' THEN
      UPDATE public.hotline_rate_limit_ip
      SET block_until = NOW() + (v_block_duration || ' seconds')::INTERVAL,
          block_count = block_count + 1,
          updated_at = NOW()
      WHERE ip_hash = p_ip_hash;
    END IF;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', v_reason,
      'block_duration', v_block_duration
    );
  END IF;

  -- Update counters
  INSERT INTO public.hotline_rate_limit_ani (ani_hash, request_count)
  VALUES (p_ani_hash, 1)
  ON CONFLICT (ani_hash) 
  DO UPDATE SET 
    request_count = hotline_rate_limit_ani.request_count + 1,
    updated_at = NOW();

  INSERT INTO public.hotline_rate_limit_ip (ip_hash, request_count)
  VALUES (p_ip_hash, 1)
  ON CONFLICT (ip_hash)
  DO UPDATE SET 
    request_count = hotline_rate_limit_ip.request_count + 1,
    updated_at = NOW();

  RETURN jsonb_build_object('allowed', true);
END;
$$;

-- Cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_hotline_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete ANI records older than 24 hours
  DELETE FROM public.hotline_rate_limit_ani
  WHERE window_start < (NOW() - INTERVAL '24 hours');

  -- Delete IP records older than 24 hours
  DELETE FROM public.hotline_rate_limit_ip
  WHERE window_start < (NOW() - INTERVAL '24 hours');

  -- Delete consent audit logs older than 90 days
  DELETE FROM public.hotline_consent_audit
  WHERE created_at < (NOW() - INTERVAL '90 days');

  -- Delete completed call sessions older than 90 days
  DELETE FROM public.hotline_call_sessions
  WHERE call_status = 'completed'
  AND completed_at < (NOW() - INTERVAL '90 days');
END;
$$;