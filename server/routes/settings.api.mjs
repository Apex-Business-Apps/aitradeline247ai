import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { isNANP } from '../lib/e164.mjs';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/settings?email_to=...
router.get('/api/settings', async (req, res) => {
  try {
    const { email_to } = req.query;

    if (!email_to) {
      return res.status(400).json({ error: 'Missing email_to parameter' });
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
    const { data: settings } = await supabase
      .from('org_settings')
      .select('*')
      .eq('org_id', org.id)
      .single();

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', org.id)
      .single();

    res.json({
      org,
      settings,
      subscription
    });

  } catch (error) {
    console.error('Settings GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings
router.post('/api/settings', async (req, res) => {
  try {
    const { email_to, business_name, business_target_e164, email_recipients } = req.body;

    if (!email_to || !business_name || !business_target_e164) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate E.164
    if (!isNANP(business_target_e164)) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Please use US/Canada format: +1XXXXXXXXXX' 
      });
    }

    // Get org
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .select('*')
      .eq('email_to', email_to.toLowerCase())
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Upsert org settings
    const { error: settingsError } = await supabase
      .from('org_settings')
      .upsert({
        org_id: org.id,
        business_name,
        business_target_e164,
        email_recipients: email_recipients || [],
        updated_at: new Date().toISOString()
      });

    if (settingsError) {
      throw settingsError;
    }

    res.json({ ok: true });

  } catch (error) {
    console.error('Settings POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;