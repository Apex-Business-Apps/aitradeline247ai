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

// Server-side validation schema
interface LeadSubmission {
  name: string;
  email: string;
  company: string;
  notes?: string;
  phone?: string;
}

// Input sanitization function
function sanitizeInput(input: string, maxLength: number): string {
  if (!input) return '';
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Comprehensive server-side validation
function validateLeadData(data: any): { isValid: boolean; errors: string[]; sanitizedData?: LeadSubmission } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Invalid request format');
    return { isValid: false, errors };
  }

  // Validate and sanitize name
  const name = sanitizeInput(data.name, 100);
  if (!name || name.length < 1) {
    errors.push('Name is required');
  } else if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
    errors.push('Name contains invalid characters');
  }

  // Validate and sanitize email
  const email = sanitizeInput(data.email, 255).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Invalid email address');
  }

  // Validate and sanitize company
  const company = sanitizeInput(data.company, 200);
  if (!company || company.length < 1) {
    errors.push('Company name is required');
  } else if (!/^[a-zA-Z0-9\s\-&.,()]+$/.test(company)) {
    errors.push('Company name contains invalid characters');
  }

  // Validate and sanitize notes (optional)
  const notes = data.notes ? sanitizeInput(data.notes, 2000) : '';

  // Validate and sanitize phone (optional)
  const phone = data.phone ? sanitizeInput(data.phone, 20) : '';

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /script/gi,
    /<[^>]*>/gi,
    /javascript:/gi,
    /on\w+=/gi,
    /(union|select|drop|delete|update|insert)/gi
  ];

  const allText = `${name} ${email} ${company} ${notes} ${phone}`;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(allText)) {
      errors.push('Suspicious content detected');
      break;
    }
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

    console.log('Secure lead submission successful:', {
      leadId: insertedLead.id,
      leadScore: insertedLead.lead_score
    });

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        leadId: insertedLead.id,
        leadScore: insertedLead.lead_score,
        remainingAttempts: rateLimitResult.remaining - 1
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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