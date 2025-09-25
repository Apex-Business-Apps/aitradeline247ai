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

interface DocumentChunk {
  text: string;
  metadata: {
    title: string;
    url?: string;
    chunk_index: number;
  };
}

// Chunk text into overlapping segments
function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    
    if (end === text.length) break;
    start = end - overlap;
  }
  
  return chunks;
}

// Generate checksum for content
async function generateChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Create OpenAI Batch API request file
async function createBatchFile(chunks: DocumentChunk[]): Promise<string> {
  const batchRequests = chunks.map((chunk, index) => ({
    custom_id: `chunk_${index}`,
    method: "POST",
    url: "/v1/embeddings",
    body: {
      model: "text-embedding-3-small",
      input: chunk.text,
      encoding_format: "float"
    }
  }));

  return batchRequests.map(req => JSON.stringify(req)).join('\n');
}

// Submit batch job to OpenAI
async function submitBatchJob(batchFileContent: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Upload batch file
  const formData = new FormData();
  const blob = new Blob([batchFileContent], { type: 'application/jsonl' });
  formData.append('file', blob, 'embeddings.jsonl');
  formData.append('purpose', 'batch');

  const uploadResponse = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(`File upload failed: ${await uploadResponse.text()}`);
  }

  const fileData = await uploadResponse.json();

  // Create batch job
  const batchResponse = await fetch('https://api.openai.com/v1/batches', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input_file_id: fileData.id,
      endpoint: '/v1/embeddings',
      completion_window: '24h',
      metadata: {
        description: 'Knowledge base embeddings'
      }
    }),
  });

  if (!batchResponse.ok) {
    throw new Error(`Batch creation failed: ${await batchResponse.text()}`);
  }

  const batchData = await batchResponse.json();
  return batchData.id;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { org_id } = await req.json();
    
    if (!org_id) {
      return new Response(JSON.stringify({ error: 'org_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Starting batch embeddings for org: ${org_id}`);

    // Get current documents for the org
    const { data: documents, error: docError } = await supabase
      .from('kb_documents')
      .select('id, title, url, text, checksum')
      .eq('org_id', org_id)
      .is('embedding', null); // Only process documents without embeddings

    if (docError) {
      throw new Error(`Failed to fetch documents: ${docError.message}`);
    }

    if (!documents || documents.length === 0) {
      console.log('No documents to process');
      return new Response(JSON.stringify({ 
        message: 'No new documents to process',
        documents_processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${documents.length} documents`);

    // Process each document and create chunks
    const allChunks: (DocumentChunk & { document_id: string })[] = [];
    
    for (const doc of documents) {
      const currentChecksum = await generateChecksum(doc.text);
      
      // Skip if checksum hasn't changed
      if (doc.checksum === currentChecksum) {
        console.log(`Skipping unchanged document: ${doc.title}`);
        continue;
      }

      const chunks = chunkText(doc.text);
      
      for (let i = 0; i < chunks.length; i++) {
        allChunks.push({
          document_id: doc.id,
          text: chunks[i],
          metadata: {
            title: doc.title,
            url: doc.url,
            chunk_index: i
          }
        });
      }
    }

    if (allChunks.length === 0) {
      console.log('No changed documents to process');
      return new Response(JSON.stringify({ 
        message: 'No changed documents to process',
        documents_processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create batch file and submit to OpenAI
    const batchFileContent = await createBatchFile(allChunks);
    const batchId = await submitBatchJob(batchFileContent);

    // Store batch job record
    const { error: batchError } = await supabase
      .from('batch_embeddings_jobs')
      .insert({
        org_id,
        batch_id: batchId,
        status: 'pending',
        input_file_count: allChunks.length
      });

    if (batchError) {
      console.error('Failed to store batch job:', batchError);
    }

    console.log(`Batch job submitted: ${batchId} for ${allChunks.length} chunks`);

    // Log metrics
    await supabase
      .from('operational_metrics')
      .insert({
        org_id,
        metric_name: 'batch_embeddings_tokens',
        metric_value: allChunks.reduce((sum, chunk) => sum + chunk.text.length / 4, 0), // Rough token estimate
        metric_unit: 'tokens'
      });

    return new Response(JSON.stringify({
      message: 'Batch embeddings job started',
      batch_id: batchId,
      chunks_submitted: allChunks.length,
      documents_processed: documents.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in batch-embeddings function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});