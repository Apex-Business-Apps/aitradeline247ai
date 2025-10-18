-- ============================================================================
-- IDEMPOTENCY INFRASTRUCTURE FOR SECURE LEAD SUBMISSION
-- Created: 2025-10-13
-- Purpose: Prevent duplicate lead submissions via idempotency key tracking
-- Security: DEFINER functions with fixed search_path, RLS policies
-- ============================================================================

-- Create idempotency tracking table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Idempotency key (client-provided or hash-generated)
  idempotency_key TEXT NOT NULL,
  
  -- Operation type for scoping (e.g., 'lead_submission', 'payment')
  operation TEXT NOT NULL,
  
  -- Request hash for validation (SHA-256 of request body)
  request_hash TEXT NOT NULL,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'processing',
  -- Valid statuses: 'processing', 'completed', 'failed'
  
  -- Cached response data (for completed requests)
  response_data JSONB,
  
  -- Error information (for failed requests)
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- TTL: Auto-expire after 24 hours
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Composite unique constraint: key + operation scoping
  CONSTRAINT idempotency_keys_unique UNIQUE (idempotency_key, operation)
);

-- Add status check constraint
ALTER TABLE public.idempotency_keys 
ADD CONSTRAINT idempotency_keys_status_check 
CHECK (status IN ('processing', 'completed', 'failed'));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup 
ON public.idempotency_keys(idempotency_key, operation, status);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires 
ON public.idempotency_keys(expires_at) 
WHERE status = 'processing';

-- Enable RLS
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role full access
CREATE POLICY "Service role can manage idempotency keys"
ON public.idempotency_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policy: Authenticated users can view their own keys
CREATE POLICY "Users can view their own idempotency keys"
ON public.idempotency_keys
FOR SELECT
TO authenticated
USING (auth.uid()::text = (response_data->>'user_id'));

-- ============================================================================
-- FUNCTION: check_idempotency
-- Purpose: Check if request was already processed; return cached response
-- Security: SECURITY DEFINER with SET search_path for safety
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_idempotency(
  p_key TEXT,
  p_operation TEXT,
  p_request_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_result JSONB;
BEGIN
  -- Input validation
  IF p_key IS NULL OR p_key = '' THEN
    RAISE EXCEPTION 'Idempotency key cannot be empty';
  END IF;
  
  IF p_operation IS NULL OR p_operation = '' THEN
    RAISE EXCEPTION 'Operation cannot be empty';
  END IF;
  
  IF p_request_hash IS NULL OR p_request_hash = '' THEN
    RAISE EXCEPTION 'Request hash cannot be empty';
  END IF;
  
  -- Clean up expired keys first (1% probability for efficiency)
  IF random() < 0.01 THEN
    DELETE FROM public.idempotency_keys
    WHERE expires_at < NOW();
  END IF;
  
  -- Check for existing key
  SELECT * INTO v_record
  FROM public.idempotency_keys
  WHERE idempotency_key = p_key
    AND operation = p_operation
  LIMIT 1;
  
  -- Key not found - create new processing record
  IF NOT FOUND THEN
    INSERT INTO public.idempotency_keys (
      idempotency_key,
      operation,
      request_hash,
      status
    ) VALUES (
      p_key,
      p_operation,
      p_request_hash,
      'processing'
    );
    
    RETURN jsonb_build_object(
      'exists', false,
      'status', 'processing',
      'response_data', NULL
    );
  END IF;
  
  -- Key exists - validate request hash matches
  IF v_record.request_hash != p_request_hash THEN
    RAISE EXCEPTION 'Idempotency key conflict: different request data';
  END IF;
  
  -- Return existing result
  RETURN jsonb_build_object(
    'exists', true,
    'status', v_record.status,
    'response_data', v_record.response_data,
    'created_at', v_record.created_at,
    'completed_at', v_record.completed_at
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't expose internal details
  RAISE WARNING 'check_idempotency error: %', SQLERRM;
  RAISE EXCEPTION 'Idempotency check failed';
END;
$$;

-- ============================================================================
-- FUNCTION: complete_idempotency
-- Purpose: Mark request as completed and cache the response
-- Security: SECURITY DEFINER with SET search_path for safety
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_idempotency(
  p_key TEXT,
  p_response JSONB,
  p_status TEXT DEFAULT 'completed'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Input validation
  IF p_key IS NULL OR p_key = '' THEN
    RAISE EXCEPTION 'Idempotency key cannot be empty';
  END IF;
  
  IF p_status NOT IN ('completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: must be completed or failed';
  END IF;
  
  -- Update the record
  UPDATE public.idempotency_keys
  SET 
    status = p_status,
    response_data = p_response,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE idempotency_key = p_key;
  
  -- Verify update succeeded
  IF NOT FOUND THEN
    RAISE WARNING 'Idempotency key not found: %', p_key;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't expose internal details
  RAISE WARNING 'complete_idempotency error: %', SQLERRM;
  RAISE EXCEPTION 'Idempotency completion failed';
END;
$$;

-- ============================================================================
-- FUNCTION: cleanup_expired_idempotency_keys (for cron job)
-- Purpose: Remove expired idempotency keys to prevent table bloat
-- Security: SECURITY DEFINER with SET search_path for safety
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete all expired keys
  DELETE FROM public.idempotency_keys
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Log cleanup operation
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    severity
  ) VALUES (
    'idempotency_cleanup',
    jsonb_build_object(
      'deleted_count', v_deleted_count,
      'timestamp', NOW()
    ),
    'info'
  );
  
  RETURN v_deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_idempotency(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_idempotency(TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_idempotency_keys() TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.idempotency_keys IS 'Idempotency key tracking for duplicate request prevention. Keys expire after 24 hours.';
COMMENT ON FUNCTION public.check_idempotency IS 'Check if request was already processed and return cached response if available.';
COMMENT ON FUNCTION public.complete_idempotency IS 'Mark request as completed and cache the response for duplicate detection.';
COMMENT ON FUNCTION public.cleanup_expired_idempotency_keys IS 'Remove expired idempotency keys. Run via cron job daily.';