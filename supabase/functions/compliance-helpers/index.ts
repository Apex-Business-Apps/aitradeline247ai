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

// PIPEDA compliant consent messages
const CONSENT_MESSAGES = {
  recording: {
    spoken: "This call may be recorded or transcribed to deliver your message and improve our service quality. Your privacy is important to us and we follow Canadian privacy laws. To continue, please stay on the line.",
    banner: "📞 This call may be recorded or transcribed to deliver your message and improve service quality. We follow Canadian privacy laws (PIPEDA)."
  },
  data_collection: {
    spoken: "We collect personal information in accordance with Canadian privacy laws to provide and improve our services.",
    banner: "🔒 We collect personal information in accordance with Canadian privacy laws (PIPEDA) to provide and improve our services."
  },
  marketing: {
    spoken: "You may receive marketing communications from us. You can unsubscribe at any time.",
    banner: "📧 You may receive marketing communications. You can unsubscribe at any time as required by CASL."
  }
};

// CASL compliant email templates
const EMAIL_TEMPLATES = {
  marketing: {
    identification: "This message is sent by TradeLine 24/7, your AI receptionist service. Our mailing address is: Apex Business Systems, Edmonton, Alberta, Canada.",
    unsubscribe_text: "You can unsubscribe from these emails at any time by clicking the link below or contacting us directly.",
    unsubscribe_html: `<p>You can <a href="{{unsubscribe_url}}">unsubscribe from these emails</a> at any time or contact us directly.</p>`
  }
};

interface ConsentRequest {
  action: 'get_consent_message' | 'record_consent' | 'record_unsubscribe' | 'check_consent';
  consent_type: 'recording' | 'data_collection' | 'marketing';
  contact_identifier?: string;
  org_id?: string;
  source?: string;
  metadata?: any;
}

interface ConsentResponse {
  success: boolean;
  message?: string;
  consent_message?: {
    spoken: string;
    banner: string;
  };
  consent_status?: boolean;
  error?: string;
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

    const { action, consent_type, contact_identifier, org_id, source, metadata }: ConsentRequest = await req.json();

    console.log(`Compliance action: ${action} for type: ${consent_type}`);

    switch (action) {
      case 'get_consent_message': {
        const consentMessage = CONSENT_MESSAGES[consent_type];
        if (!consentMessage) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Invalid consent type' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const response: ConsentResponse = {
          success: true,
          consent_message: consentMessage
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'record_consent': {
        if (!contact_identifier || !org_id) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'contact_identifier and org_id are required' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Record consent in database
        const { error } = await supabase
          .from('consent_records')
          .upsert({
            org_id,
            contact_identifier,
            consent_type,
            consent_given: true,
            consent_timestamp: new Date().toISOString(),
            source: source || 'api',
            metadata: metadata || {}
          }, {
            onConflict: 'org_id,contact_identifier,consent_type'
          });

        if (error) {
          console.error('Failed to record consent:', error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to record consent' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const response: ConsentResponse = {
          success: true,
          message: 'Consent recorded successfully'
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'record_unsubscribe': {
        if (!contact_identifier || !org_id) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'contact_identifier and org_id are required' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Record unsubscribe/consent withdrawal
        const { error } = await supabase
          .from('consent_records')
          .upsert({
            org_id,
            contact_identifier,
            consent_type: consent_type || 'marketing',
            consent_given: false,
            withdraw_timestamp: new Date().toISOString(),
            source: source || 'unsubscribe',
            metadata: metadata || {}
          }, {
            onConflict: 'org_id,contact_identifier,consent_type'
          });

        if (error) {
          console.error('Failed to record unsubscribe:', error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to record unsubscribe' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const response: ConsentResponse = {
          success: true,
          message: 'Unsubscribe recorded successfully'
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'check_consent': {
        if (!contact_identifier || !org_id) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'contact_identifier and org_id are required' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check current consent status
        const { data, error } = await supabase
          .from('consent_records')
          .select('consent_given, consent_timestamp, withdraw_timestamp')
          .eq('org_id', org_id)
          .eq('contact_identifier', contact_identifier)
          .eq('consent_type', consent_type)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to check consent:', error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to check consent' 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const consentStatus = data ? data.consent_given && !data.withdraw_timestamp : false;

        const response: ConsentResponse = {
          success: true,
          consent_status: consentStatus
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default: {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid action' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

  } catch (error) {
    console.error('Error in compliance-helpers function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});