-- Phase 1: Critical Database Security Fixes

-- 1. Secure Database Functions - Add SET search_path = public to all functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  new.updated_at := now();
  return new;
end$function$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  select (auth.role() = 'service_role')
      or exists (
           select 1
           from public.organization_members m
           where m.org_id = p_org_id
             and m.user_id = auth.uid()
         );
$function$;

CREATE OR REPLACE FUNCTION public.resolve_greeting(p_phone_e164 text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  with h as (
    select h.*, o.name as biz
    from public.hotline_numbers h
    join public.organizations o on o.id = h.org_id
    where h.phone_e164 = p_phone_e164
  )
  select coalesce(
           replace(
             replace(h.greeting_template, '{{biz}}', h.biz),
             '{{agent}}', h.agent_name
           ),
           'Hi, this is support, powered by TradeLine 24/7!'
         )
  from h
$function$;

CREATE OR REPLACE FUNCTION public.process_event(p_org_id uuid, p_call_sid text, p_kind text, p_payload jsonb, p_idempotency_key text)
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
declare
  v_c  public.calls%rowtype;
  v_tx public.transcripts%rowtype;
begin
  insert into public.events_inbox(org_id, call_sid, kind, payload, idempotency_key)
  values (p_org_id, p_call_sid, p_kind, p_payload, p_idempotency_key)
  on conflict (org_id, idempotency_key) do nothing;

  select c.* into v_c
  from public.calls c
  where c.call_sid = p_call_sid and c.org_id = p_org_id
  limit 1;

  select t.* into v_tx
  from public.transcripts t
  where t.call_sid = p_call_sid and t.org_id = p_org_id
  order by t.created_at desc
  limit 1;
  select v.provider, v.code, v.locale_code
  from public.hotline_voice_prefs p
  join public.supported_voices v on v.code = p.voice_code
  where p.phone_e164 = '+15878839797';

  if p_kind = 'transcript.appended' and v_tx.id is not null then
    insert into public.events_outbox(org_id, call_sid, kind, payload)
    values (p_org_id, p_call_sid, 'notify.agent', jsonb_build_object('len', length(v_tx.content)));
  end if;

  update public.events_inbox
    set processed_at = now()
  where org_id = p_org_id
    and idempotency_key = p_idempotency_key
    and processed_at is null;
end;
$function$;

-- 2. Enhance Bookings Table Security - Add user_id and proper RLS policies
-- Add user_id column to associate bookings with users
ALTER TABLE public.bookings 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance on user queries
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);

-- Drop the existing overly broad service role policy
DROP POLICY IF EXISTS "Service role can manage bookings" ON public.bookings;

-- Create user-specific RLS policies for bookings
-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookings
CREATE POLICY "Users can delete their own bookings" 
ON public.bookings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Keep service role access for system operations (more restricted)
CREATE POLICY "Service role can manage all bookings" 
ON public.bookings 
FOR ALL 
USING (auth.role() = 'service_role'::text) 
WITH CHECK (auth.role() = 'service_role'::text);