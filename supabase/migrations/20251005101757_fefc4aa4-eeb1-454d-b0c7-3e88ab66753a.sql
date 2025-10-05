-- CASL Compliance: Opt-out and consent tracking for SMS
-- Stores consent and opt-out status for phone numbers

CREATE TABLE IF NOT EXISTS public.sms_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  e164 text NOT NULL UNIQUE,
  opted_in boolean NOT NULL DEFAULT false,
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  consent_source text, -- 'web_form', 'voice_call', 'manual', etc.
  consent_method text, -- 'express', 'implied'
  business_relationship text, -- Why we have consent
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sms_consent_e164 ON public.sms_consent(e164);
CREATE INDEX IF NOT EXISTS idx_sms_consent_opted_in ON public.sms_consent(e164, opted_in);

-- RLS policies
ALTER TABLE public.sms_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage SMS consent"
ON public.sms_consent
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view SMS consent"
ON public.sms_consent
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to check if number is opted in
CREATE OR REPLACE FUNCTION public.is_opted_in(phone_e164 text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT opted_in FROM public.sms_consent WHERE e164 = phone_e164 LIMIT 1),
    false
  );
$$;

-- Function to record opt-out
CREATE OR REPLACE FUNCTION public.record_opt_out(phone_e164 text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.sms_consent (e164, opted_in, opted_out_at)
  VALUES (phone_e164, false, now())
  ON CONFLICT (e164) 
  DO UPDATE SET 
    opted_in = false,
    opted_out_at = now(),
    updated_at = now();
$$;

-- Function to record opt-in
CREATE OR REPLACE FUNCTION public.record_opt_in(
  phone_e164 text,
  source text DEFAULT 'manual',
  method text DEFAULT 'express',
  relationship text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.sms_consent (
    e164, 
    opted_in, 
    opted_in_at, 
    consent_source,
    consent_method,
    business_relationship
  )
  VALUES (phone_e164, true, now(), source, method, relationship)
  ON CONFLICT (e164) 
  DO UPDATE SET 
    opted_in = true,
    opted_in_at = now(),
    consent_source = EXCLUDED.consent_source,
    consent_method = EXCLUDED.consent_method,
    business_relationship = EXCLUDED.business_relationship,
    updated_at = now();
$$;

COMMENT ON TABLE public.sms_consent IS 'CASL-compliant consent and opt-out tracking for SMS messaging';
COMMENT ON FUNCTION public.is_opted_in IS 'Check if phone number has active SMS consent';
COMMENT ON FUNCTION public.record_opt_out IS 'Record SMS opt-out (STOP command)';
COMMENT ON FUNCTION public.record_opt_in IS 'Record SMS opt-in with consent metadata';
