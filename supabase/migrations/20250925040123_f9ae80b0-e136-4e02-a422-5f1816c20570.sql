-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge base documents table
CREATE TABLE IF NOT EXISTS public.kb_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  text TEXT NOT NULL,
  checksum TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create HNSW index on embedding for fast vector similarity search
CREATE INDEX IF NOT EXISTS kb_documents_embedding_idx 
ON public.kb_documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create index on org_id for efficient filtering
CREATE INDEX IF NOT EXISTS kb_documents_org_id_idx 
ON public.kb_documents (org_id);

-- Create index on checksum for efficient change detection
CREATE INDEX IF NOT EXISTS kb_documents_checksum_idx 
ON public.kb_documents (checksum);

-- Enable Row Level Security
ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for org-scoped access
CREATE POLICY "Users can view kb_documents in their org" 
ON public.kb_documents 
FOR SELECT 
USING (org_id = (SELECT profiles.user_id FROM public.profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Service role can manage kb_documents" 
ON public.kb_documents 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create kb_versions table to track org knowledge base versions
CREATE TABLE IF NOT EXISTS public.kb_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  last_embedded_at TIMESTAMP WITH TIME ZONE,
  document_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for kb_versions
ALTER TABLE public.kb_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for kb_versions
CREATE POLICY "Users can view kb_versions in their org" 
ON public.kb_versions 
FOR SELECT 
USING (org_id = (SELECT profiles.user_id FROM public.profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Service role can manage kb_versions" 
ON public.kb_versions 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create batch_embeddings_jobs table to track OpenAI Batch API jobs
CREATE TABLE IF NOT EXISTS public.batch_embeddings_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  batch_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_file_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for batch_embeddings_jobs
ALTER TABLE public.batch_embeddings_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for batch_embeddings_jobs
CREATE POLICY "Service role can manage batch_embeddings_jobs" 
ON public.batch_embeddings_jobs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create rag_cache table for caching RAG responses
CREATE TABLE IF NOT EXISTS public.rag_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  question_hash TEXT NOT NULL,
  kb_version INTEGER NOT NULL,
  answer JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for cache lookups
CREATE INDEX IF NOT EXISTS rag_cache_lookup_idx 
ON public.rag_cache (org_id, question_hash, kb_version);

-- Create index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS rag_cache_expires_at_idx 
ON public.rag_cache (expires_at);

-- Enable RLS for rag_cache
ALTER TABLE public.rag_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for rag_cache
CREATE POLICY "Service role can manage rag_cache" 
ON public.rag_cache 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create call_summaries table for structured outputs
CREATE TABLE IF NOT EXISTS public.call_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  call_sid TEXT,
  subject TEXT,
  summary TEXT NOT NULL,
  next_actions JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  confidence_score FLOAT,
  model_used TEXT,
  escalated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for call_summaries
ALTER TABLE public.call_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for call_summaries
CREATE POLICY "Users can view call_summaries in their org" 
ON public.call_summaries 
FOR SELECT 
USING (org_id = (SELECT profiles.user_id FROM public.profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Service role can manage call_summaries" 
ON public.call_summaries 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create ragas_evaluations table for quality monitoring
CREATE TABLE IF NOT EXISTS public.ragas_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  ground_truth TEXT,
  context JSONB,
  faithfulness_score FLOAT,
  answer_relevance_score FLOAT,
  retrieval_precision FLOAT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for ragas_evaluations
ALTER TABLE public.ragas_evaluations ENABLE ROW LEVEL SECURITY;

-- Create policies for ragas_evaluations
CREATE POLICY "Admins can view ragas_evaluations" 
ON public.ragas_evaluations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage ragas_evaluations" 
ON public.ragas_evaluations 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create consent_records table for PIPEDA/CASL compliance
CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  contact_identifier TEXT NOT NULL, -- email, phone, etc.
  consent_type TEXT NOT NULL, -- 'recording', 'marketing', 'data_processing'
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  withdraw_timestamp TIMESTAMP WITH TIME ZONE,
  source TEXT, -- 'call', 'web_form', 'email'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for consent lookups
CREATE INDEX IF NOT EXISTS consent_records_lookup_idx 
ON public.consent_records (org_id, contact_identifier, consent_type);

-- Enable RLS for consent_records
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- Create policies for consent_records
CREATE POLICY "Users can view consent_records in their org" 
ON public.consent_records 
FOR SELECT 
USING (org_id = (SELECT profiles.user_id FROM public.profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Service role can manage consent_records" 
ON public.consent_records 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create operational metrics table
CREATE TABLE IF NOT EXISTS public.operational_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  metric_unit TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for metrics queries
CREATE INDEX IF NOT EXISTS operational_metrics_lookup_idx 
ON public.operational_metrics (org_id, metric_name, recorded_at);

-- Enable RLS for operational_metrics
ALTER TABLE public.operational_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for operational_metrics
CREATE POLICY "Admins can view operational_metrics" 
ON public.operational_metrics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage operational_metrics" 
ON public.operational_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

-- Function to increment kb_version for an org
CREATE OR REPLACE FUNCTION public.increment_kb_version(target_org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_version INTEGER;
BEGIN
  INSERT INTO public.kb_versions (org_id, version, last_embedded_at, document_count)
  VALUES (
    target_org_id, 
    1, 
    now(), 
    (SELECT COUNT(*) FROM public.kb_documents WHERE org_id = target_org_id)
  )
  ON CONFLICT (org_id) 
  DO UPDATE SET 
    version = public.kb_versions.version + 1,
    last_embedded_at = now(),
    document_count = (SELECT COUNT(*) FROM public.kb_documents WHERE org_id = target_org_id),
    updated_at = now()
  RETURNING version INTO new_version;
  
  RETURN new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_rag_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rag_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_kb_documents_updated_at ON public.kb_documents;
CREATE TRIGGER update_kb_documents_updated_at
  BEFORE UPDATE ON public.kb_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_kb_versions_updated_at ON public.kb_versions;
CREATE TRIGGER update_kb_versions_updated_at
  BEFORE UPDATE ON public.kb_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_batch_embeddings_jobs_updated_at ON public.batch_embeddings_jobs;
CREATE TRIGGER update_batch_embeddings_jobs_updated_at
  BEFORE UPDATE ON public.batch_embeddings_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_consent_records_updated_at ON public.consent_records;
CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON public.consent_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();