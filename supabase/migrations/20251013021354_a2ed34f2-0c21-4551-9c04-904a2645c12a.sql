-- I18N•03: Add language metadata field and optimize indexes for multilingual RAG

-- Add language column to rag_sources if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rag_sources' 
    AND column_name = 'lang'
  ) THEN
    ALTER TABLE public.rag_sources 
    ADD COLUMN lang TEXT DEFAULT 'en';
    
    CREATE INDEX IF NOT EXISTS idx_rag_sources_lang 
    ON public.rag_sources(lang);
    
    COMMENT ON COLUMN public.rag_sources.lang IS 'ISO 639-1 language code (e.g., en, fr-CA, es-US, zh, hi, ar)';
  END IF;
END $$;

-- Add language metadata to rag_embeddings for filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rag_embeddings' 
    AND column_name = 'meta'
  ) THEN
    ALTER TABLE public.rag_embeddings 
    ADD COLUMN meta JSONB DEFAULT '{}';
    
    CREATE INDEX IF NOT EXISTS idx_rag_embeddings_meta_lang 
    ON public.rag_embeddings USING GIN ((meta->'language'));
    
    COMMENT ON COLUMN public.rag_embeddings.meta IS 'Metadata including detected language';
  END IF;
END $$;

-- Optimize HNSW index for multilingual vector search
-- Create or verify HNSW index exists with optimal parameters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'rag_embeddings' 
    AND indexname = 'idx_rag_embeddings_hnsw'
  ) THEN
    -- Create HNSW index with tuned parameters for multilingual search
    CREATE INDEX idx_rag_embeddings_hnsw 
    ON public.rag_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 32, ef_construction = 128);
    
    COMMENT ON INDEX public.idx_rag_embeddings_hnsw IS 'HNSW index for fast multilingual vector similarity search';
  END IF;
END $$;

-- Create index on rag_chunks text column for potential hybrid search
CREATE INDEX IF NOT EXISTS idx_rag_chunks_text_gin 
ON public.rag_chunks USING GIN (to_tsvector('english', text));

COMMENT ON INDEX public.idx_rag_chunks_text_gin IS 'Full-text search index for hybrid retrieval';

-- Update rag_match function to support language filtering
CREATE OR REPLACE FUNCTION public.rag_match(
  query_vector vector(1536),
  top_k int DEFAULT 8,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  chunk_id uuid,
  source_id uuid,
  score float,
  snippet text,
  source_type text,
  uri text,
  meta jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lang_filter text;
BEGIN
  -- Extract language filter if provided
  lang_filter := filter->>'lang';
  
  RETURN QUERY
  SELECT 
    c.id AS chunk_id,
    c.source_id,
    1 - (e.embedding <=> query_vector) AS score,
    LEFT(c.text, 200) AS snippet,
    s.source_type,
    s.uri,
    s.meta
  FROM public.rag_embeddings e
  JOIN public.rag_chunks c ON e.chunk_id = c.id
  JOIN public.rag_sources s ON c.source_id = s.id
  WHERE 
    (lang_filter IS NULL OR s.lang = lang_filter)
    AND (1 - (e.embedding <=> query_vector)) > 0.3  -- Minimum similarity threshold
  ORDER BY e.embedding <=> query_vector
  LIMIT top_k;
END;
$$;

COMMENT ON FUNCTION public.rag_match IS 'Semantic search with optional language filtering. Returns top_k most similar chunks.';

-- Log the migration
INSERT INTO public.analytics_events (event_type, event_data, severity)
VALUES (
  'migration_completed',
  jsonb_build_object(
    'migration', 'i18n_rag_multilingual',
    'timestamp', NOW(),
    'changes', jsonb_build_array(
      'Added lang column to rag_sources',
      'Added meta column to rag_embeddings',
      'Created/verified HNSW index with optimal parameters',
      'Created GIN index on rag_chunks text',
      'Updated rag_match function for language filtering'
    )
  ),
  'info'
);