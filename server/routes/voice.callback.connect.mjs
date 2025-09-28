/**
 * Handle Twilio voice callback connection
 * GET/POST /voice/callback/connect?to=<e164>
 */
export function voiceCallbackConnectHandler(req, res) {
  try {
    const { to: toNumber } = req.query;
    
    if (!toNumber) {
      console.error('Missing "to" parameter in voice callback');
      
      // Return error TwiML
      const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error connecting your call.</Say>
  <Hangup/>
</Response>`;
      
      return res.type('text/xml').send(errorTwiML);
    }
    
    console.log(`Connecting call to: ${toNumber}`);
    
    // Generate TwiML to connect the call
    const twiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to the caller now.</Say>
  <Dial answerOnBridge="true">
    <Number>${toNumber}</Number>
  </Dial>
</Response>`;
    
    return res.type('text/xml').send(twiML);
    
  } catch (error) {
    console.error('Voice callback connect error:', error);
    
    // Return fallback TwiML
    const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Unable to connect the call at this time. Please try again later.</Say>
  <Hangup/>
</Response>`;
    
    return res.type('text/xml').send(fallbackTwiML);
  }
}