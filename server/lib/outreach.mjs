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
    .select('*')
    .eq('e164', e164);

  if (error) {
    console.error('Error fetching consent:', error);
    return { sms: null, whatsapp: null };
  }

  const result = { sms: null, whatsapp: null };
  data.forEach(row => {
    result[row.channel] = row.status;
  });

  return result;
}

export async function chooseChannel(e164) {
  // Check contact capabilities and consent
  const { data: contact } = await supabase
    .from('contacts')
    .select('wa_capable')
    .eq('e164', e164)
    .single();

  const consent = await latestConsent(e164);

  // Use WhatsApp if capable and consented (or no explicit opt-out)
  if (contact?.wa_capable && consent.whatsapp !== 'opt_out') {
    return 'whatsapp';
  }

  // Default to SMS if not opted out
  return consent.sms !== 'opt_out' ? 'sms' : null;
}

export async function maySendInitial(e164) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('outreach_sessions')
    .select('id')
    .eq('e164', e164)
    .gte('created_at', cutoff)
    .in('state', ['pending', 'sent'])
    .limit(1);

  if (error) {
    console.error('Error checking recent sessions:', error);
    return false;
  }

  return data.length === 0;
}

export async function createSessionFromCall({ callSid, e164, meta }) {
  const { data, error } = await supabase
    .from('outreach_sessions')
    .upsert({
      call_sid: callSid,
      e164: e164,
      meta: meta || {},
      channel: await chooseChannel(e164)
    }, {
      onConflict: 'call_sid'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }

  return data;
}

export async function sendInitial(session) {
  // Get contact name for personalization
  const { data: contact } = await supabase
    .from('contacts')
    .select('first_name')
    .eq('e164', session.e164)
    .single();

  const firstName = contact?.first_name || 'there';
  const businessName = process.env.BUSINESS_NAME || 'our business';

  let messageResult;
  
  try {
    if (session.channel === 'whatsapp') {
      // Send interactive WhatsApp message
      const payload = {
        body: `Hi ${firstName}, you just tried ${businessName}. How can we help?`,
        buttons: ['Call now', 'Book time', 'Leave note']
      };
      messageResult = await sendWhatsApp(session.e164, payload);
    } else {
      // Send SMS
      const text = `Hi ${firstName}, you just tried ${businessName}. Reply 1) Call now 2) Book 3) Leave a note — Reply STOP to opt-out.`;
      messageResult = await sendSMS(session.e164, text);
    }

    // Log the outbound message
    await supabase.from('outreach_messages').insert({
      session_id: session.id,
      direction: 'out',
      body: messageResult.body,
      payload: { message_sid: messageResult.sid }
    });

    // Update session state
    const followupDue = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    await supabase
      .from('outreach_sessions')
      .update({
        state: 'sent',
        last_sent_at: new Date().toISOString(),
        followup_due_at: followupDue.toISOString()
      })
      .eq('id', session.id);

    console.log(`Initial outreach sent for session ${session.id}`);
  } catch (error) {
    console.error(`Failed to send initial outreach for session ${session.id}:`, error);
    throw error;
  }
}

export async function handleReply(session, signalOrText) {
  const signal = String(signalOrText).toLowerCase();

  try {
    if (signal === '1' || signal.includes('call')) {
      // Place outbound call
      const targetNumber = process.env.BUSINESS_TARGET_E164;
      if (targetNumber) {
        await voiceClient.create({
          to: session.e164,
          from: targetNumber,
          answerOnBridge: true,
          url: `${process.env.BASE_URL}/voice/answer/bridge`
        });
      }
    } else if (signal === '2' || signal.includes('book')) {
      // Send booking link
      const bookingUrl = `${process.env.BASE_URL}/book?src=tl247&n=${encodeURIComponent(session.e164)}`;
      const message = `Book your appointment here: ${bookingUrl}`;
      
      if (session.channel === 'whatsapp') {
        await sendWhatsApp(session.e164, message);
      } else {
        await sendSMS(session.e164, message);
      }
    } else if (signal === '3' || signal.includes('note')) {
      // Store note (just log for now)
      await supabase.from('reply_events').insert({
        session_id: session.id,
        signal: 'note'
      });
      console.log(`Note request for session ${session.id}`);
    } else {
      // Free text - store as note
      await supabase.from('reply_events').insert({
        session_id: session.id,
        signal: signalOrText
      });
      console.log(`Free text reply for session ${session.id}: ${signalOrText}`);
    }

    // Mark session as responded
    await supabase
      .from('outreach_sessions')
      .update({ state: 'responded' })
      .eq('id', session.id);

  } catch (error) {
    console.error(`Error handling reply for session ${session.id}:`, error);
    throw error;
  }
}

export async function applyOptStatus(e164, channel, action) {
  await supabase.from('consent_logs').insert({
    e164: e164,
    channel: channel,
    status: action,
    source: 'sms_reply'
  });
  
  console.log(`Applied ${action} for ${e164} on ${channel}`);
}

export async function dueFollowups() {
  const { data: sessions, error } = await supabase
    .from('outreach_sessions')
    .select('*')
    .eq('state', 'sent')
    .lte('followup_due_at', new Date().toISOString());

  if (error) {
    console.error('Error fetching due followups:', error);
    return 0;
  }

  let sent = 0;
  
  for (const session of sessions) {
    try {
      const message = "Still need help?";
      
      if (session.channel === 'whatsapp') {
        await sendWhatsApp(session.e164, message);
      } else {
        await sendSMS(session.e164, message);
      }

      // Log the nudge message
      await supabase.from('outreach_messages').insert({
        session_id: session.id,
        direction: 'out',
        body: message,
        payload: { type: 'followup_nudge' }
      });

      // Mark as expired
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