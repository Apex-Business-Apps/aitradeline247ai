-- Create leads table for lead capture functionality
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'website_form',
  lead_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads table
CREATE POLICY "Service role can manage leads" 
ON public.leads 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Admins can view leads" 
ON public.leads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create ab_tests table for A/B testing functionality
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL UNIQUE,
  variants JSONB NOT NULL DEFAULT '{}',
  traffic_split JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ab_tests table
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ab_tests table
CREATE POLICY "Service role can manage ab_tests" 
ON public.ab_tests 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Anyone can view active ab_tests" 
ON public.ab_tests 
FOR SELECT 
USING (active = true);

-- Create ab_test_assignments table to track user assignments
CREATE TABLE public.ab_test_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  user_session TEXT NOT NULL,
  variant TEXT NOT NULL,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_name, user_session)
);

-- Enable RLS on ab_test_assignments table
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ab_test_assignments table
CREATE POLICY "Service role can manage ab_test_assignments" 
ON public.ab_test_assignments 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Users can view their own assignments" 
ON public.ab_test_assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own assignments" 
ON public.ab_test_assignments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own assignments" 
ON public.ab_test_assignments 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_ab_tests_test_name ON public.ab_tests(test_name);
CREATE INDEX idx_ab_test_assignments_test_name ON public.ab_test_assignments(test_name);
CREATE INDEX idx_ab_test_assignments_user_session ON public.ab_test_assignments(user_session);

-- Create triggers for updated_at columns
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_ab_tests_updated_at
BEFORE UPDATE ON public.ab_tests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_ab_test_assignments_updated_at
BEFORE UPDATE ON public.ab_test_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();