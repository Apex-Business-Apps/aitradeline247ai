-- P13: Compliance & Privacy Ops - DSAR and Audit Infrastructure
-- PIPEDA/CASL compliance tables and functions

-- ========= DSAR Requests Table =========
CREATE TABLE IF NOT EXISTS public.dsar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  initiated_by UUID REFERENCES auth.users(id),
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  evidence_artifact_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsar_requests_status ON public.dsar_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsar_requests_user_id ON public.dsar_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dsar_requests_created_at ON public.dsar_requests(created_at);

-- ========= Consent Access Audit Table =========
CREATE TABLE IF NOT EXISTS public.consent_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  accessed_by UUID REFERENCES auth.users(id),
  access_type TEXT NOT NULL,
  consent_id UUID,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_access_audit_user_id ON public.consent_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_access_audit_created_at ON public.consent_access_audit(created_at);

-- ========= Data Retention Policies Table =========
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  date_column TEXT NOT NULL DEFAULT 'created_at',
  deletion_criteria JSONB DEFAULT '{}'::jsonb,
  last_enforced_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(table_name)
);

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, date_column, deletion_criteria)
VALUES 
  ('call_logs', 2555, 'created_at', '{"recording_url": "not_null"}'::jsonb), -- 7 years for call recordings (Canadian telecom requirement)
  ('analytics_events', 90, 'created_at', '{}'::jsonb), -- 90 days for analytics
  ('consent_logs', 2555, 'created_at', '{}'::jsonb), -- 7 years for consent records
  ('data_access_audit', 365, 'created_at', '{}'::jsonb), -- 1 year for audit logs
  ('security_alerts', 730, 'created_at', '{}'::jsonb) -- 2 years for security events
ON CONFLICT (table_name) DO NOTHING;

-- ========= RLS Policies =========
ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_access_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- DSAR requests: admins can view all, users can view their own
CREATE POLICY "Admins can manage DSAR requests"
ON public.dsar_requests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own DSAR requests"
ON public.dsar_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Consent access audit: admins only
CREATE POLICY "Admins can view consent access audit"
ON public.consent_access_audit
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert consent audit"
ON public.consent_access_audit
FOR INSERT
TO service_role
WITH CHECK (true);

-- Retention policies: admins can view, service role can manage
CREATE POLICY "Admins can view retention policies"
ON public.data_retention_policies
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage retention policies"
ON public.data_retention_policies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========= Audit Function =========
CREATE OR REPLACE FUNCTION public.audit_consent_access()
RETURNS TABLE(
  total_accesses BIGINT,
  unique_users BIGINT,
  by_access_type JSONB,
  recent_accesses JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH accesses AS (
    SELECT 
      user_id,
      accessed_by,
      access_type,
      created_at,
      consent_id
    FROM consent_access_audit
    WHERE created_at > (NOW() - INTERVAL '24 hours')
  )
  SELECT
    (SELECT COUNT(*)::BIGINT FROM accesses) as total_accesses,
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM accesses WHERE user_id IS NOT NULL) as unique_users,
    (SELECT jsonb_object_agg(access_type, count)
     FROM (
       SELECT access_type, COUNT(*) as count
       FROM accesses
       GROUP BY access_type
     ) t) as by_access_type,
    (SELECT jsonb_agg(jsonb_build_object(
      'user_id', user_id,
      'accessed_by', accessed_by,
      'access_type', access_type,
      'timestamp', created_at,
      'consent_id', consent_id
    ) ORDER BY created_at DESC)
    FROM accesses
    LIMIT 50) as recent_accesses;
END;
$$;

-- ========= Retention Enforcement Function =========
CREATE OR REPLACE FUNCTION public.enforce_data_retention()
RETURNS TABLE(
  policy_name TEXT,
  rows_deleted BIGINT,
  executed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy RECORD;
  deleted_count BIGINT;
BEGIN
  FOR policy IN 
    SELECT * FROM data_retention_policies 
    WHERE active = true
  LOOP
    EXECUTE format(
      'DELETE FROM %I WHERE %I < NOW() - INTERVAL ''%s days''',
      policy.table_name,
      policy.date_column,
      policy.retention_days
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Update last enforced timestamp
    UPDATE data_retention_policies
    SET last_enforced_at = NOW()
    WHERE id = policy.id;
    
    -- Log the enforcement
    INSERT INTO analytics_events (event_type, event_data, severity)
    VALUES (
      'retention_enforcement',
      jsonb_build_object(
        'policy_id', policy.id,
        'table_name', policy.table_name,
        'rows_deleted', deleted_count,
        'retention_days', policy.retention_days
      ),
      'info'
    );
    
    RETURN QUERY SELECT 
      policy.table_name::TEXT,
      deleted_count,
      NOW();
  END LOOP;
END;
$$;