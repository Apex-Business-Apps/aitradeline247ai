import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.190.0/encoding/csv.ts";
import { checkAdminAuth } from "../_shared/adminAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// E.164 phone number format: +[country code][number] (max 15 digits)
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

// Sanitize text fields to prevent injection
function sanitizeText(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML/script tags
    .substring(0, maxLength);
}

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

    // Security: Verify admin access
    const { userId } = await checkAdminAuth(req, supabaseClient);

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

    // Process records with validation
    const validRecords = [];
    const skipped = {
      no_email_phone: 0,
      unsubscribed: 0,
      invalid_format: 0
    };

    for (let rowIndex = 0; rowIndex < records.length; rowIndex++) {
      const record = records[rowIndex];
      
      const email = sanitizeText(record.email, 255);
      const phone = sanitizeText(record.phone, 20);

      // Validate email format
      if (email && !EMAIL_REGEX.test(email)) {
        skipped.invalid_format++;
        console.warn(`Row ${rowIndex + 1}: Invalid email format:`, email);
        continue;
      }

      // Validate phone format if provided
      if (phone && !E164_REGEX.test(phone)) {
        skipped.invalid_format++;
        console.warn(`Row ${rowIndex + 1}: Invalid phone format (must be E.164):`, phone);
        continue;
      }

      // Must have at least email or phone
      if (!email && !phone) {
        skipped.no_email_phone++;
        continue;
      }

      // Skip if unsubscribed (case-insensitive)
      if (email && unsubscribedEmails.has(email.toLowerCase())) {
        skipped.unsubscribed++;
        continue;
      }

      // Build lead object with sanitized data
      const firstName = sanitizeText(record.first_name, 50);
      const lastName = sanitizeText(record.last_name, 50);
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
      
      validRecords.push({
        name: sanitizeText(fullName, 100),
        email: email || '',
        company: sanitizeText(record.company, 100),
        phone: phone || null,
        country: sanitizeText(record.country, 2),
        notes: JSON.stringify({
          list_name: sanitizeText(list_name, 100),
          import_date: new Date().toISOString(),
          original_row: rowIndex + 1,
          domain: sanitizeText(record.domain, 100),
          industry: sanitizeText(record.industry, 50),
          city: sanitizeText(record.city, 50),
          province: sanitizeText(record.province, 50)
        }).substring(0, 2000), // Limit notes field
        source: 'csv_import',
        lead_score: 0
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

    // Log analytics event with user info
    await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'leads_imported',
        user_id: userId,
        event_data: {
          list_name,
          total_rows: records.length,
          imported: upsertedLeads?.length || 0,
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
