-- ============================================================
-- NON-DESTRUCTIVE FIX: Disable auto-encryption trigger temporarily
-- Allows testing security fixes without breaking existing queries
-- ============================================================

-- Drop the auto-encryption trigger (can be re-enabled later)
DROP TRIGGER IF EXISTS encrypt_appointments_before_insert ON public.appointments;

-- Keep the encryption functions available for manual use
-- But don't auto-encrypt yet until frontend is updated

-- Add comment explaining the temporary state
COMMENT ON FUNCTION public.encrypt_pii(TEXT) IS 
'PII encryption function. Currently available but not auto-triggered. 
Enable trigger "encrypt_appointments_before_insert" when frontend is ready to use encrypted columns.';

-- Log the change
INSERT INTO public.analytics_events (
  event_type,
  event_data,
  severity
) VALUES (
  'security_config_change',
  jsonb_build_object(
    'action', 'encryption_trigger_disabled_for_testing',
    'reason', 'Prevent breaking existing queries during rollout',
    'can_reenable', true,
    'timestamp', NOW()
  ),
  'info'
);