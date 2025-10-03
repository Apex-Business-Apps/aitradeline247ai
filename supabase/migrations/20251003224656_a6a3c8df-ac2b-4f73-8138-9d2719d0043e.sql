-- Tables for semantic command system

-- Folders for organizing content
CREATE TABLE IF NOT EXISTS public.content_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_folder_id UUID REFERENCES public.content_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_folder_name_per_org UNIQUE(organization_id, name, parent_folder_id)
);

CREATE INDEX idx_content_folders_org ON public.content_folders(organization_id);

-- Tags for content
CREATE TABLE IF NOT EXISTS public.content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_tag_name_per_org UNIQUE(organization_id, name)
);

CREATE INDEX idx_content_tags_org ON public.content_tags(organization_id);

-- Junction table for tagging content
CREATE TABLE IF NOT EXISTS public.content_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type embedding_content_type NOT NULL,
  content_id TEXT NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.content_tags(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_tag_assignment UNIQUE(content_type, content_id, tag_id)
);

CREATE INDEX idx_tag_assignments_content ON public.content_tag_assignments(content_type, content_id);
CREATE INDEX idx_tag_assignments_tag ON public.content_tag_assignments(tag_id);

-- Command execution history
CREATE TABLE IF NOT EXISTS public.semantic_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  command_text TEXT NOT NULL,
  command_embedding vector(1536),
  operation TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'partial_success', 'failed', 'cancelled')),
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_semantic_commands_user ON public.semantic_commands(user_id);
CREATE INDEX idx_semantic_commands_org ON public.semantic_commands(organization_id);
CREATE INDEX idx_semantic_commands_status ON public.semantic_commands(status);
CREATE INDEX idx_semantic_commands_created ON public.semantic_commands(created_at DESC);

-- Execution tokens for confirming actions
CREATE TABLE IF NOT EXISTS public.command_execution_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id UUID NOT NULL REFERENCES public.semantic_commands(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  plan_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_execution_tokens_token ON public.command_execution_tokens(token);
CREATE INDEX idx_execution_tokens_expires ON public.command_execution_tokens(expires_at);

-- Command execution results
CREATE TABLE IF NOT EXISTS public.command_execution_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id UUID NOT NULL REFERENCES public.semantic_commands(id) ON DELETE CASCADE,
  content_type embedding_content_type NOT NULL,
  content_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_execution_results_command ON public.command_execution_results(command_id);

-- Add folder_id to content tables if needed (optional - depends on content structure)
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.content_folders(id) ON DELETE SET NULL;
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high'));

-- RLS Policies
ALTER TABLE public.content_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semantic_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_execution_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_execution_results ENABLE ROW LEVEL SECURITY;

-- Folders: org members can manage
CREATE POLICY "Org members can view folders"
  ON public.content_folders FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can create folders"
  ON public.content_folders FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update folders"
  ON public.content_folders FOR UPDATE
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can delete folders"
  ON public.content_folders FOR DELETE
  USING (is_org_member(organization_id));

-- Tags: org members can manage
CREATE POLICY "Org members can view tags"
  ON public.content_tags FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can create tags"
  ON public.content_tags FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can update tags"
  ON public.content_tags FOR UPDATE
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can delete tags"
  ON public.content_tags FOR DELETE
  USING (is_org_member(organization_id));

-- Tag assignments: org members can manage
CREATE POLICY "Org members can view tag assignments"
  ON public.content_tag_assignments FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org members can create tag assignments"
  ON public.content_tag_assignments FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY "Org members can delete tag assignments"
  ON public.content_tag_assignments FOR DELETE
  USING (is_org_member(organization_id));

-- Commands: users can view their own
CREATE POLICY "Users can view own commands"
  ON public.semantic_commands FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage commands"
  ON public.semantic_commands FOR ALL
  USING (auth.role() = 'service_role');

-- Execution tokens: users can view their own
CREATE POLICY "Users can view own tokens"
  ON public.command_execution_tokens FOR SELECT
  USING (
    command_id IN (
      SELECT id FROM public.semantic_commands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage tokens"
  ON public.command_execution_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- Results: users can view their command results
CREATE POLICY "Users can view own results"
  ON public.command_execution_results FOR SELECT
  USING (
    command_id IN (
      SELECT id FROM public.semantic_commands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage results"
  ON public.command_execution_results FOR ALL
  USING (auth.role() = 'service_role');

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.command_execution_tokens
  WHERE expires_at < now() AND NOT used;
END;
$$;