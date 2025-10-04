-- =========================================================
-- RAG SECURITY & AUTOMATION (Part 1: Enable Extensions)
-- =========================================================

-- Enable pg_cron for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net for HTTP calls from cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Verify RLS is enabled on all RAG tables
ALTER TABLE public.rag_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_embeddings ENABLE ROW LEVEL SECURITY;

-- Create function to check RAG health
CREATE OR REPLACE FUNCTION public.check_rag_health()
RETURNS TABLE(
  total_sources bigint,
  total_chunks bigint,
  total_embeddings bigint,
  chunks_without_embeddings bigint,
  last_ingestion timestamptz,
  health_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      (SELECT COUNT(*) FROM rag_sources) as sources,
      (SELECT COUNT(*) FROM rag_chunks) as chunks,
      (SELECT COUNT(*) FROM rag_embeddings) as embeddings,
      (SELECT COUNT(*) FROM rag_chunks c 
       LEFT JOIN rag_embeddings e ON c.id = e.chunk_id 
       WHERE e.id IS NULL) as orphaned_chunks,
      (SELECT MAX(updated_at) FROM rag_sources) as last_update
  )
  SELECT
    stats.sources as total_sources,
    stats.chunks as total_chunks,
    stats.embeddings as total_embeddings,
    stats.orphaned_chunks as chunks_without_embeddings,
    stats.last_update as last_ingestion,
    CASE
      WHEN stats.sources = 0 THEN 'CRITICAL: No sources ingested'
      WHEN stats.embeddings < stats.chunks * 0.9 THEN 'WARNING: Missing embeddings'
      WHEN stats.last_update < NOW() - INTERVAL '7 days' THEN 'WARNING: Stale data'
      ELSE 'HEALTHY'
    END as health_status
  FROM stats;
$$;

-- Grant execute to authenticated users for health checks
GRANT EXECUTE ON FUNCTION public.check_rag_health TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.check_rag_health IS 
  'Returns RAG system health metrics including counts and data freshness';

COMMENT ON TABLE public.rag_sources IS 
  'Source documents for RAG (transcripts, FAQs, emails). Protected by RLS.';

COMMENT ON TABLE public.rag_chunks IS 
  'Text chunks split from sources (~800 tokens each). Protected by RLS.';

COMMENT ON TABLE public.rag_embeddings IS 
  'Vector embeddings (1536-dim) for semantic search. Protected by RLS.';