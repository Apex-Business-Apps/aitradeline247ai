-- Security Hotfix Part 2: Profiles RLS Only
-- Skip has_role recreation since it has many dependencies
-- Just update profiles policies

-- ============================================================
-- RLS: PROFILES
-- ============================================================

-- Ensure RLS is enabled on profiles table
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop dangerous policy if present (the one that causes infinite recursion)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'profiles'
      AND policyname = 'Authenticated users can view profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Authenticated users can view profiles" ON public.profiles';
  END IF;
END$$;

-- Create/replace policy: view self, same-org, or admin
DO $$
BEGIN
  -- Drop if exists to make idempotent
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'profiles'
      AND policyname = 'Users can view own profile or org members'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view own profile or org members" ON public.profiles';
  END IF;
  
  -- Create the policy
  EXECUTE 'CREATE POLICY "Users can view own profile or org members"
    ON public.profiles
    FOR SELECT
    USING (
      id = auth.uid()
      OR public.share_org(auth.uid(), id)
      OR public.has_role(auth.uid(), ''admin''::app_role)
    )';
END$$;

-- Create/replace policy: users can update own profile
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update own profile" ON public.profiles';
  END IF;
  
  EXECUTE 'CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid())';
END$$;

-- Create/replace policy: service role full access
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'profiles'
      AND policyname = 'Service role can manage profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Service role can manage profiles" ON public.profiles';
  END IF;
  
  EXECUTE 'CREATE POLICY "Service role can manage profiles"
    ON public.profiles
    FOR ALL
    USING (auth.role() = ''service_role''::text)
    WITH CHECK (auth.role() = ''service_role''::text)';
END$$;