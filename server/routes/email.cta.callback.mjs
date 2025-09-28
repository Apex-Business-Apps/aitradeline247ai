import { verify } from '../lib/signer.mjs';
import { startOutbound } from '../lib/twilioClient.mjs';

const BASE_URL = process.env.BASE_URL;
const BUSINESS_TARGET_E164 = process.env.BUSINESS_TARGET_E164;

/**
 * Handle email CTA callback - initiate call back to original caller
 * GET /a/c?t=<token>
 */
export async function emailCtaCallbackHandler(req, res) {
  try {
    const { t: token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    // Verify and decode token
    let payload;
    try {
      payload = verify(token);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    const { callSid, toE164 } = payload;
    
    if (!callSid || !toE164) {
      return res.status(400).json({ error: 'Invalid token payload' });
    }
    
    // Build callback URL for TwiML response
    const callbackUrl = `${BASE_URL}/voice/callback/connect?to=${encodeURIComponent(toE164)}`;
    
    try {
      // Initiate outbound call to business number
      const call = await startOutbound(BUSINESS_TARGET_E164, callbackUrl);
      
      console.log(`Callback initiated for ${callSid}: ${call.sid} → ${toE164}`);
      
      return res.json({
        ok: true,
        started: true,
        callSid: call.sid
      });
      
    } catch (twilioError) {
      console.error('Twilio call failed:', twilioError);
      return res.status(500).json({
        error: 'Failed to initiate callback',
        details: twilioError.message
      });
    }
    
  } catch (error) {
    console.error('Email CTA callback error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}