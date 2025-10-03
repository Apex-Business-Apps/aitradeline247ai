-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for content types that can be embedded
CREATE TYPE public.embedding_content_type AS ENUM (
  'email',
  'transcript',
  'thread',
  'appointment',
  'note'
);

-- Main embeddings table
CREATE TABLE public.content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content reference
  content_type public.embedding_content_type NOT NULL,
  content_id TEXT NOT NULL,
  
  -- User/org context
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Embedding data (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536) NOT NULL,
  
  -- Metadata for filtering
  content_text TEXT NOT NULL,
  content_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  content_date TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata as JSONB for flexibility
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Ensure unique embeddings per content item
  UNIQUE(content_type, content_id)
);

-- Create index for vector similarity search (using HNSW for better performance)
CREATE INDEX content_embeddings_vector_idx ON public.content_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Additional indexes for filtering
CREATE INDEX content_embeddings_user_id_idx ON public.content_embeddings(user_id);
CREATE INDEX content_embeddings_org_id_idx ON public.content_embeddings(organization_id);
CREATE INDEX content_embeddings_content_type_idx ON public.content_embeddings(content_type);
CREATE INDEX content_embeddings_created_at_idx ON public.content_embeddings(created_at DESC);

-- Enable RLS
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access embeddings for their org
CREATE POLICY "Users can view embeddings in their org"
  ON public.content_embeddings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Service role can insert/update embeddings
CREATE POLICY "Service role can manage embeddings"
  ON public.content_embeddings
  FOR ALL
  USING (auth.role() = 'service_role');

-- RPC: Semantic search function
CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_content_type public.embedding_content_type DEFAULT NULL,
  filter_user_id uuid DEFAULT NULL,
  filter_org_id uuid DEFAULT NULL,
  filter_date_from timestamp with time zone DEFAULT NULL,
  filter_date_to timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content_type public.embedding_content_type,
  content_id text,
  content_text text,
  content_summary text,
  similarity float,
  metadata jsonb,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.content_type,
    ce.content_id,
    ce.content_text,
    ce.content_summary,
    1 - (ce.embedding <=> query_embedding) as similarity,
    ce.metadata,
    ce.created_at
  FROM public.content_embeddings ce
  WHERE 
    (1 - (ce.embedding <=> query_embedding)) > match_threshold
    AND (filter_content_type IS NULL OR ce.content_type = filter_content_type)
    AND (filter_user_id IS NULL OR ce.user_id = filter_user_id)
    AND (filter_org_id IS NULL OR ce.organization_id = filter_org_id)
    AND (filter_date_from IS NULL OR ce.content_date >= filter_date_from)
    AND (filter_date_to IS NULL OR ce.content_date <= filter_date_to)
    AND ce.organization_id IN (
      SELECT org_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;