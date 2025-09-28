import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error("Missing required Twilio credentials: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
}

const client = Twilio(accountSid, authToken);

export const voiceClient = client.calls;
export const msgClient = client.messages;

/**
 * Start an outbound call to connect caller back to business
 * @param {string} toNumber - Phone number to call (E164 format)
 * @param {string} url - TwiML URL for call handling
 * @returns {Promise} - Twilio call object
 */
export async function startOutbound(toNumber, url) {
  const callOptions = {
    to: toNumber,
    from: process.env.TWILIO_CALLER_ID || process.env.BUSINESS_TARGET_E164,
    url: url,
    method: 'GET'
  };
  
  return await voiceClient.create(callOptions);
}

export async function sendWhatsApp(toE164, payloadOrText) {
  const cleanNumber = toE164.replace(/^whatsapp:/, '').replace(/^\+/, '');
  const whatsappTo = `whatsapp:+${cleanNumber}`;
  
  let messageOptions = {
    from: process.env.WHATSAPP_FROM,
    to: whatsappTo,
  };

  // Add messaging service if available
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  }

  if (typeof payloadOrText === 'object') {
    // Interactive message with content SID
    if (process.env.WHATSAPP_CONTENT_SID) {
      messageOptions.contentSid = process.env.WHATSAPP_CONTENT_SID;
      messageOptions.contentVariables = JSON.stringify(payloadOrText);
    } else {
      // Fallback to text with action buttons
      const { buttons, body } = payloadOrText;
      messageOptions.body = `${body}\n\n${buttons.map((btn, i) => `• ${btn}: Reply ${i + 1}`).join('\n')}`;
    }
  } else {
    // Simple text message
    messageOptions.body = payloadOrText;
  }

  return await msgClient.create(messageOptions);
}

export async function sendSMS(toE164, text) {
  const cleanNumber = toE164.replace(/^whatsapp:/, '').replace(/^\+/, '');
  const smsTo = cleanNumber.startsWith('1') ? `+${cleanNumber}` : `+1${cleanNumber}`;
  
  let messageOptions = {
    from: process.env.SMS_FROM,
    to: smsTo,
    body: text
  };

  // Add messaging service if available  
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  }

  return await msgClient.create(messageOptions);
}