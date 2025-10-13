import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createRequestContext, logWithContext, createResponseHeaders } from '../_shared/requestId.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { globalCircuitBreaker } from '../_shared/circuitBreaker.ts';
import { normalizeTextForEmbedding } from '../_shared/textNormalization.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query_text: string;
  top_k?: number;
  filters?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestCtx = createRequestContext(req);

  try {
    logWithContext(requestCtx, 'info', 'RAG search request received');
    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check (60 req/min per user) - FIXED
    const rateLimitKey = `rag_search:${user.id}`;
    
    try {
      const { data: rateLimitData, error: rateLimitError } = await supabase
        .rpc('secure_rate_limit', {  // Fixed: was 'secure-rate-limit'
          identifier: rateLimitKey,
          max_requests: 60,
          window_seconds: 60
        });

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
        // Fail open for rate limit errors to avoid blocking legitimate users
      } else if (rateLimitData && !rateLimitData.allowed) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: 'Rate limit exceeded. Max 60 requests per minute.',
            reset_at: rateLimitData.reset_at 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (rateLimitErr) {
      console.error('Rate limit exception:', rateLimitErr);
      // Continue execution - fail open
    }

    // Parse and validate request body
    const body: SearchRequest = await req.json();
    
    if (!body.query_text || typeof body.query_text !== 'string' || body.query_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'query_text is required and must be a non-empty string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Guardrail: enforce max query_text length
    const maxQueryLength = 2000;
    let queryText = body.query_text.trim();
    if (queryText.length > maxQueryLength) {
      queryText = queryText.substring(0, maxQueryLength);
      console.log(`Query truncated from ${body.query_text.length} to ${maxQueryLength} chars`);
    }

    // Apply multilingual normalization to query
    const { normalized: normalizedQuery, language: queryLang } = normalizeTextForEmbedding(queryText);
    console.log(`Query language detected: ${queryLang}`);

    const top_k = body.top_k ?? 8;
    const filters = body.filters ?? {};
    
    // Add language filter if not explicitly set (unless explicitly disabled)
    const shouldFilterByLanguage = !filters.hasOwnProperty('lang');
    if (shouldFilterByLanguage && queryLang) {
      filters.lang = queryLang;
      console.log(`Applied automatic language filter: ${queryLang}`);
    }

    // Guardrail: enforce max top_k
    if (typeof top_k !== 'number' || top_k < 1 || top_k > 20) {
      return new Response(
        JSON.stringify({ ok: false, error: 'top_k must be a number between 1 and 20' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding with OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ ok: false, error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding with circuit breaker and retry logic
    const embeddingResponse = await globalCircuitBreaker.execute('openai-embeddings', () =>
      fetchWithRetry('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: normalizedQuery, // Use normalized query
          dimensions: 1536,
        }),
      }, {
        maxAttempts: 3,
        initialDelayMs: 1000,
        timeoutMs: 30000
      })
    );

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      logWithContext(requestCtx, 'error', 'OpenAI embedding error', { status: embeddingResponse.status, error: errorText });
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to generate embedding' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            ...createResponseHeaders(requestCtx),
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const queryVector = embeddingData.data[0].embedding;

    // Call rag_match RPC
    let { data: matches, error: matchError } = await supabase.rpc('rag_match', {
      query_vector: queryVector,
      top_k: top_k,
      filter: filters,
    });

    if (matchError) {
      console.error('rag_match RPC error:', matchError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Search query failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Translation fallback: If few/no results and non-English, try English
    const MIN_RESULTS_THRESHOLD = 2;
    const MIN_SCORE_THRESHOLD = 0.5;
    const needsFallback = queryLang !== 'en' && 
                          (!matches || matches.length < MIN_RESULTS_THRESHOLD || 
                           (matches.length > 0 && matches[0].score < MIN_SCORE_THRESHOLD));

    if (needsFallback) {
      console.log(`Translation fallback triggered: lang=${queryLang}, results=${matches?.length || 0}`);
      
      // Simple translation using OpenAI (leveraging existing key)
      try {
        const translationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: 'Translate the following text to English. Only return the translation, no explanations.' 
              },
              { role: 'user', content: queryText }
            ],
            temperature: 0.3,
            max_tokens: 200,
          }),
        });

        if (translationResponse.ok) {
          const translationData = await translationResponse.json();
          const translatedQuery = translationData.choices?.[0]?.message?.content?.trim();
          
          if (translatedQuery) {
            console.log(`Translated query: "${queryText}" -> "${translatedQuery}"`);
            
            // Re-embed translated query
            const { normalized: normalizedTranslated } = normalizeTextForEmbedding(translatedQuery);
            const translatedEmbedResponse = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: normalizedTranslated,
                dimensions: 1536,
              }),
            });

            if (translatedEmbedResponse.ok) {
              const translatedEmbedData = await translatedEmbedResponse.json();
              const translatedVector = translatedEmbedData.data[0].embedding;

              // Search English docs (remove language filter)
              const englishFilters = { ...filters };
              delete englishFilters.lang;
              
              const { data: englishMatches, error: englishError } = await supabase.rpc('rag_match', {
                query_vector: translatedVector,
                top_k: top_k,
                filter: englishFilters,
              });

              if (!englishError && englishMatches && englishMatches.length > 0) {
                console.log(`Fallback successful: found ${englishMatches.length} English results`);
                matches = englishMatches;
              }
            }
          }
        }
      } catch (translationError) {
        console.error('Translation fallback error:', translationError);
        // Continue with original results
      }
    }

    const latency_ms = Date.now() - startTime;

    // Format response
    const hits = (matches || []).map((match: any) => ({
      chunk_id: match.chunk_id,
      source_id: match.source_id,
      score: match.score,
      snippet: match.snippet,
      source_type: match.source_type,
      uri: match.uri,
      meta: match.meta || {},
    }));

    // Logging for observability
    console.log(JSON.stringify({
      request_id: crypto.randomUUID(),
      user_id: user.id,
      latency_ms,
      hits_count: hits.length,
      top_k,
      query_length: queryText.length,
    }));

    logWithContext(requestCtx, 'info', 'RAG search completed', { hits_count: hits.length, latency_ms });

    return new Response(
      JSON.stringify({
        ok: true,
        latency_ms,
        hits,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          ...createResponseHeaders(requestCtx),
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('rag-search error:', error);
    // Don't expose stack traces
    return new Response(
      JSON.stringify({ ok: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
