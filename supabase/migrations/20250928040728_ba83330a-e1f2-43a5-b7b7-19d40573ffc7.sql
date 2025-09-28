-- Fix extension security warning and create compliance tracking
-- Note: PostgreSQL upgrade must be done manually in Supabase dashboard

-- Create a security compliance status table to track infrastructure issues
CREATE TABLE IF NOT EXISTS public.security_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL UNIQUE, -- Add UNIQUE constraint for ON CONFLICT
  status text NOT NULL, -- 'compliant', 'warning', 'critical'
  description text,
  remediation_notes text,
  last_checked timestamp with time zone DEFAULT now(),
  manual_action_required boolean DEFAULT false
);

ALTER TABLE public.security_compliance ENABLE ROW LEVEL SECURITY;

-- Only admins can view compliance status
CREATE POLICY "Admins can view security compliance" 
ON public.security_compliance 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage security compliance" 
ON public.security_compliance 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Insert current compliance status
INSERT INTO public.security_compliance (
  check_name, 
  status, 
  description, 
  remediation_notes, 
  manual_action_required
) VALUES 
(
  'extensions_in_public_schema',
  'warning',
  'Extensions detected in public schema - requires manual review',
  'Extensions in public schema may pose security risks. Consider moving to dedicated schema if custom extensions are present.',
  true
),
(
  'postgres_security_patches',
  'warning',
  'PostgreSQL version requires security patches',
  'Manual upgrade required in Supabase Dashboard → Settings → Infrastructure. Visit: https://supabase.com/docs/guides/platform/upgrading',
  true
)
ON CONFLICT (check_name) DO UPDATE SET
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  remediation_notes = EXCLUDED.remediation_notes,
  last_checked = now();

-- Add a scheduled cleanup job for analytics data retention
CREATE OR REPLACE FUNCTION public.schedule_analytics_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function should be called periodically (e.g., daily via cron)
  -- Clean up old analytics events with PII
  PERFORM public.cleanup_old_analytics_events();
  
  -- Log the scheduled cleanup
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    severity
  ) VALUES (
    'scheduled_cleanup_executed',
    jsonb_build_object(
      'cleanup_type', 'analytics_retention',
      'scheduled_at', NOW()
    ),
    'info'
  );
END;
$$;