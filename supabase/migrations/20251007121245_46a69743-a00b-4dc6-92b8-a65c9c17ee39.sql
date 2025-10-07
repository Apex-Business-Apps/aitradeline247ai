-- Create validate_session RPC for server-side session validation
CREATE OR REPLACE FUNCTION public.validate_session(
  p_user_id UUID,
  p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_concurrent_count INTEGER;
BEGIN
  -- Find the session
  SELECT * INTO v_session
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND session_token = p_session_token
    AND is_active = true;
  
  -- Check if session exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'session_not_found'
    );
  END IF;
  
  -- Check if session expired
  IF v_session.expires_at < NOW() THEN
    -- Mark session as inactive
    UPDATE public.user_sessions
    SET is_active = false
    WHERE id = v_session.id;
    
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'session_expired'
    );
  END IF;
  
  -- Count concurrent sessions
  SELECT COUNT(*) INTO v_concurrent_count
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > NOW();
  
  -- Update last activity
  UPDATE public.user_sessions
  SET last_activity = NOW(),
      expires_at = NOW() + INTERVAL '7 days'
  WHERE id = v_session.id;
  
  -- Return valid session with metadata
  RETURN jsonb_build_object(
    'valid', true,
    'session_id', v_session.id,
    'concurrent_sessions', v_concurrent_count,
    'last_activity', v_session.last_activity
  );
END;
$$;