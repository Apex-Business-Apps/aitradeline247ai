import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const calendlyApiKey = Deno.env.get('CALENDLY_API_KEY')!;

Deno.serve(async (req) => {
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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'No organization found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Calendly events for org:', membership.org_id);

    // Get current user from Calendly
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${calendlyApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Calendly user fetch failed: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const calendlyUserUri = userData.resource.uri;

    // Fetch scheduled events from Calendly (next 30 days)
    const minStartTime = new Date().toISOString();
    const maxStartTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const eventsResponse = await fetch(
      `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(calendlyUserUri)}&min_start_time=${minStartTime}&max_start_time=${maxStartTime}&status=active`,
      {
        headers: {
          'Authorization': `Bearer ${calendlyApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!eventsResponse.ok) {
      throw new Error(`Calendly events fetch failed: ${eventsResponse.statusText}`);
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.collection || [];

    console.log(`Found ${events.length} Calendly events`);

    // Sync events to appointments table
    let syncedCount = 0;
    for (const event of events) {
      // Fetch invitee details
      const inviteesResponse = await fetch(
        `${event.uri}/invitees`,
        {
          headers: {
            'Authorization': `Bearer ${calendlyApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (inviteesResponse.ok) {
        const inviteesData = await inviteesResponse.json();
        const invitees = inviteesData.collection || [];
        
        for (const invitee of invitees) {
          const { error: insertError } = await supabase
            .from('appointments')
            .upsert({
              organization_id: membership.org_id,
              start_at: event.start_time,
              end_at: event.end_time,
              status: event.status === 'active' ? 'confirmed' : 'pending',
              source: 'calendly',
              e164: invitee.phone_number || '',
              email: invitee.email,
              first_name: invitee.name,
              tz: invitee.timezone || 'America/Edmonton',
              note: `Calendly Event: ${event.name}`
            }, {
              onConflict: 'email,start_at'
            });

          if (!insertError) {
            syncedCount++;
          } else {
            console.error('Failed to sync appointment:', insertError);
          }
        }
      }
    }

    console.log(`Successfully synced ${syncedCount} appointments from Calendly`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        total: events.length
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Calendly sync error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to sync Calendly',
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
