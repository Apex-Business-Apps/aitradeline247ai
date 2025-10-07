
-- ============================================
-- PROFILES SECURITY FIX: Prevent PII Theft (CORRECTED)
-- ============================================

-- Step 1: Drop the vulnerable policies
DROP POLICY IF EXISTS "Admins must use secure function for profile access" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;

-- Step 2: Create granular service role policies (NO SELECT ACCESS)
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update profiles"
ON public.profiles
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can delete profiles"
ON public.profiles
FOR DELETE
TO service_role
USING (true);

-- Step 3: Create safe view with masked data
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  p.id,
  CASE 
    WHEN p.full_name IS NOT NULL THEN 
      LEFT(p.full_name, 1) || REPEAT('*', GREATEST(LENGTH(p.full_name) - 1, 3))
    ELSE NULL 
  END as full_name_masked,
  CASE 
    WHEN p.phone_e164 IS NOT NULL THEN 
      '***' || RIGHT(p.phone_e164, 4)
    ELSE NULL 
  END as phone_e164_masked,
  p.created_at,
  p.updated_at
FROM public.profiles p;

-- Enable security invoker on the safe view
ALTER VIEW public.profiles_safe SET (security_invoker = on);

-- Step 4: Create secure function for masked profile access
CREATE OR REPLACE FUNCTION public.get_profile_masked(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name_masked text,
  phone_e164_masked text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type
  ) VALUES (
    auth.uid(),
    'profiles',
    profile_user_id::text,
    'masked_view'
  );

  -- Return masked data if user has access
  RETURN QUERY
  SELECT 
    ps.id,
    ps.full_name_masked,
    ps.phone_e164_masked,
    ps.created_at,
    ps.updated_at
  FROM public.profiles_safe ps
  WHERE ps.id = profile_user_id
  AND (
    ps.id = auth.uid() -- Own profile
    OR public.has_role(auth.uid(), 'admin'::app_role) -- Admin
    OR public.share_org(auth.uid(), ps.id) -- Same org
  );
END;
$$;

-- Step 5: Create emergency PII access function (admin only)
CREATE OR REPLACE FUNCTION public.get_profile_pii_emergency(
  profile_user_id uuid,
  access_reason text
)
RETURNS TABLE(
  id uuid,
  full_name text,
  phone_e164 text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access unmasked PII
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access unmasked PII';
  END IF;

  -- Log emergency access with reason
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type
  ) VALUES (
    auth.uid(),
    'profiles_pii',
    profile_user_id::text,
    'emergency_pii_access: ' || access_reason
  );

  -- Generate security alert for unmasked access
  INSERT INTO public.security_alerts (
    alert_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    'admin_pii_access',
    auth.uid(),
    jsonb_build_object(
      'profile_id', profile_user_id,
      'access_reason', access_reason,
      'timestamp', NOW()
    ),
    'high'
  );

  -- Return unmasked data (using elevated privileges via SECURITY DEFINER)
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.phone_e164,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = profile_user_id;
END;
$$;

-- Step 6: Grant permissions
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_masked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_pii_emergency(uuid, text) TO authenticated;

-- Comment on the solution
COMMENT ON VIEW public.profiles_safe IS 
  'Safe view of profiles with masked PII. Use get_profile_masked() for programmatic access.';
  
COMMENT ON FUNCTION public.get_profile_masked(uuid) IS 
  'Returns masked profile data with audit logging. Safe for general use.';
  
COMMENT ON FUNCTION public.get_profile_pii_emergency(uuid, text) IS 
  'Admin-only emergency access to unmasked PII. Generates security alerts and requires access reason.';
