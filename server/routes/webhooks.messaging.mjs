import { validateTwilio } from '../lib/validateTwilio.mjs';
import { applyOptStatus, handleReply } from '../lib/outreach.mjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export function messagingWebhookHandler(req, res) {
  console.log("Messaging webhook received:", req.body);
  
  const { From, To, Body, MessageSid } = req.body || {};
  
  // Normalize sender number
  const senderE164 = From?.replace(/^whatsapp:/, '').replace(/^\+/, '');
  const channel = From?.startsWith('whatsapp:') ? 'whatsapp' : 'sms';
  const messageBody = String(Body || '').trim();
  
  // Handle STOP/START opt-out/in
  if (['stop', 'unsubscribe', 'quit', 'cancel'].includes(messageBody.toLowerCase())) {
    applyOptStatus(senderE164, channel, 'opt_out')
      .then(() => console.log(`Opted out ${senderE164} from ${channel}`))
      .catch(err => console.error('Opt-out error:', err));
    return res.status(200).send('OK');
  }
  
  if (['start', 'subscribe', 'yes'].includes(messageBody.toLowerCase())) {
    applyOptStatus(senderE164, channel, 'opt_in')
      .then(() => console.log(`Opted in ${senderE164} to ${channel}`))
      .catch(err => console.error('Opt-in error:', err));
    return res.status(200).send('OK');
  }

  // Find recent session for this number (within 48h)
  const findRecentSession = async () => {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('outreach_sessions')
      .select('*')
      .eq('e164', senderE164)
      .gte('created_at', cutoff)
      .in('state', ['pending', 'sent'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error finding session:', error);
      return null;
    }
    
    return data[0] || null;
  };

  // Process the reply asynchronously
  findRecentSession()
    .then(async (session) => {
      if (!session) {
        console.log(`No recent session found for ${senderE164}`);
        return;
      }

      // Log inbound message
      await supabase.from('outreach_messages').insert({
        session_id: session.id,
        direction: 'in',
        body: messageBody,
        payload: { message_sid: MessageSid }
      });

      // Map message to signal
      let signal = messageBody;
      if (['1', 'call', 'call now'].includes(messageBody.toLowerCase())) {
        signal = '1';
      } else if (['2', 'book', 'book time', 'schedule'].includes(messageBody.toLowerCase())) {
        signal = '2';
      } else if (['3', 'note', 'leave note', 'message'].includes(messageBody.toLowerCase())) {
        signal = '3';
      }

      await handleReply(session, signal);
      console.log(`Handled reply for session ${session.id}: ${signal}`);
    })
    .catch(err => {
      console.error('Error processing reply:', err);
    });

  res.status(200).send('OK');
}

// Export the route setup function
export function setupMessagingWebhook(app) {
  app.post('/webhooks/messaging/twilio', validateTwilio, messagingWebhookHandler);
}