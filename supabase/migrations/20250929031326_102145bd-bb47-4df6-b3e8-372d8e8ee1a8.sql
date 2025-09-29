-- CRITICAL SECURITY FIX: Secure support_tickets table
-- The current policy allows public access to customer support data

-- Drop the insecure policy that allows unrestricted access
DROP POLICY IF EXISTS "Service role manage" ON public.support_tickets;

-- Create secure policies for support tickets
-- 1. Service role can manage all tickets (for system operations)
CREATE POLICY "Service role can manage support tickets"
ON public.support_tickets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Admins can view and manage all tickets
CREATE POLICY "Admins can manage all support tickets"
ON public.support_tickets
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Anyone can create support tickets (for customer submissions)
CREATE POLICY "Anyone can create support tickets"
ON public.support_tickets
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4. Authenticated users can view their own tickets by email
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  -- Allow if user is admin OR if ticket email matches user's auth email
  has_role(auth.uid(), 'admin'::app_role) OR 
  email = auth.email()
);