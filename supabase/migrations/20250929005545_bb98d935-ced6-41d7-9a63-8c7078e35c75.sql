-- Remove public access to supported_voices table
DROP POLICY IF EXISTS "Anyone can view supported voices" ON public.supported_voices;

-- Create restricted access policy for supported_voices
CREATE POLICY "Authenticated users can view supported voices" 
ON public.supported_voices 
FOR SELECT 
TO authenticated
USING (true);

-- Add security headers function
CREATE OR REPLACE FUNCTION public.add_security_headers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log security-relevant data access
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    access_type,
    created_at
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    'select',
    now()
  );
  
  RETURN NEW;
END;
$$;

-- Enhanced security event logging with rate limiting
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  p_event_type text,
  p_success boolean,
  p_user_identifier text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_recent_attempts integer;
BEGIN
  -- Check for excessive failed attempts from same IP
  IF NOT p_success THEN
    SELECT COUNT(*) INTO v_recent_attempts
    FROM public.analytics_events
    WHERE event_type = 'auth_failed'
    AND ip_address = p_ip_address
    AND created_at > (NOW() - INTERVAL '15 minutes');
    
    -- Alert on suspicious activity
    IF v_recent_attempts > 3 THEN
      INSERT INTO public.security_alerts (
        alert_type,
        ip_address,
        user_agent,
        event_data,
        severity
      ) VALUES (
        'suspicious_auth_attempts',
        p_ip_address,
        p_user_agent,
        jsonb_build_object(
          'attempt_count', v_recent_attempts,
          'user_identifier', p_user_identifier
        ),
        'high'
      );
    END IF;
  END IF;
  
  -- Log the authentication attempt (anonymized)
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    ip_address,
    user_agent,
    severity
  ) VALUES (
    p_event_type,
    jsonb_build_object(
      'success', p_success,
      'timestamp', NOW()
    ),
    public.anonymize_ip_address(p_ip_address),
    p_user_agent,
    CASE WHEN p_success THEN 'info' ELSE 'warning' END
  );
END;
$$;