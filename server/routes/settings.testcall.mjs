import express from 'express';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

router.post('/api/settings/test-call', async (req, res) => {
  try {
    const { email_to } = req.body;

    if (!email_to) {
      return res.status(400).json({ error: 'Missing email_to' });
    }

    // Get org by email
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .select('*')
      .eq('email_to', email_to.toLowerCase())
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get org settings
    const { data: settings, error: settingsError } = await supabase
      .from('org_settings')
      .select('*')
      .eq('org_id', org.id)
      .single();

    if (settingsError || !settings) {
      return res.status(404).json({ error: 'Organization settings not found' });
    }

    // Place test call
    const call = await twilioClient.calls.create({
      to: settings.business_target_e164,
      from: process.env.TWILIO_PHONE_NUMBER || '+15005550006', // Test number fallback
      twiml: `<Response>
        <Say voice="alice">This is a test call from TradeLine 24 slash 7. Your system is working correctly. Goodbye.</Say>
        <Hangup/>
      </Response>`
    });

    console.log(`Test call placed: ${call.sid} to ${settings.business_target_e164}`);

    res.json({ 
      ok: true, 
      placed: true,
      call_sid: call.sid
    });

  } catch (error) {
    console.error('Test call error:', error);
    res.status(500).json({ error: 'Failed to place test call' });
  }
});

export default router;