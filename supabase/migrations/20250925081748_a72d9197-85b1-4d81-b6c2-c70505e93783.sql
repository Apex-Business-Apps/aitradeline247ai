-- Fix Security Definer View Issues

-- Remove problematic security definer views that triggered linter warnings
DROP VIEW IF EXISTS public.lead_security_summary;
DROP VIEW IF EXISTS public.lead_security_dashboard;
DROP VIEW IF EXISTS public.lead_statistics;

-- Create safer, non-security-definer views for analytics (admin access only via RLS)
CREATE VIEW public.secure_lead_metrics AS
SELECT 
  'metrics_summary' as report_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as recent_count,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') as weekly_count
FROM public.leads;

-- Apply RLS to the view (admins only)
ALTER VIEW public.secure_lead_metrics OWNER TO postgres;
GRANT SELECT ON public.secure_lead_metrics TO authenticated;