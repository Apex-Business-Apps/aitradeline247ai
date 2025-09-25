-- 🚨 CRITICAL FIX 1: Resolve Analytics Recursion Issue
-- Remove problematic triggers that cause stack overflow in analytics_events

-- First, drop the triggers that are causing recursion
DROP TRIGGER IF EXISTS analytics_auto_anonymize ON public.analytics_events;
DROP TRIGGER IF EXISTS analytics_security_audit ON public.analytics_events;
DROP TRIGGER IF EXISTS log_security_event_trigger ON public.analytics_events;

-- Create a safer analytics insertion function with circuit breaker
CREATE OR REPLACE FUNCTION public.safe_analytics_insert_with_circuit_breaker(
  p_event_type text,
  p_event_data jsonb DEFAULT NULL,
  p_user_session text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_recursion_key text;
BEGIN
  -- Circuit breaker: prevent recursion using session variable
  v_recursion_key := 'analytics_insert_' || p_event_type;
  
  -- Check if we're already in an analytics insertion for this event type
  IF current_setting('app.recursion_guard_' || v_recursion_key, true) = 'true' THEN
    RETURN NULL; -- Exit silently to prevent recursion
  END IF;
  
  -- Set recursion guard
  PERFORM set_config('app.recursion_guard_' || v_recursion_key, 'true', true);
  
  -- Insert analytics event with size limits and sanitization
  INSERT INTO public.analytics_events (
    event_type, 
    event_data, 
    user_session, 
    page_url, 
    ip_address, 
    user_agent,
    created_at
  ) VALUES (
    p_event_type,
    COALESCE(p_event_data, '{}'::jsonb),
    LEFT(COALESCE(p_user_session, ''), 100),
    LEFT(COALESCE(p_page_url, ''), 500),
    LEFT(COALESCE(p_ip_address, ''), 45),
    LEFT(COALESCE(p_user_agent, ''), 500),
    now()
  ) RETURNING id INTO v_event_id;
  
  -- Clear recursion guard
  PERFORM set_config('app.recursion_guard_' || v_recursion_key, '', true);
  
  RETURN v_event_id;
EXCEPTION 
  WHEN OTHERS THEN
    -- Clear recursion guard on error
    PERFORM set_config('app.recursion_guard_' || v_recursion_key, '', true);
    -- Log error but don't fail
    RAISE WARNING 'Analytics insert failed: %', SQLERRM;
    RETURN NULL;
END $$;

-- 🔒 CRITICAL FIX 2: Enhanced Session Token Security
-- Add encrypted session storage and rotation capabilities

CREATE TABLE IF NOT EXISTS public.encrypted_session_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL, -- SHA-256 hash of the actual token
  encrypted_token text NOT NULL, -- Encrypted token for server-side use
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  is_revoked boolean NOT NULL DEFAULT false,
  device_fingerprint text,
  ip_address_hash text, -- Hashed IP for abuse detection without storing real IP
  UNIQUE(token_hash)
);

-- Enable RLS on encrypted session tokens
ALTER TABLE public.encrypted_session_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role and the user themselves can manage their tokens
CREATE POLICY "Users can view their own encrypted tokens" ON public.encrypted_session_tokens
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage encrypted tokens" ON public.encrypted_session_tokens
FOR ALL USING (auth.role() = 'service_role');

-- Function to create encrypted session token
CREATE OR REPLACE FUNCTION public.create_encrypted_session_token(
  p_user_id uuid,
  p_raw_token text,
  p_device_fingerprint text DEFAULT NULL,
  p_ip_address text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_id uuid;
  v_token_hash text;
  v_ip_hash text;
BEGIN
  -- Generate secure hash of token
  v_token_hash := encode(digest(p_raw_token || p_user_id::text, 'sha256'), 'hex');
  
  -- Hash IP address for abuse detection without storing real IP
  v_ip_hash := CASE 
    WHEN p_ip_address IS NOT NULL THEN 
      encode(digest(p_ip_address || 'salt_' || p_user_id::text, 'sha256'), 'hex')
    ELSE NULL 
  END;
  
  -- Insert encrypted token record
  INSERT INTO public.encrypted_session_tokens (
    user_id,
    token_hash,
    encrypted_token,
    device_fingerprint,
    ip_address_hash
  ) VALUES (
    p_user_id,
    v_token_hash,
    encode(encrypt(p_raw_token::bytea, 'session_key_' || p_user_id::text, 'aes'), 'base64'),
    p_device_fingerprint,
    v_ip_hash
  ) RETURNING id INTO v_token_id;
  
  RETURN v_token_id;
END $$;