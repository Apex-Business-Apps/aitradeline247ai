import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { title, source_type, content, metadata = {}, organization_id } = await req.json();

    if (!title || !source_type || !content || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, source_type, content, organization_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate source_type
    const validTypes = ['faq', 'service', 'policy', 'pricing', 'custom'];
    if (!validTypes.includes(source_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid source_type. Must be one of: ${validTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create source document
    const { data: source, error: sourceError } = await supabase
      .from('rag_sources')
      .insert({
        organization_id,
        title,
        source_type,
        content,
        metadata
      })
      .select()
      .single();

    if (sourceError) {
      console.error('Error creating source:', sourceError);
      return new Response(
        JSON.stringify({ error: 'Failed to create source document', details: sourceError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Chunk the content (split by paragraphs, max 500 chars per chunk)
    const chunks = chunkText(content, 500);
    
    // 3. Create chunk records
    const chunkRecords = chunks.map((chunk_text, chunk_index) => ({
      source_id: source.id,
      organization_id,
      chunk_text,
      chunk_index,
      chunk_metadata: { title, source_type }
    }));

    const { data: createdChunks, error: chunksError } = await supabase
      .from('rag_chunks')
      .insert(chunkRecords)
      .select();

    if (chunksError) {
      console.error('Error creating chunks:', chunksError);
      return new Response(
        JSON.stringify({ error: 'Failed to create chunks', details: chunksError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Generate embeddings using OpenAI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const embeddingRecords = [];
    for (const chunk of createdChunks) {
      const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: chunk.chunk_text,
          model: 'text-embedding-ada-002'
        })
      });

      if (!embeddingResponse.ok) {
        console.error('Embedding API error:', await embeddingResponse.text());
        continue;
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      embeddingRecords.push({
        chunk_id: chunk.id,
        organization_id,
        embedding
      });
    }

    // 5. Store embeddings
    const { error: embeddingsError } = await supabase
      .from('rag_embeddings')
      .insert(embeddingRecords);

    if (embeddingsError) {
      console.error('Error storing embeddings:', embeddingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to store embeddings', details: embeddingsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        source_id: source.id,
        chunks_created: createdChunks.length,
        embeddings_created: embeddingRecords.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('kb-ingest error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to chunk text intelligently
function chunkText(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size, start a new chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  // Add the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // If no paragraphs, split by sentences
  if (chunks.length === 0) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
  }
  
  return chunks.length > 0 ? chunks : [text];
}
