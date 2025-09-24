-- Analytics and Lead Scoring Tables
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB,
  user_session TEXT,
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead scoring and management
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  notes TEXT,
  lead_score INTEGER DEFAULT 0,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- A/B Testing Framework
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL UNIQUE,
  variants JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  traffic_split JSONB DEFAULT '{"A": 50, "B": 50}',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ab_test_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  user_session TEXT NOT NULL,
  variant TEXT NOT NULL,
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_name, user_session)
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;

-- Analytics events can be inserted by anyone (public tracking)
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view analytics events" ON public.analytics_events FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Leads policies
CREATE POLICY "Admins can manage all leads" ON public.leads FOR ALL USING (has_role(auth.uid(), 'admin'));

-- A/B testing policies  
CREATE POLICY "Anyone can view active tests" ON public.ab_tests FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage A/B tests" ON public.ab_tests FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert test assignments" ON public.ab_test_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update their test assignments" ON public.ab_test_assignments FOR UPDATE USING (true);
CREATE POLICY "Admins can view test assignments" ON public.ab_test_assignments FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Lead scoring function
CREATE OR REPLACE FUNCTION public.calculate_lead_score(
  company_name TEXT,
  notes_content TEXT,
  email_domain TEXT
) RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger for lead scoring
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_score_lead
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_score_lead();

-- Insert sample A/B test
INSERT INTO public.ab_tests (test_name, variants, traffic_split) VALUES
('hero_cta_test', 
 '{"A": {"text": "Grow Now", "color": "primary"}, "B": {"text": "Start Free Trial", "color": "secondary"}}',
 '{"A": 50, "B": 50}');

-- Add updated_at trigger for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();