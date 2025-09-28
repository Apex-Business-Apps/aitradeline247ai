import { createClient } from '@supabase/supabase-js';
import { sendInitial, applyOptStatus } from '../lib/outreach.mjs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function getSessionsHandler(req, res) {
  try {
    const { state, e164, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('outreach_sessions')
      .select('id, call_sid, e164, channel, state, last_sent_at, followup_due_at, created_at')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (state) {
      query = query.eq('state', state);
    }
    
    if (e164) {
      query = query.ilike('e164', `%${e164}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const nextOffset = data.length === parseInt(limit) ? parseInt(offset) + parseInt(limit) : null;

    res.json({
      items: data.map(session => ({
        id: session.id,
        callSid: session.call_sid,
        e164: session.e164,
        channel: session.channel,
        state: session.state,
        lastSentAt: session.last_sent_at,
        followupDueAt: session.followup_due_at,
        createdAt: session.created_at
      })),
      nextOffset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getSessionDetailHandler(req, res) {
  try {
    const { id } = req.params;

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('outreach_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from('outreach_messages')
      .select('direction, body, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return res.status(500).json({ error: messagesError.message });
    }

    // Get consent status
    const { data: consent, error: consentError } = await supabase
      .from('v_latest_consent')
      .select('status, channel, last_change_at')
      .eq('e164', session.e164);

    const consentData = {};
    if (!consentError && consent) {
      consent.forEach(c => {
        consentData[c.channel] = {
          status: c.status,
          lastChangeAt: c.last_change_at
        };
      });
    }

    res.json({
      session: {
        id: session.id,
        callSid: session.call_sid,
        e164: session.e164,
        channel: session.channel,
        state: session.state,
        lastSentAt: session.last_sent_at,
        followupDueAt: session.followup_due_at,
        createdAt: session.created_at,
        meta: session.meta
      },
      messages: messages || [],
      consent: consentData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function resendInitialHandler(req, res) {
  try {
    const { id } = req.params;

    const { data: session, error } = await supabase
      .from('outreach_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await sendInitial(session);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function cancelSessionHandler(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('outreach_sessions')
      .update({ state: 'stopped' })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function manageConsentHandler(req, res) {
  try {
    const { e164, action, channel } = req.body;

    if (!e164 || !action || !channel) {
      return res.status(400).json({ error: 'Missing required fields: e164, action, channel' });
    }

    if (!['opt_in', 'opt_out'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be opt_in or opt_out' });
    }

    if (!['sms', 'whatsapp'].includes(channel)) {
      return res.status(400).json({ error: 'Invalid channel. Must be sms or whatsapp' });
    }

    await applyOptStatus(e164, channel, action);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function setupAdminAPI(app) {
  app.get('/api/outreach/sessions', getSessionsHandler);
  app.get('/api/outreach/sessions/:id', getSessionDetailHandler);
  app.post('/api/outreach/sessions/:id/actions/resend-initial', resendInitialHandler);
  app.post('/api/outreach/sessions/:id/actions/cancel', cancelSessionHandler);
  app.post('/api/outreach/consent', manageConsentHandler);
}