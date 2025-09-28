import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

const tw = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function sendSMSFallback({ to, callSid, dedupeKey }) {
  console.log(`Attempting SMS fallback for ${callSid} to ${to}`);
  
  try {
    // Clean phone number format
    const cleanNumber = to.replace(/^whatsapp:/, '').replace(/^\+/, '');
    const smsTo = cleanNumber.startsWith('1') ? `+${cleanNumber}` : `+1${cleanNumber}`;
    
    const bookingUrl = process.env.BOOKING_URL || "https://www.tradeline247ai.com/book";
    
    let messageOptions = {
      from: process.env.SMS_FROM,
      to: smsTo,
      body: `📞 We just missed you. Book instantly here: ${bookingUrl}`
    };

    // Add messaging service if available  
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    }

    const message = await tw.messages.create(messageOptions);
    console.log(`SMS fallback sent for ${callSid}:`, message.sid);
    
    // Log successful outreach
    await supa.from("outreach_events").upsert({
      call_sid: callSid, 
      channel: "sms", 
      status: "sent", 
      dedupe_key: dedupeKey,
      payload: { message_sid: message.sid, to: smsTo }
    }, { onConflict: "call_sid,channel,dedupe_key" });
    
    return true;
  } catch (e) {
    console.error(`SMS fallback failed for ${callSid}:`, e.message);
    
    // Log failed outreach
    await supa.from("outreach_events").upsert({
      call_sid: callSid, 
      channel: "sms", 
      status: "failed", 
      dedupe_key: dedupeKey, 
      payload: { error: String(e.message) }
    }, { onConflict: "call_sid,channel,dedupe_key" });
    
    return false;
  }
}