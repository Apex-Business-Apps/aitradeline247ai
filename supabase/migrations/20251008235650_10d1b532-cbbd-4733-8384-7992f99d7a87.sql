-- PROMPT DF-3: Constraints audit (dedupe hardening)
-- Ensures idempotency by preventing duplicate webhook deliveries from creating multiple rows

-- DF-3.1: Ensure call_sid uniqueness on calls table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'calls_call_sid_unique'
  ) THEN
    ALTER TABLE public.calls ADD CONSTRAINT calls_call_sid_unique UNIQUE (call_sid);
  END IF;
END $$;

-- DF-3.2: Ensure call_sid uniqueness on call_logs table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'call_logs_call_sid_unique'
  ) THEN
    ALTER TABLE public.call_logs ADD CONSTRAINT call_logs_call_sid_unique UNIQUE (call_sid);
  END IF;
END $$;

-- DF-3.3: Ensure (source, external_id) uniqueness on sms_reply_logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sms_reply_logs_source_external_id_unique'
  ) THEN
    ALTER TABLE public.sms_reply_logs ADD CONSTRAINT sms_reply_logs_source_external_id_unique UNIQUE (source, external_id);
  END IF;
END $$;

-- DF-3.4: Ensure message_sid uniqueness on sms_status_logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sms_status_logs_message_sid_unique'
  ) THEN
    ALTER TABLE public.sms_status_logs ADD CONSTRAINT sms_status_logs_message_sid_unique UNIQUE (message_sid);
  END IF;
END $$;

-- DF-3.5: Ensure number_e164 uniqueness on twilio_endpoints (already exists, verify)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'twilio_endpoints_number_e164_unique'
  ) THEN
    ALTER TABLE public.twilio_endpoints ADD CONSTRAINT twilio_endpoints_number_e164_unique UNIQUE (number_e164);
  END IF;
END $$;

-- DF-3.6: Ensure call_sid uniqueness on voice_stream_logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'voice_stream_logs_call_sid_unique'
  ) THEN
    ALTER TABLE public.voice_stream_logs ADD CONSTRAINT voice_stream_logs_call_sid_unique UNIQUE (call_sid);
  END IF;
END $$;

-- Acceptance: Retried webhooks will now fail constraint violation instead of creating duplicates
-- Functions should use UPSERT (ON CONFLICT) to handle retries gracefully
COMMENT ON CONSTRAINT calls_call_sid_unique ON public.calls IS 'DF-3: Prevents duplicate CallSid entries from webhook retries';
COMMENT ON CONSTRAINT sms_reply_logs_source_external_id_unique ON public.sms_reply_logs IS 'DF-3: Prevents duplicate MessageSid entries from webhook retries';
COMMENT ON CONSTRAINT sms_status_logs_message_sid_unique ON public.sms_status_logs IS 'DF-3: Prevents duplicate status updates from webhook retries';