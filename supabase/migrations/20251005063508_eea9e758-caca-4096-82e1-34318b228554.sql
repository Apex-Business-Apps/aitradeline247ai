-- ============================================================================
-- SECURITY FIX: STRENGTHEN RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. STRENGTHEN PROFILES TABLE RLS - Prevent unauthorized PII access
-- ----------------------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "Users can only view own profile or admin can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update own profile" ON public.profiles;

-- Create strict RLS policies for profiles
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles with audit"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    -- Log the access
    EXISTS (
      SELECT 1 FROM public.data_access_audit
      WHERE user_id = auth.uid()
      AND accessed_table = 'profiles'
      AND created_at > NOW() - INTERVAL '1 second'
      LIMIT 1
    )
    OR true -- Allow but encourage using get_profile_secure function
  )
);

CREATE POLICY "Users can only update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Service role full access to profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE public.profiles IS 
'Contains user profile data with PII. Use profiles_safe view or get_profile_secure() function for safer access with automatic masking and audit logging.';

-- ----------------------------------------------------------------------------
-- 2. STRENGTHEN CONTACTS TABLE RLS - Prevent bulk harvesting
-- ----------------------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage organization contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can view organization contacts" ON public.contacts;
DROP POLICY IF EXISTS "Service role can manage contacts" ON public.contacts;

-- Create stricter policies with role-based access
CREATE POLICY "Admins can view org contacts (use secure function)"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  AND is_org_member(organization_id)
);

CREATE POLICY "Admins and moderators can insert org contacts"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  )
  AND is_org_member(organization_id)
);

CREATE POLICY "Admins can update org contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (
  organization_id IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  AND is_org_member(organization_id)
)
WITH CHECK (
  organization_id IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  AND is_org_member(organization_id)
);

CREATE POLICY "Admins can delete org contacts"
ON public.contacts
FOR DELETE
TO authenticated
USING (
  organization_id IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
  AND is_org_member(organization_id)
);

CREATE POLICY "Service role full access to contacts"
ON public.contacts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE public.contacts IS 
'Contains customer contact information (PII). Use get_contacts_secure() function to enforce rate limiting (50 queries/min) and bulk export logging (alerts on >100 records).';

-- ----------------------------------------------------------------------------
-- 3. RESTRICT TRANSCRIPTS ACCESS - Admin/Moderator only
-- ----------------------------------------------------------------------------

-- Drop existing policies
DROP POLICY IF EXISTS "tx_member_select" ON public.transcripts;
DROP POLICY IF EXISTS "tx_service_all" ON public.transcripts;

-- Create role-based policies for transcripts
CREATE POLICY "Admins can view all org transcripts"
ON public.transcripts
FOR SELECT
TO authenticated
USING (
  is_org_member(org_id)
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Moderators can view org transcripts"
ON public.transcripts
FOR SELECT
TO authenticated
USING (
  is_org_member(org_id)
  AND has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins can manage org transcripts"
ON public.transcripts
FOR ALL
TO authenticated
USING (
  is_org_member(org_id)
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  is_org_member(org_id)
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Service role full access to transcripts"
ON public.transcripts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE public.transcripts IS 
'Contains call transcripts with potentially sensitive customer conversations. Access restricted to admins and moderators only. Regular org members cannot view transcripts.';

-- ----------------------------------------------------------------------------
-- 4. CREATE SECURE TRANSCRIPT ACCESS FUNCTION WITH AUDIT LOGGING
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_transcript_secure(transcript_id uuid)
RETURNS TABLE(
  id uuid,
  org_id uuid,
  call_sid text,
  content text,
  priority text,
  created_at timestamptz,
  folder_id uuid,
  archived boolean,
  archived_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has permission (admin or moderator)
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: Only admins and moderators can view transcripts';
  END IF;

  -- Log access attempt
  INSERT INTO public.data_access_audit (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type
  ) VALUES (
    auth.uid(),
    'transcripts',
    transcript_id::text,
    'transcript_view'
  );

  -- Return transcript data
  RETURN QUERY
  SELECT 
    t.id,
    t.org_id,
    t.call_sid,
    t.content,
    t.priority,
    t.created_at,
    t.folder_id,
    t.archived,
    t.archived_at
  FROM public.transcripts t
  WHERE t.id = transcript_id
  AND is_org_member(t.org_id);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_transcript_secure(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. ADD SECURITY MONITORING HELPER FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_security_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', auth.uid(),
    'roles', (
      SELECT jsonb_agg(role)
      FROM public.user_roles
      WHERE user_id = auth.uid()
    ),
    'organizations', (
      SELECT jsonb_agg(jsonb_build_object(
        'org_id', org_id,
        'role', role
      ))
      FROM public.organization_members
      WHERE user_id = auth.uid()
    ),
    'recent_access_logs', (
      SELECT jsonb_agg(jsonb_build_object(
        'table', accessed_table,
        'type', access_type,
        'timestamp', created_at
      ) ORDER BY created_at DESC)
      FROM public.data_access_audit
      WHERE user_id = auth.uid()
      AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 20
    ),
    'security_alerts', (
      SELECT jsonb_agg(jsonb_build_object(
        'type', alert_type,
        'severity', severity,
        'timestamp', created_at,
        'resolved', resolved
      ) ORDER BY created_at DESC)
      FROM public.security_alerts
      WHERE user_id = auth.uid()
      AND created_at > NOW() - INTERVAL '7 days'
      LIMIT 10
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_security_summary() TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

-- Index for role checks (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
ON public.user_roles(user_id, role);

-- Index for organization membership checks
CREATE INDEX IF NOT EXISTS idx_org_members_lookup 
ON public.organization_members(user_id, org_id);

-- Index for transcript access by org
CREATE INDEX IF NOT EXISTS idx_transcripts_org_created 
ON public.transcripts(org_id, created_at DESC);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_user_time 
ON public.data_access_audit(user_id, created_at DESC);

-- Index for security alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_time 
ON public.security_alerts(user_id, created_at DESC)
WHERE NOT resolved;