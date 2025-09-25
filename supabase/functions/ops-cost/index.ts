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

interface CostMetrics {
  org_id: string;
  total_tokens: number;
  rag_requests: number;
  summarize_requests: number;
  batch_embeddings_tokens: number;
  cache_hit_rate: number;
  estimated_cost_usd: number;
}

// OpenAI pricing (as of 2024)
const PRICING = {
  'gpt-3.5-turbo': {
    input: 0.0015 / 1000, // per token
    output: 0.002 / 1000
  },
  'gpt-4o-mini': {
    input: 0.00015 / 1000,
    output: 0.0006 / 1000
  },
  'text-embedding-3-small': {
    input: 0.00002 / 1000,
    output: 0
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const daysBack = parseInt(url.searchParams.get('days') || '7');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    console.log(`Generating cost report for last ${daysBack} days`);

    // Get operational metrics for the time period
    const { data: metrics, error: metricsError } = await supabase
      .from('operational_metrics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (metricsError) {
      throw new Error(`Failed to fetch metrics: ${metricsError.message}`);
    }

    // Get analytics events for cache hit rate and request counts
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('event_type, event_data, created_at')
      .in('event_type', ['rag_request', 'summarize_request', 'rag_cache_hit', 'rag_cache_miss'])
      .gte('created_at', startDate.toISOString());

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    // Get unique organizations
    const orgIds = [...new Set([
      ...(metrics?.map(m => m.org_id) || []),
      ...(events?.map(e => e.event_data?.org_id).filter(Boolean) || [])
    ])];

    const costMetrics: CostMetrics[] = [];

    for (const orgId of orgIds) {
      // Calculate token usage
      const orgMetrics = metrics?.filter(m => m.org_id === orgId) || [];
      
      const totalTokens = orgMetrics
        .filter(m => m.metric_name.includes('tokens'))
        .reduce((sum, m) => sum + (m.metric_value || 0), 0);

      const batchEmbeddingsTokens = orgMetrics
        .filter(m => m.metric_name === 'batch_embeddings_tokens')
        .reduce((sum, m) => sum + (m.metric_value || 0), 0);

      // Calculate request counts and cache hit rate
      const orgEvents = events?.filter(e => e.event_data?.org_id === orgId) || [];
      
      const ragRequests = orgEvents.filter(e => e.event_type === 'rag_request').length;
      const summarizeRequests = orgEvents.filter(e => e.event_type === 'summarize_request').length;
      const cacheHits = orgEvents.filter(e => e.event_type === 'rag_cache_hit').length;
      const cacheMisses = orgEvents.filter(e => e.event_type === 'rag_cache_miss').length;
      
      const cacheHitRate = (cacheHits + cacheMisses) > 0 ? cacheHits / (cacheHits + cacheMisses) : 0;

      // Estimate costs (simplified calculation)
      const estimatedCost = 
        (totalTokens * PRICING['gpt-3.5-turbo'].input) + // Main model usage
        (batchEmbeddingsTokens * PRICING['text-embedding-3-small'].input) + // Embeddings
        (ragRequests * 0.001) + // RAG processing overhead
        (summarizeRequests * 0.0005); // Summarization overhead

      costMetrics.push({
        org_id: orgId,
        total_tokens: totalTokens,
        rag_requests: ragRequests,
        summarize_requests: summarizeRequests,
        batch_embeddings_tokens: batchEmbeddingsTokens,
        cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
        estimated_cost_usd: Math.round(estimatedCost * 100) / 100
      });
    }

    // Calculate totals
    const totals = costMetrics.reduce((acc, org) => ({
      total_tokens: acc.total_tokens + org.total_tokens,
      rag_requests: acc.rag_requests + org.rag_requests,
      summarize_requests: acc.summarize_requests + org.summarize_requests,
      batch_embeddings_tokens: acc.batch_embeddings_tokens + org.batch_embeddings_tokens,
      estimated_cost_usd: acc.estimated_cost_usd + org.estimated_cost_usd
    }), {
      total_tokens: 0,
      rag_requests: 0,
      summarize_requests: 0,
      batch_embeddings_tokens: 0,
      estimated_cost_usd: 0
    });

    const avgCacheHitRate = costMetrics.length > 0 
      ? costMetrics.reduce((sum, org) => sum + org.cache_hit_rate, 0) / costMetrics.length 
      : 0;

    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>TradeLine 24/7 - Cost Report (${daysBack} days)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .cost { color: #28a745; font-weight: bold; }
        .timestamp { color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TradeLine 24/7 - Cost & Usage Report</h1>
            <p>Period: Last ${daysBack} days (${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()})</p>
        </div>

        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">$${totals.estimated_cost_usd.toFixed(2)}</div>
                <div class="metric-label">Total Estimated Cost</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${totals.total_tokens.toLocaleString()}</div>
                <div class="metric-label">Total Tokens</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${totals.rag_requests.toLocaleString()}</div>
                <div class="metric-label">RAG Requests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(avgCacheHitRate * 100).toFixed(1)}%</div>
                <div class="metric-label">Avg Cache Hit Rate</div>
            </div>
        </div>

        <h2>Per-Organization Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Organization</th>
                    <th>Total Tokens</th>
                    <th>RAG Requests</th>
                    <th>Summarize Requests</th>
                    <th>Embedding Tokens</th>
                    <th>Cache Hit Rate</th>
                    <th>Est. Cost (USD)</th>
                </tr>
            </thead>
            <tbody>
                ${costMetrics.map(org => `
                <tr>
                    <td><code>${org.org_id}</code></td>
                    <td>${org.total_tokens.toLocaleString()}</td>
                    <td>${org.rag_requests.toLocaleString()}</td>
                    <td>${org.summarize_requests.toLocaleString()}</td>
                    <td>${org.batch_embeddings_tokens.toLocaleString()}</td>
                    <td>${(org.cache_hit_rate * 100).toFixed(1)}%</td>
                    <td class="cost">$${org.estimated_cost_usd.toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="timestamp">
            Generated: ${new Date().toLocaleString()} UTC
        </div>
    </div>
</body>
</html>`;

    // Log the cost metrics
    await supabase
      .from('operational_metrics')
      .insert({
        org_id: 'system',
        metric_name: 'daily_cost_report_generated',
        metric_value: totals.estimated_cost_usd,
        metric_unit: 'usd',
        metadata: {
          organizations_count: costMetrics.length,
          period_days: daysBack,
          total_requests: totals.rag_requests + totals.summarize_requests
        }
      });

    console.log(`Cost report generated for ${costMetrics.length} organizations, total cost: $${totals.estimated_cost_usd.toFixed(2)}`);

    return new Response(htmlReport, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html' 
      }
    });

  } catch (error) {
    console.error('Error in ops-cost function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});