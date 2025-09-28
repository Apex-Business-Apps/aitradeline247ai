import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

const tw = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function sendWhatsAppQuickReply({ to, callSid, dedupeKey }) {
  console.log(`Attempting WhatsApp outreach for ${callSid} to ${to}`);
  
  // Simple number capability probe; if it throws, fallback to SMS
  try {
    // Clean phone number format
    const cleanNumber = to.replace(/^whatsapp:/, '').replace(/^\+/, '');
    const whatsappTo = `whatsapp:+${cleanNumber}`;
    
    // If you have Content SID, use Content API; else send a simple interactive-text imitation
    const body = "📞 Missed your call — want to pick a slot now?";
    const actions = ["Book now","Call me back","Text me details"];
    const contentSid = process.env.WHATSAPP_CONTENT_SID || null;
    const bookingUrl = process.env.BOOKING_URL || "https://www.tradeline247ai.com/book";

    let messageOptions = {
      from: process.env.WHATSAPP_FROM,
      to: whatsappTo,
    };

    // Add messaging service if available
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    }

    if (contentSid) {
      // Use Twilio Content API for rich interactive messages
      messageOptions.contentSid = contentSid;
      messageOptions.contentVariables = JSON.stringify({
        1: actions[0], 
        2: actions[1], 
        3: actions[2],
        booking_url: bookingUrl
      });
    } else {
      // Fallback to simple text with action buttons
      messageOptions.body = `${body}\n\n• ${actions[0]}: ${bookingUrl}\n• ${actions[1]}: reply "CALL"\n• ${actions[2]}: reply "INFO"`;
    }

    const message = await tw.messages.create(messageOptions);
    console.log(`WhatsApp message sent for ${callSid}:`, message.sid);

    // Log successful outreach
    await supa.from("outreach_events").upsert({
      call_sid: callSid, 
      channel: "whatsapp", 
      status: "sent", 
      dedupe_key: dedupeKey,
      payload: { message_sid: message.sid, to: whatsappTo }
    }, { onConflict: "call_sid,channel,dedupe_key" });

    return true;
  } catch (e) {
    console.error(`WhatsApp outreach failed for ${callSid}:`, e.message);
    
    // Log failed outreach
    await supa.from("outreach_events").upsert({
      call_sid: callSid, 
      channel: "whatsapp", 
      status: "failed", 
      dedupe_key: dedupeKey, 
      payload: { error: String(e.message) }
    }, { onConflict: "call_sid,channel,dedupe_key" });
    
    return false;
  }
}