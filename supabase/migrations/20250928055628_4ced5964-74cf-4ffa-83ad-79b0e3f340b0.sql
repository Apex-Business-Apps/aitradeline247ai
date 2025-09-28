-- Fix critical RLS security issues for booking tables

-- Enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on appointment_events table  
ALTER TABLE appointment_events ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage appointments
CREATE POLICY "Service role can manage appointments" 
ON appointments 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

-- Create policy for service role to manage appointment events
CREATE POLICY "Service role can manage appointment events" 
ON appointment_events 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');