-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'moderator');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles 
     WHERE user_id = _user_id 
     ORDER BY CASE role 
       WHEN 'admin' THEN 1 
       WHEN 'moderator' THEN 2 
       WHEN 'user' THEN 3 
     END 
     LIMIT 1),
    'user'::app_role
  )
$$;

-- Create analytics_events table for security monitoring
CREATE TABLE public.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    ip_address inet,
    user_agent text,
    event_data jsonb DEFAULT '{}',
    severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for analytics_events  
CREATE POLICY "Admins can view all analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage analytics events"
ON public.analytics_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enhanced phone number protection for profiles table
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "Users can view own profile, admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

-- Add audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid DEFAULT auth.uid(),
  p_session_id text DEFAULT NULL,
  p_event_data jsonb DEFAULT '{}',
  p_severity text DEFAULT 'info'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analytics_events (
    event_type,
    user_id,
    session_id,
    event_data,
    severity
  ) VALUES (
    p_event_type,
    p_user_id,
    p_session_id,
    p_event_data,
    p_severity
  );
END;
$$;

-- Create phone number masking function for non-admin users
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone_e164 text, requesting_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return full phone number for admins, masked for others
  IF public.has_role(requesting_user_id, 'admin') THEN
    RETURN phone_e164;
  ELSE
    -- Mask middle digits, keep country code and last 4
    RETURN CASE 
      WHEN phone_e164 IS NULL THEN NULL
      WHEN LENGTH(phone_e164) > 6 THEN 
        LEFT(phone_e164, 2) || '***' || RIGHT(phone_e164, 4)
      ELSE '***' || RIGHT(phone_e164, 2)
    END;
  END IF;
END;
$$;