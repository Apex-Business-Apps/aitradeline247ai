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
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Dashboard summary request for user:', user.id);

    // Get user's organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      console.warn('No organization membership found for user');
      return new Response(
        JSON.stringify({
          kpis: [],
          nextItems: [],
          transcripts: [],
          lastUpdated: new Date().toISOString()
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    const orgId = membership.org_id;

    // Fetch real data from database
    const [appointmentsResult, transcriptsResult] = await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('organization_id', orgId)
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(5),
      supabase
        .from('transcripts')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(3)
    ]);

    const appointments = appointmentsResult.data || [];
    const transcripts = transcriptsResult.data || [];

    // Calculate real KPIs
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: weeklyBookings } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', weekAgo.toISOString());

    const kpis = [
      {
        id: 'bookings' as const,
        value: weeklyBookings || 0,
        deltaPct: 0
      },
      {
        id: 'payout' as const,
        value: 0,
        currency: 'USD'
      },
      {
        id: 'answerRate' as const,
        value: 0,
        deltaPct: 0
      },
      {
        id: 'rescued' as const,
        value: 0
      }
    ];

    // Map appointments to nextItems
    const nextItems = appointments.map((appt) => ({
      id: appt.id,
      whenISO: appt.start_at,
      name: appt.first_name || 'Unknown',
      contact: appt.email || appt.e164,
      status: appt.status === 'confirmed' ? 'confirmed' as const : 'new' as const,
      actions: ['confirm', 'reschedule', 'note'] as Array<'confirm' | 'reschedule' | 'note'>
    }));

    // Map transcripts
    const mappedTranscripts = transcripts.map((t) => ({
      id: t.id,
      atISO: t.created_at,
      caller: 'Unknown',
      summary: t.content.substring(0, 150) + '...',
      sentiment: 'neutral' as const,
      needsReply: false
    }));

    const summary: DashboardSummary = {
      kpis,
      nextItems,
      transcripts: mappedTranscripts,
      lastUpdated: new Date().toISOString()
    };

    console.log('Dashboard summary generated:', {
      userId: user.id,
      orgId,
      kpisCount: kpis.length,
      nextItemsCount: nextItems.length,
      transcriptsCount: mappedTranscripts.length,
      source: 'real_data'
    });

    return new Response(
      JSON.stringify(summary),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=30'
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