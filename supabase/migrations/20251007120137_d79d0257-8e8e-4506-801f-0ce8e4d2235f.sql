-- 1) Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Unique constraint to avoid duplicate sessions for same token
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_sessions_user_id_session_token_key'
  ) THEN
    ALTER TABLE public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_session_token_key UNIQUE (user_id, session_token);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

-- updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_sessions_updated_at'
  ) THEN
    CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- RLS Policies
DO $$ BEGIN
  -- Service role full access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions' AND policyname = 'service_role_all_user_sessions'
  ) THEN
    CREATE POLICY "service_role_all_user_sessions"
      ON public.user_sessions
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  -- Users can view their own sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions' AND policyname = 'users_select_own_sessions'
  ) THEN
    CREATE POLICY "users_select_own_sessions"
      ON public.user_sessions
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  -- Users can insert their own sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions' AND policyname = 'users_insert_own_sessions'
  ) THEN
    CREATE POLICY "users_insert_own_sessions"
      ON public.user_sessions
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Users can update their own sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions' AND policyname = 'users_update_own_sessions'
  ) THEN
    CREATE POLICY "users_update_own_sessions"
      ON public.user_sessions
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Users can delete their own sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions' AND policyname = 'users_delete_own_sessions'
  ) THEN
    CREATE POLICY "users_delete_own_sessions"
      ON public.user_sessions
      FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 2) RPC: cleanup_expired_sessions used by edge function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark expired sessions inactive
  UPDATE public.user_sessions
  SET is_active = false
  WHERE is_active = true AND expires_at < now();

  -- Optional: prune very old inactive sessions to keep table small
  DELETE FROM public.user_sessions
  WHERE is_active = false AND expires_at < (now() - INTERVAL '30 days');
END;
$$;