-- Create ab_tests table for A/B testing functionality (if not exists)
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL UNIQUE,
  variants JSONB NOT NULL DEFAULT '{}',
  traffic_split JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ab_test_assignments table to track user assignments (if not exists)
CREATE TABLE IF NOT EXISTS public.ab_test_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  user_session TEXT NOT NULL,
  variant TEXT NOT NULL,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(test_name, user_session)
);

-- Enable RLS on tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ab_tests') THEN
    ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ab_test_assignments') THEN
    ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for ab_tests table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_tests' AND policyname = 'Service role can manage ab_tests') THEN
    CREATE POLICY "Service role can manage ab_tests" 
    ON public.ab_tests 
    FOR ALL 
    USING (auth.role() = 'service_role'::text)
    WITH CHECK (auth.role() = 'service_role'::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_tests' AND policyname = 'Anyone can view active ab_tests') THEN
    CREATE POLICY "Anyone can view active ab_tests" 
    ON public.ab_tests 
    FOR SELECT 
    USING (active = true);
  END IF;
END $$;

-- Create RLS policies for ab_test_assignments table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_test_assignments' AND policyname = 'Service role can manage ab_test_assignments') THEN
    CREATE POLICY "Service role can manage ab_test_assignments" 
    ON public.ab_test_assignments 
    FOR ALL 
    USING (auth.role() = 'service_role'::text)
    WITH CHECK (auth.role() = 'service_role'::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_test_assignments' AND policyname = 'Users can view their own assignments') THEN
    CREATE POLICY "Users can view their own assignments" 
    ON public.ab_test_assignments 
    FOR SELECT 
    USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_test_assignments' AND policyname = 'Users can insert their own assignments') THEN
    CREATE POLICY "Users can insert their own assignments" 
    ON public.ab_test_assignments 
    FOR INSERT 
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ab_test_assignments' AND policyname = 'Users can update their own assignments') THEN
    CREATE POLICY "Users can update their own assignments" 
    ON public.ab_test_assignments 
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_ab_tests_test_name ON public.ab_tests(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_test_name ON public.ab_test_assignments(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_user_session ON public.ab_test_assignments(user_session);

-- Create triggers for updated_at columns (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ab_tests_updated_at') THEN
    CREATE TRIGGER update_ab_tests_updated_at
    BEFORE UPDATE ON public.ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ab_test_assignments_updated_at') THEN
    CREATE TRIGGER update_ab_test_assignments_updated_at
    BEFORE UPDATE ON public.ab_test_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;