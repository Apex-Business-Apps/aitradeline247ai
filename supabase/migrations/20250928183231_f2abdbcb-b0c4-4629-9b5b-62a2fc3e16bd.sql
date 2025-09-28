-- Create user_views table for saved views and layouts
CREATE TABLE IF NOT EXISTS public.user_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('inbox', 'dashboard')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_views FORCE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "user_views_select" ON public.user_views 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_views_insert" ON public.user_views 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_views_update" ON public.user_views 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_views_delete" ON public.user_views 
FOR DELETE USING (user_id = auth.uid());