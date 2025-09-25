import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Import Resend via ESM
const resendApiKey = Deno.env.get("RESEND_API_KEY");

// Resend email sending function
const sendEmail = async (to: string, subject: string, html: string, from: string) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${errorText}`);
  }

  return await response.json();
};

// Initialize Supabase client for the edge function
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-csrf-token",
  "Content-Security-Policy": "default-src 'self'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
};

// Enhanced validation schema with security constraints
const leadSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "Name contains invalid characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .toLowerCase(),
  company: z.string()
    .trim()
    .min(1, "Company name is required")
    .max(200, "Company name must be less than 200 characters")
    .regex(/^[a-zA-Z0-9\s\-&.,()]+$/, "Company name contains invalid characters"),
  notes: z.string()
    .trim()
    .max(2000, "Notes must be less than 2000 characters")
    .optional()
    .default("")
});

interface LeadSubmissionRequest {
  name: string;
  email: string;
  company: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input with Zod schema
    const validationResult = leadSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.log("Validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data", 
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { name, email, company, notes } = validationResult.data;
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    console.log("Processing lead submission:", { name, email, company, ip: clientIP });

    // Rate limiting check - prevent spam submissions
    const { data: recentSubmissions } = await supabase
      .from('leads')
      .select('created_at')
      .eq('email', email)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (recentSubmissions && recentSubmissions.length >= 3) {
      console.log(`Rate limit exceeded for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Too many submissions from this email. Please wait 24 hours before submitting again." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Additional business email validation
    const leadEmailDomain = email.split('@')[1];
    const isBusinessEmail = !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'].includes(leadEmailDomain.toLowerCase());
    
    if (!isBusinessEmail) {
      console.log(`Personal email domain detected: ${leadEmailDomain}`);
    }

    // Store lead in database with automatic lead scoring
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert([{
        name,
        email,
        company,
        notes,
        source: 'website_lead_form'
      }])
      .select('*, lead_score')
      .single();

    if (leadError) {
      console.error("Lead storage error:", leadError);
      // Continue with email sending even if database insert fails
    }

    const leadScore = leadData?.lead_score || 50;
    const scoreEmailDomain = email.split('@')[1];

    console.log(`Lead scored: ${leadScore}/100 for ${company} (${scoreEmailDomain})`);

    // Determine lead priority and urgency
    const isHighValue = leadScore >= 70;
    const priorityEmoji = isHighValue ? '🔥 HIGH PRIORITY' : '📋 New Lead';
    const urgencyText = isHighValue ? 'URGENT: High-value lead detected!' : 'New lead captured';

    // Send notification email to TradeLine 24/7 team
    const notificationEmail = await sendEmail(
      "info@tradeline247ai.com",
      `🚀 ${priorityEmoji}: ${company} - ${name} (Score: ${leadScore}/100)`,
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b35, #ff8c5f); padding: 30px; border-radius: 12px; color: white; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${priorityEmoji}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${urgencyText}</p>
            <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; margin-top: 15px;">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">Lead Score: ${leadScore}/100</p>
            </div>
          </div>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Notes:</strong> ${notes || 'None provided'}</p>
        </div>`,
      "TradeLine 24/7 <info@tradeline247ai.com>"
    );

    console.log("Notification email sent:", notificationEmail);

    // Send confirmation email to the lead
    const confirmationEmail = await sendEmail(
      email,
      `Welcome to TradeLine 24/7, ${name}! 🚀`,
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b35, #ff8c5f); padding: 30px; border-radius: 12px; color: white; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to TradeLine 24/7! 🎉</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your AI receptionist journey starts now</p>
          </div>
          
          <div style="padding: 0 20px;">
            <p style="font-size: 18px; color: #333; line-height: 1.6;">Hi ${name},</p>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
      "Thank you for choosing TradeLine 24/7! We're excited to help <strong>${company}</strong> 
      get better call coverage with our service.
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
               <h2 style="color: #333; margin-top: 0; font-size: 20px;">🚀 What Happens Next?</h2>
              <div style="margin: 15px 0;">
                <div style="display: flex; align-items: center; margin: 10px 0;">
                  <span style="background: #ff6b35; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px;">1</span>
                  <span style="color: #333;"><strong>Within 2 hours:</strong> Our team will contact you to discuss your specific needs</span>
                </div>
                <div style="display: flex; align-items: center; margin: 10px 0;">
                  <span style="background: #ff6b35; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px;">2</span>
                  <span style="color: #333;"><strong>Custom Setup:</strong> We'll configure your service for your business</span>
                </div>
                <div style="display: flex; align-items: center; margin: 10px 0;">
                  <span style="background: #ff6b35; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px;">3</span>
                  <span style="color: #333;"><strong>Go Live:</strong> Start capturing leads and handling calls 24/7</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tradeline247ai.com/dashboard" 
                 style="display: inline-block; background: #ff6b35; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                🎯 Access Your Dashboard
              </a>
            </div>
            
            <div style="background: #e8f4fd; border-left: 4px solid #2196F3; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #1976D2; margin-top: 0; font-size: 16px;">💡 Quick Tip</h3>
               <p style="color: #666; margin: 0; line-height: 1.6;">
                 Have questions before our call? Reply to this email or check out our 
                 <a href="https://tradeline247ai.com/faq" style="color: #ff6b35;">FAQ page</a> for instant answers.
               </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <h3 style="color: #333; margin-top: 0;">📞 Need Immediate Help?</h3>
              <p style="color: #666; margin: 10px 0;">Call us: <a href="tel:+15552470247" style="color: #ff6b35; font-weight: bold;">+1 (555) 247-0247</a></p>
              <p style="color: #666; margin: 0;">Email: <a href="mailto:info@tradeline247ai.com" style="color: #ff6b35;">info@tradeline247ai.com</a></p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 14px;">
             <p style="margin: 5px 0;">
               TradeLine 24/7 - Your Service That Never Sleeps
               <br>
               <a href="https://tradeline247ai.com" style="color: #ff6b35;">tradeline247ai.com</a> | Toronto, ON, Canada
             </p>
           <p style="margin: 15px 0 5px 0;">
             <a href="https://tradeline247ai.com/privacy" style="color: #999; text-decoration: none;">Privacy Policy</a> | 
             <a href="https://tradeline247ai.com/terms" style="color: #999; text-decoration: none;">Terms of Service</a>
           </p>
          </div>
        </div>`,
      "TradeLine 24/7 <info@tradeline247ai.com>"
    );

    console.log("Confirmation email sent:", confirmationEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead captured successfully! Check your email for next steps.",
        lead_id: leadData?.id,
        lead_score: leadScore,
        notificationId: notificationEmail.data?.id,
        confirmationId: confirmationEmail.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-lead-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process lead submission", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);