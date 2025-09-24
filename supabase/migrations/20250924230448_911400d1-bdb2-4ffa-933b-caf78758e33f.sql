-- Fix security linter warnings

-- Fix Function Search Path Mutable warning
-- Update the log_security_event function to have a stable search_path
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any attempts to access sensitive data
  INSERT INTO public.analytics_events (
    event_type,
    event_data,
    user_session,
    page_url
  ) VALUES (
    'security_audit',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'user_id', auth.uid(),
      'timestamp', now()
    ),
    COALESCE(auth.uid()::text, 'anonymous'),
    'security_monitor'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update other functions to have stable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Determine role based on email
  IF NEW.email IN (
    'ceo@tradeline247ai.com',
    'info@tradeline247ai.com', 
    'support@tradeline247ai.com',
    'rjp@tradeline247ai.com'
  ) THEN
    user_role := 'admin';
  ELSE
    user_role := 'user';
  END IF;
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auto_score_lead()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
BEGIN
  -- Extract email domain
  email_domain := split_part(NEW.email, '@', 2);
  
  -- Calculate and set lead score
  NEW.lead_score := public.calculate_lead_score(
    NEW.company,
    NEW.notes,
    email_domain
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.calculate_lead_score(company_name text, notes_content text, email_domain text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  score INTEGER := 0;
  company_keywords TEXT[] := ARRAY['enterprise', 'corporation', 'inc', 'llc', 'ltd', 'group', 'solutions', 'technologies', 'consulting'];
  high_value_keywords TEXT[] := ARRAY['urgent', 'asap', 'budget', 'decision maker', 'ceo', 'cto', 'vp', 'director', 'manager'];
  business_domains TEXT[] := ARRAY['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
BEGIN
  -- Base score for any lead
  score := 10;
  
  -- Company name analysis
  IF company_name IS NOT NULL THEN
    -- Check for business indicators in company name
    FOR i IN 1..array_length(company_keywords, 1) LOOP
      IF LOWER(company_name) LIKE '%' || company_keywords[i] || '%' THEN
        score := score + 15;
        EXIT; -- Only add points once for company indicators
      END IF;
    END LOOP;
    
    -- Longer company names often indicate established businesses
    IF LENGTH(company_name) > 20 THEN
      score := score + 10;
    END IF;
  END IF;
  
  -- Email domain analysis
  IF email_domain IS NOT NULL THEN
    -- Penalize personal email domains
    FOR i IN 1..array_length(business_domains, 1) LOOP
      IF LOWER(email_domain) = business_domains[i] THEN
        score := score - 20;
        EXIT;
      END IF;
    END LOOP;
    
    -- Reward business email domains
    IF email_domain NOT LIKE ANY(business_domains) THEN
      score := score + 25;
    END IF;
  END IF;
  
  -- Notes content analysis
  IF notes_content IS NOT NULL AND LENGTH(notes_content) > 0 THEN
    -- Reward detailed notes
    IF LENGTH(notes_content) > 50 THEN
      score := score + 15;
    END IF;
    
    -- Check for high-value keywords
    FOR i IN 1..array_length(high_value_keywords, 1) LOOP
      IF LOWER(notes_content) LIKE '%' || high_value_keywords[i] || '%' THEN
        score := score + 20;
      END IF;
    END LOOP;
    
    -- Check for volume indicators
    IF LOWER(notes_content) ~ '\d+.*calls?\s*(per|a|/).*day' THEN
      score := score + 30;
    END IF;
  END IF;
  
  -- Ensure score is within reasonable bounds
  IF score < 0 THEN score := 0; END IF;
  IF score > 100 THEN score := 100; END IF;
  
  RETURN score;
END;
$function$;