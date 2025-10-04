-- ============================================================================
-- RAG REBUILD: Database Foundations + RPCs
-- CTO Lockbox - Touch ONLY RAG assets
-- ============================================================================

-- STEP 1: Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- STEP 1: Create enum for source types
DO $$ BEGIN
  CREATE TYPE rag_source_type AS ENUM ('transcript', 'email', 'doc', 'faq', 'web');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- STEP 1: Create rag_sources table (canonical registry)
CREATE TABLE IF NOT EXISTS public.rag_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type rag_source_type NOT NULL,
  external_id TEXT NOT NULL UNIQUE,
  title TEXT,
  uri TEXT,
  lang TEXT DEFAULT 'en',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 1: Create rag_chunks table (normalized chunk store)
CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.rag_sources(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  token_count INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, chunk_index)
);

-- STEP 1: Create rag_embeddings table (vector store)
CREATE TABLE IF NOT EXISTS public.rag_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL UNIQUE REFERENCES public.rag_chunks(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL,
  norm FLOAT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 1: Create HNSW index on embeddings
CREATE INDEX IF NOT EXISTS idx_rag_embeddings_hnsw 
ON public.rag_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- STEP 1: Enable RLS on all RAG tables
ALTER TABLE public.rag_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_embeddings ENABLE ROW LEVEL SECURITY;

-- STEP 1: RLS policies - read=true, write=service role only
DROP POLICY IF EXISTS "Anyone can read rag_sources" ON public.rag_sources;
CREATE POLICY "Anyone can read rag_sources" 
ON public.rag_sources FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Service role can manage rag_sources" ON public.rag_sources;
CREATE POLICY "Service role can manage rag_sources" 
ON public.rag_sources FOR ALL 
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can read rag_chunks" ON public.rag_chunks;
CREATE POLICY "Anyone can read rag_chunks" 
ON public.rag_chunks FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Service role can manage rag_chunks" ON public.rag_chunks;
CREATE POLICY "Service role can manage rag_chunks" 
ON public.rag_chunks FOR ALL 
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can read rag_embeddings" ON public.rag_embeddings;
CREATE POLICY "Anyone can read rag_embeddings" 
ON public.rag_embeddings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Service role can manage rag_embeddings" ON public.rag_embeddings;
CREATE POLICY "Service role can manage rag_embeddings" 
ON public.rag_embeddings FOR ALL 
USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 2: RPCs
-- ============================================================================

-- RPC: rag_match - Deterministic retrieval with filtering
CREATE OR REPLACE FUNCTION public.rag_match(
  query_vector VECTOR(1536),
  top_k INTEGER DEFAULT 10,
  filter JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  chunk_id UUID,
  source_id UUID,
  score FLOAT,
  snippet TEXT,
  source_type TEXT,
  uri TEXT,
  meta JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS chunk_id,
    c.source_id,
    (1 - (e.embedding <=> query_vector)) AS score,
    LEFT(c.text, 200) AS snippet,
    s.source_type::TEXT AS source_type,
    s.uri,
    c.meta
  FROM public.rag_embeddings e
  JOIN public.rag_chunks c ON e.chunk_id = c.id
  JOIN public.rag_sources s ON c.source_id = s.id
  WHERE 
    -- Apply source_type filter if provided
    (NOT (filter ? 'source_type') OR s.source_type::TEXT = (filter->>'source_type'))
    -- Apply lang filter if provided
    AND (NOT (filter ? 'lang') OR s.lang = (filter->>'lang'))
    -- Apply meta filters (supports arbitrary JSON keys)
    AND (filter - 'source_type' - 'lang' = '{}'::jsonb OR c.meta @> (filter - 'source_type' - 'lang'))
  ORDER BY e.embedding <=> query_vector
  LIMIT top_k;
END;
$$;

-- RPC: rag_stats - Admin visibility
CREATE OR REPLACE FUNCTION public.rag_stats()
RETURNS TABLE(
  source_type TEXT,
  source_count BIGINT,
  chunk_count BIGINT,
  embedded_count BIGINT,
  last_ingestion TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.source_type::TEXT,
    COUNT(DISTINCT s.id) AS source_count,
    COUNT(DISTINCT c.id) AS chunk_count,
    COUNT(DISTINCT e.id) AS embedded_count,
    MAX(s.updated_at) AS last_ingestion
  FROM public.rag_sources s
  LEFT JOIN public.rag_chunks c ON s.id = c.source_id
  LEFT JOIN public.rag_embeddings e ON c.id = e.chunk_id
  GROUP BY s.source_type
  
  UNION ALL
  
  SELECT 
    'TOTAL' AS source_type,
    COUNT(DISTINCT s.id) AS source_count,
    COUNT(DISTINCT c.id) AS chunk_count,
    COUNT(DISTINCT e.id) AS embedded_count,
    MAX(s.updated_at) AS last_ingestion
  FROM public.rag_sources s
  LEFT JOIN public.rag_chunks c ON s.id = c.source_id
  LEFT JOIN public.rag_embeddings e ON c.id = e.chunk_id;
$$;

-- RPC: rag_upsert_source - Idempotent source creation/update
CREATE OR REPLACE FUNCTION public.rag_upsert_source(
  p_source_type rag_source_type,
  p_external_id TEXT,
  p_title TEXT DEFAULT NULL,
  p_uri TEXT DEFAULT NULL,
  p_lang TEXT DEFAULT 'en',
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_id UUID;
BEGIN
  INSERT INTO public.rag_sources (
    source_type,
    external_id,
    title,
    uri,
    lang,
    meta,
    updated_at
  )
  VALUES (
    p_source_type,
    p_external_id,
    p_title,
    p_uri,
    p_lang,
    p_meta,
    NOW()
  )
  ON CONFLICT (external_id) 
  DO UPDATE SET
    title = EXCLUDED.title,
    uri = EXCLUDED.uri,
    lang = EXCLUDED.lang,
    meta = EXCLUDED.meta,
    updated_at = NOW()
  RETURNING id INTO v_source_id;
  
  RETURN v_source_id;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES (run these manually to verify)
-- ============================================================================

-- Verify extension
-- SELECT * FROM pg_extension WHERE extname = 'vector';

-- Verify tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'rag_%';

-- Verify HNSW index
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'rag_embeddings' AND indexname LIKE '%hnsw%';

-- Verify RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename LIKE 'rag_%';

-- Verify row counts (should be 0)
-- SELECT 
--   (SELECT COUNT(*) FROM public.rag_sources) as sources,
--   (SELECT COUNT(*) FROM public.rag_chunks) as chunks,
--   (SELECT COUNT(*) FROM public.rag_embeddings) as embeddings;