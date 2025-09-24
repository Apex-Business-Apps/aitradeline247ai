import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { name, email, company, notes }: LeadSubmissionRequest = await req.json();

    console.log("Processing lead submission:", { name, email, company });

    // Validate required fields
    if (!name || !email || !company) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, and company are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send notification email to TradeLine 24/7 team
    const notificationEmail = await resend.emails.send({
      from: "TradeLine 24/7 <leads@tradeline247ai.com>",
      to: ["info@tradeline247ai.com"],
      reply_to: email,
      subject: `🚀 New Lead: ${company} - ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b35, #ff8c5f); padding: 30px; border-radius: 12px; color: white; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 New Lead Captured!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone wants to grow their business with TradeLine 24/7</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0;">Lead Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666; width: 100px;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #ff6b35; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Company:</td>
                <td style="padding: 8px 0; color: #333;">${company}</td>
              </tr>
              ${notes ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666; vertical-align: top;">Notes:</td>
                <td style="padding: 8px 0; color: #333;">${notes}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">⚡ Quick Actions</h3>
            <a href="mailto:${email}?subject=Welcome%20to%20TradeLine%2024%2F7%20%2D%20Let%27s%20discuss%20your%20AI%20receptionist&body=Hi%20${encodeURIComponent(name)}%2C%0A%0AThank%20you%20for%20your%20interest%20in%20TradeLine%2024%2F7%21%20I%27d%20love%20to%20discuss%20how%20our%20AI%20receptionist%20can%20help%20${encodeURIComponent(company)}%20grow.%0A%0AWhat%27s%20the%20best%20time%20for%20a%20quick%2015%2Dminute%20call%20this%20week%3F%0A%0ABest%20regards%2C%0ATradeLine%2024%2F7%20Team" 
               style="display: inline-block; background: #ff6b35; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-right: 10px;">
              📧 Reply to Lead
            </a>
            <a href="https://cal.com/tradeline247" target="_blank"
               style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              📅 Schedule Call
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
            <p>This lead was captured from <strong>tradeline247.com</strong> on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      `,
    });

    console.log("Notification email sent:", notificationEmail);

    // Send confirmation email to the lead
    const confirmationEmail = await resend.emails.send({
      from: "TradeLine 24/7 <welcome@tradeline247ai.com>",
      to: [email],
      subject: `Welcome to TradeLine 24/7, ${name}! 🚀`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b35, #ff8c5f); padding: 30px; border-radius: 12px; color: white; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to TradeLine 24/7! 🎉</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your AI receptionist journey starts now</p>
          </div>
          
          <div style="padding: 0 20px;">
            <p style="font-size: 18px; color: #333; line-height: 1.6;">Hi ${name},</p>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              Thank you for choosing TradeLine 24/7! We're excited to help <strong>${company}</strong> 
              transform customer interactions with our AI-powered receptionist service.
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
                  <span style="color: #333;"><strong>Custom Setup:</strong> We'll configure your AI receptionist for your business</span>
                </div>
                <div style="display: flex; align-items: center; margin: 10px 0;">
                  <span style="background: #ff6b35; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px;">3</span>
                  <span style="color: #333;"><strong>Go Live:</strong> Start capturing leads and handling calls 24/7</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tradeline247.com/dashboard" 
                 style="display: inline-block; background: #ff6b35; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                🎯 Access Your Dashboard
              </a>
            </div>
            
            <div style="background: #e8f4fd; border-left: 4px solid #2196F3; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #1976D2; margin-top: 0; font-size: 16px;">💡 Quick Tip</h3>
              <p style="color: #666; margin: 0; line-height: 1.6;">
                Have questions before our call? Reply to this email or check out our 
                <a href="https://tradeline247.com/faq" style="color: #ff6b35;">FAQ page</a> for instant answers.
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
              TradeLine 24/7 - Your AI Receptionist That Never Sleeps
              <br>
              <a href="https://tradeline247.com" style="color: #ff6b35;">tradeline247.com</a> | Toronto, ON, Canada
            </p>
            <p style="margin: 15px 0 5px 0;">
              <a href="https://tradeline247.com/privacy" style="color: #999; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://tradeline247.com/terms" style="color: #999; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log("Confirmation email sent:", confirmationEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead captured successfully! Check your email for next steps.",
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