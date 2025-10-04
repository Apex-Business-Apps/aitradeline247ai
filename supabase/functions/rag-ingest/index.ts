import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChunkResult {
  text: string;
  chunk_index: number;
  token_count: number;
}

// Simple sentence-aware chunking (~800 tokens target, ~120 overlap)
function chunkText(text: string, targetTokens = 800, overlapTokens = 120): ChunkResult[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: ChunkResult[] = [];
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;
  const avgCharsPerToken = 4; // rough estimate

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    const sentenceTokens = Math.ceil(sentence.length / avgCharsPerToken);

    if (currentTokens + sentenceTokens > targetTokens && currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        chunk_index: chunkIndex++,
        token_count: currentTokens
      });

      // Start new chunk with overlap
      const overlapStart = Math.max(0, currentChunk.length - (overlapTokens * avgCharsPerToken));
      currentChunk = currentChunk.substring(overlapStart) + ' ' + sentence;
      currentTokens = Math.ceil(currentChunk.length / avgCharsPerToken);
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      chunk_index: chunkIndex,
      token_count: currentTokens
    });
  }

  return chunks;
}

async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Only allow service_role key (NOT anon key)
    const authHeader = req.headers.get('authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!authHeader || !authHeader.includes(serviceRoleKey)) {
      console.error('Unauthorized ingestion attempt - service_role key required');
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'RAG ingestion requires service_role key. Never use anon key for ingestion.' 
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = serviceRoleKey;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { source_types } = await req.json().catch(() => ({ source_types: ['transcript', 'email', 'doc', 'faq'] }));

    const results = {
      processed: 0,
      chunks_created: 0,
      embeddings_created: 0,
      by_type: {} as Record<string, number>
    };

    // Ingest transcripts
    if (source_types.includes('transcript')) {
      const { data: transcripts } = await supabase
        .from('transcripts')
        .select('id, call_sid, content, created_at, updated_at')
        .not('content', 'is', null)
        .limit(50);

      for (const transcript of transcripts || []) {
        const sourceId = await supabase.rpc('rag_upsert_source', {
          p_source_type: 'transcript',
          p_external_id: `transcript_${transcript.id}`,
          p_title: `Call ${transcript.call_sid}`,
          p_uri: `/transcripts/${transcript.id}`,
          p_lang: 'en',
          p_meta: { call_sid: transcript.call_sid }
        }).then(r => r.data);

        // Check if we need to re-embed (source was updated)
        const { data: existingChunks } = await supabase
          .from('rag_chunks')
          .select('id')
          .eq('source_id', sourceId)
          .limit(1);

        if (existingChunks && existingChunks.length > 0) {
          // Already ingested, skip
          continue;
        }

        // Chunk and embed
        const chunks = chunkText(transcript.content);
        
        for (const chunk of chunks) {
          const { data: chunkData } = await supabase
            .from('rag_chunks')
            .insert({
              source_id: sourceId,
              chunk_index: chunk.chunk_index,
              text: chunk.text,
              token_count: chunk.token_count,
              meta: {}
            })
            .select()
            .single();

          if (chunkData) {
            const embedding = await generateEmbedding(chunk.text, openaiKey);
            
            await supabase
              .from('rag_embeddings')
              .insert({
                chunk_id: chunkData.id,
                embedding: `[${embedding.join(',')}]`,
                norm: Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)),
                meta: {}
              });

            results.chunks_created++;
            results.embeddings_created++;
          }
        }

        results.processed++;
        results.by_type['transcript'] = (results.by_type['transcript'] || 0) + 1;
      }
    }

    // Ingest FAQs
    if (source_types.includes('faq')) {
      const { data: faqs } = await supabase
        .from('faqs')
        .select('id, q, a, organization_id, created_at, updated_at')
        .limit(50);

      for (const faq of faqs || []) {
        const content = `Q: ${faq.q}\n\nA: ${faq.a}`;
        
        const sourceId = await supabase.rpc('rag_upsert_source', {
          p_source_type: 'faq',
          p_external_id: `faq_${faq.id}`,
          p_title: faq.q,
          p_uri: `/faqs/${faq.id}`,
          p_lang: 'en',
          p_meta: { org_id: faq.organization_id }
        }).then(r => r.data);

        const { data: existingChunks } = await supabase
          .from('rag_chunks')
          .select('id')
          .eq('source_id', sourceId)
          .limit(1);

        if (existingChunks && existingChunks.length > 0) {
          continue;
        }

        const chunks = chunkText(content);
        
        for (const chunk of chunks) {
          const { data: chunkData } = await supabase
            .from('rag_chunks')
            .insert({
              source_id: sourceId,
              chunk_index: chunk.chunk_index,
              text: chunk.text,
              token_count: chunk.token_count,
              meta: {}
            })
            .select()
            .single();

          if (chunkData) {
            const embedding = await generateEmbedding(chunk.text, openaiKey);
            
            await supabase
              .from('rag_embeddings')
              .insert({
                chunk_id: chunkData.id,
                embedding: `[${embedding.join(',')}]`,
                norm: Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)),
                meta: {}
              });

            results.chunks_created++;
            results.embeddings_created++;
          }
        }

        results.processed++;
        results.by_type['faq'] = (results.by_type['faq'] || 0) + 1;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        results,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RAG ingestion error:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Ingestion failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
