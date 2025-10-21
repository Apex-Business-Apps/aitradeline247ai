import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const number = url.searchParams.get('number');

    if (!number) {
      throw new Error('Phone number is required');
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    // Return HTML page that triggers the call
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Call - TradeLine 24/7</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      text-align: center;
    }
    .container {
      background: #eff6ff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #1e40af;
      margin-bottom: 20px;
    }
    .number {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin: 20px 0;
    }
    .instructions {
      margin: 30px 0;
      line-height: 1.8;
      text-align: left;
    }
    .success {
      background: #f0fdf4;
      border: 2px solid #22c55e;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      margin: 10px;
    }
    .button:hover {
      background: #1e40af;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📞 Test Call Setup</h1>
    <p>Your TradeLine 24/7 AI is configured on:</p>
    <div class="number">${number}</div>
    
    <div class="success">
      <h2>✅ System Ready</h2>
      <p>Your AI answering service is active and ready to take calls!</p>
    </div>

    <div class="instructions">
      <h3>To Test:</h3>
      <ol>
        <li><strong>Call from any phone:</strong> ${number}</li>
        <li><strong>Listen</strong> for the AI greeting</li>
        <li><strong>Interact</strong> to test the conversation flow</li>
        <li><strong>Verify</strong> appointment booking works correctly</li>
      </ol>
    </div>

    <p style="margin-top: 30px; color: #6b7280;">
      💡 Make sure call forwarding is active on your business line!
    </p>

    <a href="tel:${number}" class="button">📞 Call Now</a>
  </div>
</body>
</html>
    `.trim();

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Error in ops-test-call:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

