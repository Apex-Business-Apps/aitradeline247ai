-- Voice transcripts table for drift detection and quality monitoring
CREATE TABLE IF NOT EXISTS public.voice_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL,
  transcript TEXT NOT NULL,
  captured_fields JSONB DEFAULT '{}',
  model_output TEXT,
  used_kb BOOLEAN DEFAULT FALSE,
  kb_sources TEXT[] DEFAULT '{}',
  drift_flagged BOOLEAN DEFAULT FALSE,
  drift_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.voice_transcripts ENABLE ROW LEVEL SECURITY;

-- Admins can view transcripts
CREATE POLICY "Admins can view voice transcripts"
  ON public.voice_transcripts
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
  );

-- Service role full access
CREATE POLICY "Service role can manage voice transcripts"
  ON public.voice_transcripts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Index for call lookups
CREATE INDEX IF NOT EXISTS idx_voice_transcripts_call_sid ON public.voice_transcripts(call_sid);
CREATE INDEX IF NOT EXISTS idx_voice_transcripts_drift_flagged ON public.voice_transcripts(drift_flagged) WHERE drift_flagged = true;