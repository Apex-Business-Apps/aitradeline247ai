import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const maskPII = (text: string): string => {
  if (!text) return text;
  
  // Mask email addresses
  text = text.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, user, domain) => {
    return `${user.charAt(0)}***@${domain}`;
  });
  
  // Mask phone numbers (various formats)
  text = text.replace(/(\+?1?\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, (match) => {
    const digits = match.replace(/\D/g, '');
    return `***-***-${digits.slice(-4)}`;
  });
  
  return text;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const { callSid } = await req.json();
    
    if (!callSid) {
      throw new Error('callSid is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(RESEND_API_KEY);

    // Get call log with organization settings
    const { data: callLog, error: callError } = await supabase
      .from('call_logs')
      .select(`
        *,
        organization:organizations!call_logs_organization_id_fkey (
          name,
          settings
        )
      `)
      .eq('call_sid', callSid)
      .single();

    if (callError || !callLog) {
      throw new Error('Call log not found');
    }

    const transcriptEmail = callLog.organization?.settings?.transcript_email || 'jrmendozaceo@apexbusiness-systems.com';
    const orgName = callLog.organization?.name || 'TradeLine 24/7';

    // Build summary bullets
    const bullets = [];
    if (callLog.captured_fields?.name) bullets.push(`Name: ${callLog.captured_fields.name}`);
    if (callLog.captured_fields?.callback_number) bullets.push(`Callback: ***-***-${callLog.captured_fields.callback_number.slice(-4)}`);
    if (callLog.captured_fields?.email) bullets.push(`Email: ${maskPII(callLog.captured_fields.email)}`);
    if (callLog.captured_fields?.preferred_time) bullets.push(`Preferred time: ${callLog.captured_fields.preferred_time}`);

    const summary = bullets.length > 0 ? bullets.join('\n• ') : 'No specific details captured';

    // Calculate duration
    const started = new Date(callLog.started_at);
    const ended = callLog.ended_at ? new Date(callLog.ended_at) : new Date();
    const durationSeconds = Math.floor((ended.getTime() - started.getTime()) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    // Mask transcript
    const maskedTranscript = maskPII(callLog.transcript || 'No transcript available');

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: `${orgName} <transcripts@resend.dev>`,
      to: [transcriptEmail],
      subject: `Call Transcript: ${callLog.from_e164.slice(-4)} (${started.toLocaleDateString()})`,
      html: `
        <h2>Call Transcript</h2>
        <p><strong>Caller:</strong> ***-***-${callLog.from_e164.slice(-4)}</p>
        <p><strong>Date:</strong> ${started.toLocaleString()}</p>
        <p><strong>Duration:</strong> ${minutes}m ${seconds}s</p>
        <p><strong>Mode:</strong> ${callLog.mode === 'llm' ? 'AI Assistant' : 'Direct Bridge'}</p>
        ${callLog.handoff ? '<p><strong>⚠️ Transferred to human</strong></p>' : ''}
        
        <h3>Summary</h3>
        <ul>
          <li>${summary.replace(/\n/g, '</li><li>')}</li>
        </ul>

        <h3>Transcript</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${maskedTranscript}</div>

        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          <strong>Audit Trail JSON:</strong><br>
          <code style="background: #f5f5f5; padding: 10px; display: block; margin-top: 5px; border-radius: 3px; overflow-x: auto;">
            ${JSON.stringify({
              call_sid: callSid,
              from: '***-***-' + callLog.from_e164.slice(-4),
              mode: callLog.mode,
              handoff: callLog.handoff,
              captured_fields: callLog.captured_fields,
              started_at: callLog.started_at,
              ended_at: callLog.ended_at
            }, null, 2)}
          </code>
        </p>
      `,
    });

    if (emailError) {
      throw emailError;
    }

    // Mark transcript as sent
    await supabase
      .from('call_logs')
      .update({ transcript_url: 'email-sent' })
      .eq('call_sid', callSid);

    console.log('✅ Transcript email sent to:', transcriptEmail);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending transcript:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
