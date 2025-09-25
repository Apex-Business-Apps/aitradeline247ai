import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting privacy data retention process...')

    // 1. Anonymize analytics events older than 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: anonymizeResult, error: anonymizeError } = await supabaseClient
      .rpc('anonymize_old_analytics_data')

    if (anonymizeError) {
      console.error('Error anonymizing analytics data:', anonymizeError)
      throw anonymizeError
    }

    console.log('Analytics data anonymization completed')

    // 2. Clean up expired sessions
    const { data: sessionResult, error: sessionError } = await supabaseClient
      .rpc('cleanup_expired_sessions')

    if (sessionError) {
      console.error('Error cleaning up sessions:', sessionError)
      throw sessionError
    }

    console.log('Session cleanup completed')

    // 3. Anonymize old leads (2+ years old)
    const { data: leadResult, error: leadError } = await supabaseClient
      .rpc('anonymize_old_leads')

    if (leadError) {
      console.error('Error anonymizing leads:', leadError)
      throw leadError
    }

    console.log('Lead data anonymization completed')

    // 4. Clean up expired RAG cache
    const { data: ragResult, error: ragError } = await supabaseClient
      .rpc('cleanup_expired_rag_cache')

    if (ragError) {
      console.error('Error cleaning up RAG cache:', ragError)
      throw ragError
    }

    console.log('RAG cache cleanup completed, expired entries:', ragResult)

    // 5. Additional privacy measures for immediate anonymization requests
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    // Anonymize analytics events with privacy_mode flag
    const { error: immediateAnonymizeError } = await supabaseClient
      .from('analytics_events')
      .update({
        ip_address: 'anonymized',
        user_agent: 'anonymized'
      })
      .filter('event_data->privacy_mode', 'eq', true)
      .lt('created_at', oneDayAgo.toISOString())

    if (immediateAnonymizeError) {
      console.error('Error with immediate anonymization:', immediateAnonymizeError)
    } else {
      console.log('Immediate anonymization completed')
    }

    // 6. Log retention activity for audit
    const { error: auditError } = await supabaseClient
      .from('analytics_events')
      .insert({
        event_type: 'privacy_data_retention',
        event_data: {
          action: 'automated_retention_process',
          timestamp: new Date().toISOString(),
          anonymized_analytics: 'completed',
          cleaned_sessions: 'completed',
          anonymized_leads: 'completed',
          cleaned_rag_cache: ragResult || 0,
          immediate_anonymization: 'completed'
        },
        user_session: 'system',
        page_url: 'data_retention_job'
      })

    if (auditError) {
      console.error('Error logging audit event:', auditError)
    }

    const summary = {
      success: true,
      message: 'Privacy data retention process completed successfully',
      actions_completed: [
        'analytics_data_anonymization',
        'session_cleanup',
        'lead_data_anonymization',
        'rag_cache_cleanup',
        'immediate_anonymization',
        'audit_logging'
      ],
      timestamp: new Date().toISOString()
    }

    console.log('Privacy data retention summary:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('Privacy data retention error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    )
  }
})