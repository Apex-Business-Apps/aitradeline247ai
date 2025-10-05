-- SMS Delivery Observability: Track message lifecycle and failures
-- Stores detailed delivery status for all outbound SMS messages

CREATE TABLE IF NOT EXISTS public.sms_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_sid text NOT NULL UNIQUE,
  to_e164 text NOT NULL,
  from_e164 text,
  body_preview text, -- First 100 chars for reference
  status text NOT NULL, -- queued, sending, sent, delivered, undelivered, failed
  status_updated_at timestamptz NOT NULL DEFAULT now(),
  error_code text, -- Twilio error code (30003, 30007, etc.)
  error_message text,
  price numeric(10,4), -- Cost in USD
  price_unit text, -- Currency (USD)
  num_segments integer, -- Number of message segments
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_sms_delivery_log_message_sid ON public.sms_delivery_log(message_sid);
CREATE INDEX IF NOT EXISTS idx_sms_delivery_log_to_e164 ON public.sms_delivery_log(to_e164);
CREATE INDEX IF NOT EXISTS idx_sms_delivery_log_status ON public.sms_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_sms_delivery_log_created_at ON public.sms_delivery_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_delivery_log_error_code ON public.sms_delivery_log(error_code) WHERE error_code IS NOT NULL;

-- RLS policies
ALTER TABLE public.sms_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage SMS delivery log"
ON public.sms_delivery_log
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view SMS delivery log"
ON public.sms_delivery_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to get delivery statistics
CREATE OR REPLACE FUNCTION public.get_sms_delivery_stats(hours_ago integer DEFAULT 24)
RETURNS TABLE(
  total_messages bigint,
  delivered bigint,
  failed bigint,
  pending bigint,
  delivery_rate numeric,
  common_errors jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
      COUNT(*) FILTER (WHERE status IN ('failed', 'undelivered')) as failed_count,
      COUNT(*) FILTER (WHERE status IN ('queued', 'sending', 'sent')) as pending_count
    FROM sms_delivery_log
    WHERE created_at > (NOW() - (hours_ago || ' hours')::INTERVAL)
  ),
  errors AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'error_code', error_code,
        'count', count,
        'sample_message', sample_message
      ) ORDER BY count DESC
    ) as error_list
    FROM (
      SELECT 
        error_code,
        COUNT(*) as count,
        MAX(error_message) as sample_message
      FROM sms_delivery_log
      WHERE error_code IS NOT NULL
        AND created_at > (NOW() - (hours_ago || ' hours')::INTERVAL)
      GROUP BY error_code
      ORDER BY count DESC
      LIMIT 5
    ) t
  )
  SELECT
    stats.total,
    stats.delivered_count,
    stats.failed_count,
    stats.pending_count,
    CASE 
      WHEN stats.total > 0 THEN ROUND((stats.delivered_count::numeric / stats.total::numeric) * 100, 2)
      ELSE 0
    END as delivery_rate,
    COALESCE(errors.error_list, '[]'::jsonb) as common_errors
  FROM stats, errors;
END;
$$;

COMMENT ON TABLE public.sms_delivery_log IS 'SMS delivery lifecycle tracking with error codes';
COMMENT ON FUNCTION public.get_sms_delivery_stats IS 'Get SMS delivery statistics for specified time window';
