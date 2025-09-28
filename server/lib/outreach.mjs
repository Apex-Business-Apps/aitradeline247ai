import { createClient } from '@supabase/supabase-js';
import { sendWhatsApp, sendSMS, voiceClient } from './twilioClient.mjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase credentials: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function latestConsent(e164) {
  const { data, error } = await supabase
    .from('v_latest_consent')
    .select('channel, status')
    .eq('e164', e164);

  if (error) throw error;

  const result = { sms: null, whatsapp: null };
  data?.forEach(row => {
    result[row.channel] = row.status;
  });

  return result;
}

export async function chooseChannel(e164) {
  const { data: contact } = await supabase
    .from('contacts')
    .select('wa_capable')
    .eq('e164', e164)
    .single();

  const consent = await latestConsent(e164);
  
  if (contact?.wa_capable && consent.whatsapp !== 'opt_out') {
    return 'whatsapp';
  }
  
  return 'sms';
}

export async function maySendInitial(e164) {
  const { data, error } = await supabase
    .from('outreach_sessions')
    .select('id')
    .eq('e164', e164)
    .in('state', ['pending', 'sent'])
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (error) throw error;
  return data.length === 0;
}

export async function createSessionFromCall({ callSid, e164, meta }) {
  const { data, error } = await supabase
    .from('outreach_sessions')
    .upsert({
      call_sid: callSid,
      e164: e164,
      channel: await chooseChannel(e164),
      state: 'pending',
      meta: meta || {}
    }, { 
      onConflict: 'call_sid',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendInitial(session) {
  const businessName = process.env.BUSINESS_NAME || 'TradeLine 24/7';
  
  // Get contact name for personalization
  const { data: contact } = await supabase
    .from('contacts')
    .select('first_name')
    .eq('e164', session.e164)
    .single();
  
  const firstName = contact?.first_name || 'there';
  
  try {
    if (session.channel === 'whatsapp') {
      // WhatsApp interactive message with 3 buttons
      await sendWhatsApp(session.e164, {
        body: `📞 Hi ${firstName}, you just tried ${businessName}. How can we help?`,
        buttons: ['Call now', 'Book time', 'Leave note']
      });
    } else {
      // SMS with reply options
      const message = `Hi ${firstName}, you just tried ${businessName}. Reply 1) Call now 2) Book 3) Leave a note — Reply STOP to opt-out.`;
      await sendSMS(session.e164, message);
    }

    // Log outbound message
    await supabase.from('outreach_messages').insert({
      session_id: session.id,
      direction: 'out',
      body: session.channel === 'whatsapp' ? 'Interactive message sent' : 'Initial SMS sent'
    });

    // Update session state
    const followupTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    await supabase
      .from('outreach_sessions')
      .update({
        state: 'sent',
        last_sent_at: new Date().toISOString(),
        followup_due_at: followupTime.toISOString()
      })
      .eq('id', session.id);

  } catch (error) {
    console.error('Failed to send initial outreach:', error);
    throw error;
  }
}

export async function handleReply(session, signalOrText) {
  const signal = String(signalOrText).trim().toLowerCase();
  
  try {
    if (signal === '1' || signal === 'call now') {
      // Place outbound bridge call
      const targetNumber = process.env.BUSINESS_TARGET_E164;
      if (targetNumber) {
        await voiceClient.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: session.e164,
          twiml: `<Response><Dial answerOnBridge="true">${targetNumber}</Dial></Response>`
        });
      }
      
      await supabase.from('reply_events').insert({
        session_id: session.id,
        signal: 'call_request'
      });
      
    } else if (signal === '2' || signal === 'book time') {
      // Send booking link
      const baseUrl = process.env.BASE_URL || 'https://www.tradeline247ai.com';
      const bookingUrl = `${baseUrl}/book?src=tl247&n=${encodeURIComponent(session.e164)}`;
      
      if (session.channel === 'whatsapp') {
        await sendWhatsApp(session.e164, `Book your appointment here: ${bookingUrl}`);
      } else {
        await sendSMS(session.e164, `Book your appointment here: ${bookingUrl}`);
      }
      
      await supabase.from('reply_events').insert({
        session_id: session.id,
        signal: 'booking_request'
      });
      
    } else {
      // Store as note/free text
      await supabase.from('outreach_messages').insert({
        session_id: session.id,
        direction: 'in',
        body: signalOrText
      });
      
      await supabase.from('reply_events').insert({
        session_id: session.id,
        signal: 'note'
      });
    }

    // Mark session as responded
    await supabase
      .from('outreach_sessions')
      .update({ state: 'responded' })
      .eq('id', session.id);

  } catch (error) {
    console.error('Failed to handle reply:', error);
    throw error;
  }
}

export async function applyOptStatus(e164, channel, action) {
  const status = action === 'opt_in' ? 'opt_in' : 'opt_out';
  
  await supabase.from('consent_logs').insert({
    e164: e164,
    channel: channel,
    status: status,
    source: 'webhook'
  });
}

export async function dueFollowups() {
  const { data: sessions, error } = await supabase
    .from('outreach_sessions')
    .select('*')
    .eq('state', 'sent')
    .lte('followup_due_at', new Date().toISOString());

  if (error) throw error;

  let sent = 0;
  
  for (const session of sessions) {
    try {
      const nudgeMessage = "Still need help? Reply with your question or call us directly.";
      
      if (session.channel === 'whatsapp') {
        await sendWhatsApp(session.e164, nudgeMessage);
      } else {
        await sendSMS(session.e164, nudgeMessage);
      }

      await supabase.from('outreach_messages').insert({
        session_id: session.id,
        direction: 'out',
        body: 'Follow-up nudge sent'
      });

      await supabase
        .from('outreach_sessions')
        .update({ state: 'expired' })
        .eq('id', session.id);

      sent++;
    } catch (error) {
      console.error(`Failed to send followup for session ${session.id}:`, error);
    }
  }

  return sent;
}