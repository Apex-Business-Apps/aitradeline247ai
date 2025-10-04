-- Add user_id column to support_tickets for secure lookups
ALTER TABLE public.support_tickets
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);

-- Drop the insecure email-based SELECT policy
DROP POLICY IF EXISTS "Users can view their own tickets with uid check" ON public.support_tickets;

-- Create secure SELECT policy using user_id
CREATE POLICY "Users can view their own tickets securely"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_id = auth.uid()
);

-- Update INSERT policy to capture user_id for authenticated users
DROP POLICY IF EXISTS "Anyone can create support tickets" ON public.support_tickets;

CREATE POLICY "Authenticated users can create tickets with user_id"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anonymous users can create tickets without user_id"
ON public.support_tickets
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Add audit logging for ticket access
CREATE OR REPLACE FUNCTION public.audit_support_ticket_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.data_access_audit (
      user_id,
      accessed_table,
      accessed_record_id,
      access_type
    ) VALUES (
      auth.uid(),
      'support_tickets',
      NEW.id::text,
      'ticket_view'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Note: Trigger creation for SELECT is not supported in PostgreSQL
-- Audit logging will be handled at application layer for SELECT operations