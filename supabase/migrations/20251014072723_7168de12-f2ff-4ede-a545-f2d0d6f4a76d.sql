-- 20251014_security_hotfix_v3.sql
-- Idempotent security hardening for TradeLine 24/7

-- ========= Create/replace share_org helper =========
DROP FUNCTION IF EXISTS public.share_org(uuid, uuid);
CREATE FUNCTION public.share_org(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members ma
    JOIN organization_members mb ON mb.org_id = ma.org_id
    WHERE ma.user_id = user_a
      AND mb.user_id = user_b
  );
$$;

-- ========= Ensure has_role exists with app_role signature =========
-- Check if we need the app_role version
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_type t1 ON t1.oid = p.proargtypes[1]
    WHERE n.nspname = 'public' 
      AND p.proname = 'has_role'
      AND t1.typname = 'app_role'
  ) THEN
    CREATE FUNCTION public.has_role(p_user uuid, p_role app_role)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = p_user
          AND role = p_role
      );
    $func$;
  END IF;
END $$;

-- ========= RLS: PROFILES =========
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop dangerous policy if present
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create scoped select policy
DROP POLICY IF EXISTS "profiles_select_scoped" ON public.profiles;
CREATE POLICY "profiles_select_scoped"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR share_org(auth.uid(), profiles.id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create scoped update policy  
DROP POLICY IF EXISTS "profiles_update_scoped" ON public.profiles;
CREATE POLICY "profiles_update_scoped"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- ========= SECURITY DEFINER: enforce search_path = public =========
DO $$
DECLARE 
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname as schema, p.proname as name,
           pg_get_function_identity_arguments(p.oid) as args,
           pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true
      AND n.nspname = 'public'
  LOOP
    IF POSITION('SET search_path = public' IN r.def) = 0 THEN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SECURITY DEFINER SET search_path = public',
        r.schema, r.name, r.args
      );
    END IF;
  END LOOP;
END $$;