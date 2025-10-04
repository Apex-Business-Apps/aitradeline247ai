import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createRequestContext, logWithContext, createResponseHeaders } from '../_shared/requestId.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { globalCircuitBreaker } from '../_shared/circuitBreaker.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnswerRequest {
  query_text: string;
  top_k?: number;
  filters?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
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
    const rateLimitKey = `rag_answer:${user.id}`;
    
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
    const body: AnswerRequest = await req.json();
    
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

    const top_k = body.top_k ?? 8;
    const filters = body.filters ?? {};

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

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: queryText,
        dimensions: 1536,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI embedding error:', errorText);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to generate embedding' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const queryVector = embeddingData.data[0].embedding;

    // Call rag_match RPC
    const { data: matches, error: matchError } = await supabase.rpc('rag_match', {
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

    // Hard rule: if 0 hits, return snippets_only with empty citations
    const matchedResults = matches || [];
    if (matchedResults.length === 0) {
      const latency_ms = Date.now() - startTime;
      console.log(JSON.stringify({
        request_id: crypto.randomUUID(),
        user_id: user.id,
        latency_ms,
        confidence: 'low',
        mode: 'snippets_only',
        hits_count: 0,
      }));
      
      return new Response(
        JSON.stringify({
          ok: true,
          latency_ms,
          mode: 'snippets_only',
          confidence: 'low',
          answer_draft: null,
          citations: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate confidence based on average relevance score
    const avgScore = matchedResults.reduce((sum: number, m: any) => sum + m.score, 0) / matchedResults.length;

    let confidence: 'high' | 'medium' | 'low';
    if (avgScore >= 0.75) {
      confidence = 'high';
    } else if (avgScore >= 0.60) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    // Deduplicate by source_id, keeping highest-scored chunk per source
    const sourceMap = new Map<string, any>();
    for (const match of matchedResults) {
      const existing = sourceMap.get(match.source_id);
      if (!existing || match.score > existing.score) {
        sourceMap.set(match.source_id, match);
      }
    }
    const deduplicatedMatches = Array.from(sourceMap.values());

    // Build citations with chunk_id included
    const citations = deduplicatedMatches.slice(0, 5).map((match: any) => ({
      chunk_id: match.chunk_id,
      source_id: match.source_id,
      uri: match.uri,
      score: match.score,
      snippet: match.snippet,
    }));

    const latency_ms = Date.now() - startTime;

    // If confidence is low, return snippets-only mode
    if (confidence === 'low') {
      console.log(JSON.stringify({
        request_id: crypto.randomUUID(),
        user_id: user.id,
        latency_ms,
        confidence,
        mode: 'snippets_only',
        hits_count: matchedResults.length,
      }));

      return new Response(
        JSON.stringify({
          ok: true,
          latency_ms,
          mode: 'snippets_only',
          confidence,
          answer_draft: null,
          citations,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context window for LLM
    const contextChunks = deduplicatedMatches.map((m: any) => 
      `[Source: ${m.source_type}, Score: ${m.score.toFixed(3)}]\\n${m.snippet}`
    ).join('\\n\\n---\\n\\n');

    // Generate answer using Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ ok: false, error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a helpful AI assistant. Answer the user's question based on the provided context chunks from various sources (transcripts, emails, documents, FAQs, web content).

Rules:
1. Only use information from the provided context
2. Cite sources by referencing the source type when possible
3. If the context doesn't contain enough information, say so
4. Be concise and accurate
5. If multiple sources agree, mention that for credibility

Context:
${contextChunks}`;

    const llmResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: queryText }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('Lovable AI error:', llmResponse.status, errorText);
      
      // Handle rate limiting from Lovable AI
      if (llmResponse.status === 429) {
        return new Response(
          JSON.stringify({ ok: false, error: 'AI service rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (llmResponse.status === 402) {
        return new Response(
          JSON.stringify({ ok: false, error: 'AI service payment required. Please contact support.' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to generate answer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const llmData = await llmResponse.json();
    const answerDraft = llmData.choices?.[0]?.message?.content || null;

    // Logging for observability
    console.log(JSON.stringify({
      request_id: crypto.randomUUID(),
      user_id: user.id,
      latency_ms,
      confidence,
      mode: 'answer',
      hits_count: matchedResults.length,
      answer_length: answerDraft?.length || 0,
    }));

    return new Response(
      JSON.stringify({
        ok: true,
        latency_ms,
        mode: 'answer',
        confidence,
        answer_draft: answerDraft,
        citations,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('rag-answer error:', error);
    // Don't expose stack traces
    return new Response(
      JSON.stringify({ ok: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
