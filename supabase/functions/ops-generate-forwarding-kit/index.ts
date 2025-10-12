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
    
    const { tenant_id, business_name, phone_number, fallback_e164, contact_email } = await req.json();
    
    if (!tenant_id || !business_name || !phone_number) {
      throw new Error('Missing required fields');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate test call URL with QR code
    const testCallUrl = `${supabaseUrl}/functions/v1/ops-test-call?number=${encodeURIComponent(phone_number)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(testCallUrl)}`;

    // Create forwarding instructions HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Call Forwarding Kit - ${business_name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
    }
    .info-box {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 20px 0;
    }
    .info-box h2 {
      margin-top: 0;
      color: #1e40af;
    }
    .number {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .instructions {
      margin: 30px 0;
    }
    .carrier {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .carrier h3 {
      margin-top: 0;
      color: #374151;
    }
    .steps {
      margin-left: 20px;
    }
    .test-section {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: #f0fdf4;
      border-radius: 8px;
    }
    .qr-code {
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📞 TradeLine 24/7 Call Forwarding Kit</h1>
    <p><strong>${business_name}</strong></p>
  </div>

  <div class="info-box">
    <h2>Your New AI-Powered Number</h2>
    <div class="number">${phone_number}</div>
    <p>This number is now configured with TradeLine 24/7 AI answering service.</p>
  </div>

  <div class="instructions">
    <h2>Step 1: Forward Your Calls</h2>
    <p>Forward calls from your existing business line to your new TradeLine number using one of the methods below:</p>

    <div class="carrier">
      <h3>🏢 Office Phone / PBX System</h3>
      <div class="steps">
        <p><strong>Universal Method:</strong></p>
        <ol>
          <li>Dial <strong>*72</strong> from your office phone</li>
          <li>Wait for dial tone</li>
          <li>Dial your TradeLine number: <strong>${phone_number}</strong></li>
          <li>Wait for confirmation tone (usually 2 beeps)</li>
          <li>Hang up - all calls are now forwarded!</li>
        </ol>
        <p><em>To cancel forwarding: Dial <strong>*73</strong></em></p>
      </div>
    </div>

    <div class="carrier">
      <h3>📱 Bell / Bell MTS</h3>
      <div class="steps">
        <ol>
          <li>Dial <strong>*21</strong></li>
          <li>Enter: <strong>${phone_number}</strong></li>
          <li>Press <strong>#</strong></li>
        </ol>
        <p><em>To cancel: Dial <strong>#21#</strong></em></p>
      </div>
    </div>

    <div class="carrier">
      <h3>📱 Rogers / Fido</h3>
      <div class="steps">
        <ol>
          <li>Dial <strong>*21</strong></li>
          <li>Enter: <strong>${phone_number}</strong></li>
          <li>Press <strong>#</strong></li>
        </ol>
        <p><em>To cancel: Dial <strong>##21#</strong></em></p>
      </div>
    </div>

    <div class="carrier">
      <h3>📱 Telus / Koodo</h3>
      <div class="steps">
        <ol>
          <li>Dial <strong>*21</strong></li>
          <li>Enter: <strong>${phone_number}</strong></li>
          <li>Press <strong>Send</strong></li>
        </ol>
        <p><em>To cancel: Dial <strong>##21#</strong></em></p>
      </div>
    </div>

    <div class="carrier">
      <h3>📱 Freedom Mobile</h3>
      <div class="steps">
        <ol>
          <li>Dial <strong>*21*${phone_number}#</strong></li>
          <li>Press <strong>Call</strong></li>
        </ol>
        <p><em>To cancel: Dial <strong>##21#</strong></em></p>
      </div>
    </div>
  </div>

  <div class="test-section">
    <h2>Step 2: Test Your Setup</h2>
    <p>Scan this QR code to trigger a test call and verify the AI is answering:</p>
    <div class="qr-code">
      <img src="${qrCodeUrl}" alt="Test Call QR Code" />
    </div>
    <p><strong>Or visit:</strong><br/><a href="${testCallUrl}" target="_blank">${testCallUrl}</a></p>
    <p style="margin-top: 20px; font-size: 14px;">
      💡 <strong>Tip:</strong> Call your business number from a different phone to confirm forwarding is active.
    </p>
  </div>

  <div class="info-box">
    <h2>📋 Important Notes</h2>
    <ul>
      <li>Once forwarding is active, all calls will be answered by TradeLine 24/7 AI</li>
      <li>The AI will gather caller information and schedule appointments</li>
      <li>You'll receive notifications for all captured leads</li>
      <li>If forwarding doesn't work, contact your carrier for assistance</li>
      ${fallback_e164 ? `<li>Emergency failover number: ${fallback_e164}</li>` : ''}
    </ul>
  </div>

  <div class="footer">
    <p><strong>Need Help?</strong></p>
    ${contact_email ? `<p>Contact: ${contact_email}</p>` : ''}
    <p>TradeLine 24/7 - Never Miss a Call Again</p>
    <p style="margin-top: 10px; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `.trim();

    // Store the HTML in storage bucket
    const fileName = `forwarding-kits/${tenant_id}-${Date.now()}.html`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, htmlContent, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Return the HTML content directly if storage fails
      return new Response(JSON.stringify({
        success: true,
        content: htmlContent,
        url: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    console.log('Forwarding kit generated:', urlData.publicUrl);

    return new Response(JSON.stringify({
      success: true,
      url: urlData.publicUrl,
      file_name: fileName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating forwarding kit:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
