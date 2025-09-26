-- Enable RLS on all public tables that are missing it
-- This fixes the SUPA_rls_disabled_in_public security finding

-- Enable RLS on bookings table (contains customer PII)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages table (contains communication data)  
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on mvp_dlq table (contains event/error data)
ALTER TABLE public.mvp_dlq ENABLE ROW LEVEL SECURITY;

-- Enable RLS on mvp_inbox_events table (contains event data)
ALTER TABLE public.mvp_inbox_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on mvp_jobs table (contains job processing data)
ALTER TABLE public.mvp_jobs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on hotline_voice_prefs table (contains voice configuration)
ALTER TABLE public.hotline_voice_prefs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on supported_locales table (reference data - can be public read)
ALTER TABLE public.supported_locales ENABLE ROW LEVEL SECURITY;

-- Enable RLS on supported_voices table (reference data - can be public read)
ALTER TABLE public.supported_voices ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings (restrict to service role only for now since no user_id/org_id)
CREATE POLICY "Service role can manage bookings" 
ON public.bookings 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create policies for messages (restrict to service role only)
CREATE POLICY "Service role can manage messages" 
ON public.messages 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create policies for mvp_dlq (system/service role only)
CREATE POLICY "Service role can manage dlq" 
ON public.mvp_dlq 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create policies for mvp_inbox_events (system/service role only)
CREATE POLICY "Service role can manage inbox events" 
ON public.mvp_inbox_events 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create policies for mvp_jobs (system/service role only)
CREATE POLICY "Service role can manage jobs" 
ON public.mvp_jobs 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create policies for hotline_voice_prefs (system/service role only)
CREATE POLICY "Service role can manage voice prefs" 
ON public.hotline_voice_prefs 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create policies for supported_locales (public read access, service role write)
CREATE POLICY "Anyone can view supported locales" 
ON public.supported_locales 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage supported locales" 
ON public.supported_locales 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create policies for supported_voices (public read access, service role write)
CREATE POLICY "Anyone can view supported voices" 
ON public.supported_voices 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage supported voices" 
ON public.supported_voices 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');