-- Fix RAG Knowledge Base Security Vulnerability
-- This migration restricts access to authenticated users only

-- Drop the insecure public read policies
DROP POLICY IF EXISTS "Anyone can read rag_sources" ON public.rag_sources;
DROP POLICY IF EXISTS "Anyone can read rag_chunks" ON public.rag_chunks;
DROP POLICY IF EXISTS "Anyone can read rag_embeddings" ON public.rag_embeddings;

-- Create secure policies: Only authenticated users can read RAG data
CREATE POLICY "Authenticated users can read rag_sources"
ON public.rag_sources
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read rag_chunks"
ON public.rag_chunks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read rag_embeddings"
ON public.rag_embeddings
FOR SELECT
TO authenticated
USING (true);

-- Service role retains full management access (already exists, just confirming)
-- These policies already exist from previous migration:
-- CREATE POLICY "Service role can manage rag_sources" ON public.rag_sources FOR ALL USING (auth.role() = 'service_role');
-- CREATE POLICY "Service role can manage rag_chunks" ON public.rag_chunks FOR ALL USING (auth.role() = 'service_role');
-- CREATE POLICY "Service role can manage rag_embeddings" ON public.rag_embeddings FOR ALL USING (auth.role() = 'service_role');