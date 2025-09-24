-- Fix leads table RLS policies to secure customer data while allowing lead capture

-- Add policy for anonymous users to insert new leads (needed for contact form)
CREATE POLICY "Anonymous users can insert leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

-- Ensure only authenticated admins can view, update, or delete leads
-- (The existing "Admins can manage all leads" policy already covers SELECT, UPDATE, DELETE for admins)