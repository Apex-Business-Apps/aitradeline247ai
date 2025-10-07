-- Create contact_messages table with strict RLS
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Service role can insert
CREATE POLICY "service_role_insert_contact" ON public.contact_messages
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admins can view
CREATE POLICY "admins_view_contact" ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Block all other access
CREATE POLICY "block_public_select" ON public.contact_messages
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "block_public_update" ON public.contact_messages
  FOR UPDATE
  USING (false);

CREATE POLICY "block_public_delete" ON public.contact_messages
  FOR DELETE
  USING (false);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);