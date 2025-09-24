import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface DashboardSummary {
  kpis: Array<{
    id: 'bookings' | 'payout' | 'answerRate' | 'rescued';
    value: number;
    deltaPct?: number;
    currency?: string;
  }>;
  nextItems: Array<{
    id: string;
    whenISO: string;
    name: string;
    contact: string;
    status: 'new' | 'confirmed' | 'reschedule';
    actions: Array<'confirm' | 'reschedule' | 'note'>;
  }>;
  transcripts: Array<{
    id: string;
    atISO: string;
    caller: string;
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    needsReply: boolean;
  }>;
  lastUpdated: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current time in America/Edmonton timezone
    const edmontonTime = new Date().toLocaleString("en-CA", {
      timeZone: "America/Edmonton"
    });

    // Mock KPI calculations (replace with real data sources later)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    // Simulate real KPIs with some variability
    const kpis = [
      {
        id: 'bookings' as const,
        value: Math.floor(Math.random() * 20) + 40, // 40-60
        deltaPct: Math.floor(Math.random() * 30) - 5 // -5 to 25
      },
      {
        id: 'payout' as const,
        value: Math.floor(Math.random() * 2000) + 2500, // $2500-4500
        currency: 'USD'
      },
      {
        id: 'answerRate' as const,
        value: Math.floor(Math.random() * 15) + 85, // 85-100%
        deltaPct: Math.floor(Math.random() * 10) // 0-10%
      },
      {
        id: 'rescued' as const,
        value: Math.floor(Math.random() * 10) + 5 // 5-15
      }
    ];

    // Mock next items (replace with real calendar/CRM integration)
    const nextItems = [
      {
        id: 'appt_' + Date.now(),
        whenISO: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        name: "Sarah Johnson",
        contact: "sarah@example.com",
        status: 'new' as const,
        actions: ['confirm', 'reschedule', 'note'] as Array<'confirm' | 'reschedule' | 'note'>
      },
      {
        id: 'appt_' + (Date.now() + 1),
        whenISO: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        name: "Mike Chen",
        contact: "(555) 123-4567",
        status: 'confirmed' as const,
        actions: ['reschedule', 'note'] as Array<'confirm' | 'reschedule' | 'note'>
      }
    ];

    // Mock recent transcripts (replace with real call transcription service)
    const transcripts = [
      {
        id: 'transcript_' + Date.now(),
        atISO: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
        caller: "David Wilson",
        summary: "Interested in our premium package, asked about pricing and implementation timeline.",
        sentiment: 'positive' as const,
        needsReply: false
      },
      {
        id: 'transcript_' + (Date.now() + 1),
        atISO: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        caller: "Jennifer Adams", 
        summary: "Had technical issues with current setup, needs support call scheduled.",
        sentiment: 'neutral' as const,
        needsReply: true
      }
    ];

    const summary: DashboardSummary = {
      kpis,
      nextItems,
      transcripts,
      lastUpdated: new Date().toISOString()
    };

    console.log('Dashboard summary generated:', {
      kpisCount: kpis.length,
      nextItemsCount: nextItems.length,
      transcriptsCount: transcripts.length,
      timezone: 'America/Edmonton'
    });

    return new Response(
      JSON.stringify(summary),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30, s-maxage=60' // 30s browser, 60s CDN
        }
      }
    );

  } catch (error) {
    console.error('Dashboard summary error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to generate dashboard summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});