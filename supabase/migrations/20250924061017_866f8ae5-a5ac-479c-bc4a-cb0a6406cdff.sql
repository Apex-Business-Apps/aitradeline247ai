-- Fix security issue: Restrict lead viewing to admins only
-- This prevents unauthorized users from reading customer lead information

-- Add explicit SELECT policy for leads table that only allows admins to view leads
CREATE POLICY "Only admins can view leads" ON public.leads
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Note: The existing policies remain:
-- 1. "Admins can manage all leads" (ALL operations for admins)
-- 2. "Anonymous users can insert leads" (INSERT for anonymous users)
-- This new policy ensures that only admins can SELECT/read lead data