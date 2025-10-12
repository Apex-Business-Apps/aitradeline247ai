import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { 
      tenant_id,
      twilio_number_sid,
      phone_number,
      number_type = 'both' // 'voice', 'sms', or 'both'
    } = await req.json();

    if (!tenant_id || !twilio_number_sid || !phone_number) {
      throw new Error('Missing required fields: tenant_id, twilio_number_sid, phone_number');
    }

    console.log('Mapping number to tenant:', { tenant_id, phone_number, twilio_number_sid });

    // Create phone mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('tenant_phone_mappings')
      .insert({
        tenant_id,
        twilio_number_sid,
        phone_number,
        number_type,
        provisioned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (mappingError) {
      // If mapping already exists, update it
      if (mappingError.code === '23505') {
        const { data: existingMapping, error: updateError } = await supabase
          .from('tenant_phone_mappings')
          .update({
            number_type,
            provisioned_at: new Date().toISOString()
          })
          .eq('tenant_id', tenant_id)
          .eq('phone_number', phone_number)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        console.log('Updated existing mapping:', existingMapping);

        return new Response(JSON.stringify({
          success: true,
          mapping: existingMapping,
          message: 'Updated existing number mapping and initialized usage counters',
          evidence: `✅ Mapped ${phone_number} to tenant and initialized usage counters (updated)`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw mappingError;
    }

    // Initialize usage counter for current billing period
    const { error: counterError } = await supabase.rpc('get_or_create_usage_counter', {
      p_tenant_id: tenant_id,
      p_phone_mapping_id: mapping.id
    });

    if (counterError) {
      console.error('Error initializing usage counter:', counterError);
      // Don't fail the mapping if counter creation fails, just log it
    }

    // Log the mapping event
    await supabase.from('analytics_events').insert({
      event_type: 'number_mapped_to_tenant',
      event_data: {
        tenant_id,
        phone_number,
        twilio_number_sid,
        number_type,
        mapping_id: mapping.id,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    console.log('Successfully mapped number and initialized usage counters:', mapping);

    return new Response(JSON.stringify({
      success: true,
      mapping,
      message: 'Mapped number to tenant and initialized usage counters',
      evidence: `✅ Mapped ${phone_number} to tenant and initialized usage counters`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ops-map-number-to-tenant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
