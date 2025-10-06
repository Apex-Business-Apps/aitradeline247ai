import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.190.0/encoding/csv.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  csv_content: string;
  list_name?: string;
  organization_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { csv_content, list_name = 'Warm Leads — Imported' }: ImportRequest = await req.json();

    // Parse CSV
    const records = parse(csv_content, {
      skipFirstRow: true,
      columns: ['company', 'first_name', 'last_name', 'email', 'phone', 'domain', 'industry', 'city', 'province', 'country', 'notes', 'source_file', 'priority_bucket']
    });

    console.log(`Parsed ${records.length} records from CSV`);

    // Fetch unsubscribe list (case-insensitive)
    const { data: unsubscribeList } = await supabaseClient
      .from('unsubscribes')
      .select('email');
    
    const unsubscribedEmails = new Set(
      (unsubscribeList || []).map(u => u.email.toLowerCase())
    );

    console.log(`Found ${unsubscribedEmails.size} unsubscribed emails`);

    // Process records
    const validRecords = [];
    const skipped = {
      no_email_phone: 0,
      unsubscribed: 0,
      invalid: 0
    };

    for (const record of records) {
      const email = record.email?.trim();
      const phone = record.phone?.trim();

      // Skip if no email or phone
      if (!email && !phone) {
        skipped.no_email_phone++;
        continue;
      }

      // Skip if unsubscribed (case-insensitive)
      if (email && unsubscribedEmails.has(email.toLowerCase())) {
        skipped.unsubscribed++;
        continue;
      }

      // Build lead object
      const firstName = record.first_name?.trim() || '';
      const lastName = record.last_name?.trim() || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
      
      validRecords.push({
        name: fullName,
        email: email || null,
        company: record.company?.trim() || 'Unknown',
        notes: JSON.stringify({
          phone: phone || null,
          domain: record.domain || null,
          industry: record.industry || null,
          city: record.city || null,
          province: record.province || null,
          country: record.country || null,
          source_file: record.source_file || null,
          priority_bucket: record.priority_bucket || null,
          list_name
        }),
        source: 'csv_import'
      });
    }

    console.log(`Valid records: ${validRecords.length}`);
    console.log(`Skipped: ${JSON.stringify(skipped)}`);

    // Upsert leads (on conflict with email, update)
    const { data: upsertedLeads, error: upsertError } = await supabaseClient
      .from('leads')
      .upsert(validRecords, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      throw upsertError;
    }

    console.log(`Upserted ${upsertedLeads?.length || 0} leads`);

    // Log analytics event
    await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'leads_import',
        event_data: {
          list_name,
          total_parsed: records.length,
          valid_imported: validRecords.length,
          skipped,
          timestamp: new Date().toISOString()
        },
        severity: 'info'
      });

    return new Response(
      JSON.stringify({
        success: true,
        list_name,
        total_parsed: records.length,
        imported: validRecords.length,
        skipped,
        leads: upsertedLeads
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in ops-leads-import:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
