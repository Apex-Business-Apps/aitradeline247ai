-- Fix security warnings: Add search_path to functions

-- Update calculate_lead_score function with search_path
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Update auto_score_lead function with search_path
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;