import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get RAG statistics
    const { data: stats, error: statsError } = await supabase.rpc('rag_stats');

    if (statsError) {
      console.error('rag_stats error:', statsError);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Failed to retrieve statistics' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate recent QPS (queries per second) over last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { count: searchCount, error: searchCountError } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'rag_search')
      .gte('created_at', fiveMinutesAgo);

    const { count: answerCount, error: answerCountError } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'rag_answer')
      .gte('created_at', fiveMinutesAgo);

    const totalRequests = (searchCount || 0) + (answerCount || 0);
    const recentQps = totalRequests / 300; // 5 minutes = 300 seconds

    // Get last ingestion timestamp from rag_sources
    const { data: lastSource, error: lastSourceError } = await supabase
      .from('rag_sources')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const lastIngestionAt = lastSource?.updated_at || null;

    // Aggregate counts by source_type
    const statsByType = Array.isArray(stats) 
      ? stats.reduce((acc: any, row: any) => {
          if (row.source_type === 'TOTAL') {
            acc.total = {
              sources: row.source_count,
              chunks: row.chunk_count,
              embeddings: row.embedded_count,
            };
          } else {
            acc.by_type = acc.by_type || {};
            acc.by_type[row.source_type] = {
              sources: row.source_count,
              chunks: row.chunk_count,
              embeddings: row.embedded_count,
            };
          }
          return acc;
        }, {})
      : { total: { sources: 0, chunks: 0, embeddings: 0 }, by_type: {} };

    return new Response(
      JSON.stringify({
        version: 'rag_v1',
        counts: statsByType.total || { sources: 0, chunks: 0, embeddings: 0 },
        by_type: statsByType.by_type || {},
        last_ingestion_at: lastIngestionAt,
        recent_qps: Math.round(recentQps * 100) / 100, // 2 decimal places
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('ragz health check error:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Health check failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

