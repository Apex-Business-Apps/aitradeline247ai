-- PHASE 1: Critical Database Fixes

-- 1.1 Add missing user_session column to analytics_events
ALTER TABLE public.analytics_events 
ADD COLUMN IF NOT EXISTS user_session TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_analytics_user_session 
ON public.analytics_events(user_session);

-- Add comment for documentation
COMMENT ON COLUMN public.analytics_events.user_session IS 
'Session identifier for tracking anonymous user sessions across events';

-- 1.2 Create safe appointments view without PII
CREATE OR REPLACE VIEW appointments_safe AS
SELECT 
  id,
  organization_id,
  start_at,
  end_at,
  status,
  source,
  tz,
  note,
  created_at,
  -- Boolean flags instead of actual data
  (email IS NOT NULL) as has_email,
  (e164 IS NOT NULL) as has_phone,
  (first_name IS NOT NULL) as has_name
FROM public.appointments;

-- Grant access to authenticated users
GRANT SELECT ON appointments_safe TO authenticated;

-- PHASE 3: PII Protection Enhancements

-- 3.1 Restrict voice configuration access to organization members only
DROP POLICY IF EXISTS "Authenticated users can view supported voices" ON public.supported_voices;

CREATE POLICY "Organization members can view voices"
ON public.supported_voices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

-- 3.2 Strengthen support tickets access with uid check
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;

CREATE POLICY "Users can view their own tickets with uid check"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (email = auth.email() AND auth.uid() IS NOT NULL)
);