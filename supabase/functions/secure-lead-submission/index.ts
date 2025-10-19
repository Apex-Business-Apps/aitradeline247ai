import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { sanitizeText, sanitizeEmail, sanitizeName, detectSuspiciousContent, generateRequestHash } from '../_shared/sanitizer.ts';
import { createRequestContext, logWithContext, createResponseHeaders } from '../_shared/requestId.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Server-side validation schema
interface LeadSubmission {
  name: string;
  email: string;
  company: string;
  notes?: string;
  phone?: string;
}

// Use comprehensive sanitization from shared utility

// Comprehensive server-side validation
function validateLeadData(data: any): { isValid: boolean; errors: string[]; sanitizedData?: LeadSubmission } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Invalid request format');
    return { isValid: false, errors };
  }

  // Validate and sanitize name using comprehensive utility
  let name: string;
  try {
    name = sanitizeName(data.name, 100);
    if (!name || name.length < 1) {
      errors.push('Name is required');
    }
  } catch (err) {
    errors.push('Invalid name format');
    name = '';
  }

  // Validate and sanitize email using comprehensive utility
  let email: string;
  try {
    email = sanitizeEmail(data.email);
  } catch (err) {
    errors.push('Invalid email address');
    email = '';
  }

  // Validate and sanitize company using comprehensive utility
  let company: string;
  try {
    company = sanitizeName(data.company, 200);
    if (!company || company.length < 1) {
      errors.push('Company name is required');
    }
  } catch (err) {
    errors.push('Invalid company name');
    company = '';
  }

  // Validate and sanitize notes (optional) using comprehensive utility
  let notes = '';
  if (data.notes) {
    try {
      notes = sanitizeText(data.notes, { maxLength: 2000 });
    } catch (err) {
      errors.push('Invalid notes content');
    }
  }

  // Validate and sanitize phone (optional)
  let phone = '';
  if (data.phone) {
    try {
      phone = sanitizeText(data.phone, { maxLength: 20 });
    } catch (err) {
      errors.push('Invalid phone format');
    }
  }

  // Check for suspicious patterns using comprehensive utility
  const allText = `${name} ${email} ${company} ${notes} ${phone}`;
  if (detectSuspiciousContent(allText)) {
    errors.push('Suspicious content detected');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitizedData: { name, email, company, notes, phone }
  };
}

// Rate limiting check
async function checkRateLimit(supabase: any, clientIP: string): Promise<{ allowed: boolean; remaining: number }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('analytics_events')
    .select('id')
    .eq('event_type', 'secure_lead_submission')
    .eq('ip_address', clientIP)
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: 3 }; // Fail open
  }

  const submissionCount = data?.length || 0;
  const maxSubmissions = 3;
  
  return {
    allowed: submissionCount < maxSubmissions,
    remaining: Math.max(0, maxSubmissions - submissionCount)
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestCtx = createRequestContext(req);
  logWithContext(requestCtx, 'info', 'Secure lead submission request received');

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(supabase, clientIP);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      
      // Log security event
      await supabase.from('analytics_events').insert({
        event_type: 'rate_limit_exceeded',
        event_data: { ip: clientIP, endpoint: 'secure_lead_submission' },
        ip_address: clientIP,
        page_url: 'security/rate-limit'
      });

      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          remainingAttempts: 0
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and validate request body
    const requestBody = await req.json();
    
    // Check for idempotency key
    const idempotencyKey = req.headers.get('idempotency-key') || 
                          requestBody.idempotency_key || 
                          await generateRequestHash({ ...requestBody, ip: clientIP });
    
    // Check if this request was already processed
    const { data: idempotencyCheck } = await supabase.rpc('check_idempotency', {
      p_key: idempotencyKey,
      p_operation: 'lead_submission',
      p_request_hash: await generateRequestHash(requestBody)
    });
    
    if (idempotencyCheck?.exists && idempotencyCheck?.status === 'completed') {
      logWithContext(requestCtx, 'info', 'Duplicate request detected - returning cached response');
      return new Response(
        JSON.stringify(idempotencyCheck.response_data),
        { 
          status: 200, 
          headers: { ...corsHeaders, ...createResponseHeaders(requestCtx), 'Content-Type': 'application/json' }
        }
      );
    }
    
    const validation = validateLeadData(requestBody);

    if (!validation.isValid) {
      console.warn('Invalid lead submission:', validation.errors);
      
      // Log security event for invalid data
      await supabase.from('analytics_events').insert({
        event_type: 'invalid_lead_submission',
        event_data: { 
          errors: validation.errors,
          ip: clientIP,
          userAgent: req.headers.get('user-agent')?.substring(0, 200) || 'unknown'
        },
        ip_address: clientIP,
        page_url: 'security/validation-failed'
      });

      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: validation.errors
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const leadData = validation.sanitizedData!;

    // Insert lead with audit logging
    const leadInsertData = {
      name: leadData.name,
      email: leadData.email,
      company: leadData.company,
      notes: leadData.notes || '',
      source: 'secure_website_form'
    };

    console.log('Processing secure lead submission:', {
      email: leadData.email,
      company: leadData.company,
      ip: clientIP
    });

    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert([leadInsertData])
      .select()
      .single();

    if (insertError) {
      console.error('Lead insertion error:', insertError);
      
      // Log security event for database error
      await supabase.from('analytics_events').insert({
        event_type: 'lead_insertion_failed',
        event_data: { 
          error: insertError.message,
          ip: clientIP
        },
        ip_address: clientIP,
        page_url: 'security/db-error'
      });

      return new Response(
        JSON.stringify({ error: 'Failed to process submission' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log successful secure submission
    await supabase.from('analytics_events').insert({
      event_type: 'secure_lead_submission',
      event_data: {
        lead_id: insertedLead.id,
        lead_score: insertedLead.lead_score,
        email_domain: leadData.email.split('@')[1],
        ip: clientIP,
        timestamp: new Date().toISOString()
      },
      ip_address: clientIP,
      page_url: 'secure/lead-form',
      user_agent: req.headers.get('user-agent')?.substring(0, 200) || 'unknown'
    });

    logWithContext(requestCtx, 'info', 'Secure lead submission successful', {
      leadId: insertedLead.id,
      leadScore: insertedLead.lead_score
    });

    // Prepare success response
    const successResponse = { 
      success: true,
      leadId: insertedLead.id,
      leadScore: insertedLead.lead_score,
      remainingAttempts: rateLimitResult.remaining - 1
    };
    
    // Complete idempotency tracking
    await supabase.rpc('complete_idempotency', {
      p_key: idempotencyKey,
      p_response: successResponse,
      p_status: 'completed'
    });

    // Return success response
    return new Response(
      JSON.stringify(successResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, ...createResponseHeaders(requestCtx), 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Secure lead submission error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
