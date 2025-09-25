import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

interface Citation {
  title: string;
  url?: string;
}

interface RAGResponse {
  answer: string;
  citations: Citation[];
  used_model: string;
  latency_ms: number;
  cache_hit: boolean;
}

// Generate hash for cache key
async function generateQuestionHash(question: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(question.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Moderate content using OpenAI moderation
async function moderateContent(content: string): Promise<{ flagged: boolean; categories: string[] }> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.warn('OpenAI API key not configured, skipping moderation');
    return { flagged: false, categories: [] };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
        model: 'text-moderation-latest'
      }),
    });

    if (!response.ok) {
      console.error('Moderation API error:', await response.text());
      return { flagged: false, categories: [] };
    }

    const data = await response.json();
    const result = data.results[0];
    
    const flaggedCategories = Object.keys(result.categories)
      .filter(key => result.categories[key]);

    return {
      flagged: result.flagged,
      categories: flaggedCategories
    };
  } catch (error) {
    console.error('Moderation error:', error);
    return { flagged: false, categories: [] };
  }
}

// Get embeddings for the question
async function getQuestionEmbedding(question: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: question,
      encoding_format: 'float'
    }),
  });

  if (!response.ok) {
    throw new Error(`Embeddings API error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Perform vector similarity search
async function vectorSearch(supabase: any, orgId: string, questionEmbedding: number[], topK = 5) {
  const embeddingStr = `[${questionEmbedding.join(',')}]`;
  
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingStr,
    match_threshold: 0.7,
    match_count: topK,
    org_filter: orgId
  });

  if (error) {
    console.error('Vector search error:', error);
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return data || [];
}

// Generate answer using OpenAI
async function generateAnswer(question: string, context: string, citations: Citation[]): Promise<{ answer: string; model: string }> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `You are a helpful assistant answering questions based on the provided context. 
Use only the information from the context to answer the question. If the context doesn't contain enough information, say so.
Include specific details and cite sources when relevant.

Context:
${context}

Question: ${question}

Answer:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that answers questions based on provided context.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const data = await response.json();
  return {
    answer: data.choices[0].message.content,
    model: 'gpt-4o-mini'
  };
}

// Validate and filter URLs to only allow tenant documents
function validateAndFilterAnswer(answer: string, allowedDomains: string[]): string {
  // Simple URL detection and filtering
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  return answer.replace(urlRegex, (url) => {
    try {
      const urlObj = new URL(url);
      const isAllowed = allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      
      return isAllowed ? url : '[URL removed for security]';
    } catch {
      return '[Invalid URL removed]';
    }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { question, org_id } = await req.json();
    
    if (!question || !org_id) {
      return new Response(JSON.stringify({ error: 'question and org_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`RAG query for org ${org_id}: ${question.substring(0, 100)}...`);

    // Content moderation
    const moderation = await moderateContent(question);
    if (moderation.flagged) {
      console.warn(`Flagged content detected: ${moderation.categories.join(', ')}`);
      return new Response(JSON.stringify({ 
        error: 'Content violates usage policies',
        categories: moderation.categories 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate question hash for caching
    const questionHash = await generateQuestionHash(question);

    // Get current KB version
    const { data: kbVersion, error: versionError } = await supabase
      .from('kb_versions')
      .select('version')
      .eq('org_id', org_id)
      .single();

    if (versionError && versionError.code !== 'PGRST116') {
      throw new Error(`Failed to get KB version: ${versionError.message}`);
    }

    const currentVersion = kbVersion?.version || 1;

    // Check cache
    const { data: cachedResponse } = await supabase
      .from('rag_cache')
      .select('answer')
      .eq('org_id', org_id)
      .eq('question_hash', questionHash)
      .eq('kb_version', currentVersion)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedResponse) {
      console.log('Cache hit');
      
      // Log cache hit metric
      await supabase
        .from('operational_metrics')
        .insert({
          org_id,
          metric_name: 'rag_cache_hit_rate',
          metric_value: 1,
          metric_unit: 'boolean'
        });

      const response: RAGResponse = {
        ...cachedResponse.answer,
        cache_hit: true,
        latency_ms: Date.now() - startTime
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get question embedding
    const questionEmbedding = await getQuestionEmbedding(question);

    // Perform vector search
    const searchResults = await vectorSearch(supabase, org_id, questionEmbedding);

    if (searchResults.length === 0) {
      return new Response(JSON.stringify({
        answer: "I don't have enough information in the knowledge base to answer your question.",
        citations: [],
        used_model: 'none',
        latency_ms: Date.now() - startTime,
        cache_hit: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build context and citations
    const context = searchResults
      .map((result: any) => `Title: ${result.title}\nContent: ${result.content}`)
      .join('\n\n');

    const citations: Citation[] = searchResults.map((result: any) => ({
      title: result.title,
      url: result.url
    }));

    // Generate answer
    const { answer, model } = await generateAnswer(question, context, citations);

    // Filter answer for security
    const allowedDomains = ['tradeline247ai.com']; // Add your allowed domains
    const filteredAnswer = validateAndFilterAnswer(answer, allowedDomains);

    const response: RAGResponse = {
      answer: filteredAnswer,
      citations: citations.filter(c => c.url), // Only include citations with URLs
      used_model: model,
      latency_ms: Date.now() - startTime,
      cache_hit: false
    };

    // Cache the response
    await supabase
      .from('rag_cache')
      .insert({
        org_id,
        question_hash: questionHash,
        kb_version: currentVersion,
        answer: response
      });

    // Log metrics
    await Promise.all([
      supabase
        .from('operational_metrics')
        .insert({
          org_id,
          metric_name: 'rag_cache_hit_rate',
          metric_value: 0,
          metric_unit: 'boolean'
        }),
      supabase
        .from('operational_metrics')
        .insert({
          org_id,
          metric_name: 'rag_latency_ms',
          metric_value: response.latency_ms,
          metric_unit: 'milliseconds'
        }),
      supabase
        .from('operational_metrics')
        .insert({
          org_id,
          metric_name: 'rag_citations_count',
          metric_value: response.citations.length,
          metric_unit: 'count'
        })
    ]);

    console.log(`RAG response generated in ${response.latency_ms}ms with ${citations.length} citations`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in rag-answer function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - startTime 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});