-- Create storage bucket for forwarding kits
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create twilio_quickstart_configs table
CREATE TABLE IF NOT EXISTS public.twilio_quickstart_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  phone_sid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  fallback_e164 TEXT NOT NULL,
  voice_url TEXT NOT NULL,
  status_callback TEXT NOT NULL,
  failover_url TEXT,
  messaging_service_enrolled BOOLEAN DEFAULT false,
  forwarding_kit_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.twilio_quickstart_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view twilio_quickstart_configs"
  ON public.twilio_quickstart_configs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage twilio_quickstart_configs"
  ON public.twilio_quickstart_configs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index
CREATE INDEX idx_quickstart_configs_tenant ON public.twilio_quickstart_configs(tenant_id);

-- Add trigger for updated_at
CREATE TRIGGER update_twilio_quickstart_configs_updated_at
  BEFORE UPDATE ON public.twilio_quickstart_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage policies for documents bucket
CREATE POLICY "Public can view documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "Service role can upload documents"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Service role can update documents"
  ON storage.objects
  FOR UPDATE
  TO service_role
  USING (bucket_id = 'documents');
