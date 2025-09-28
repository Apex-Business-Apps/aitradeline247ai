import { maySendInitial, createSessionFromCall, chooseChannel, sendInitial } from '../lib/outreach.mjs';

export async function patchVoiceStatusForOutreach(req, res, next) {
  console.log("Voice status callback received:", req.body);
  
  const {
    CallSid, CallStatus, From, To, Direction, StartTime, EndTime, CallDuration
  } = req.body || {};

  // Check if this is a missed/abandoned call
  const missed = ["no-answer", "busy", "failed"].includes(String(CallStatus)) ||
                 (String(CallStatus) === "completed" && Number(CallDuration || 0) < 45);

  if (missed && From && Direction === 'inbound') {
    const callerE164 = From.replace(/^\+/, '');
    
    try {
      // Check if we should send initial outreach
      const mayProceed = await maySendInitial(callerE164);
      
      if (mayProceed) {
        console.log(`Missed call detected for ${CallSid}, triggering outreach to ${callerE164}`);
        
        // Create session from call
        const session = await createSessionFromCall({
          callSid: CallSid,
          e164: callerE164,
          meta: {
            call_status: CallStatus,
            call_duration: CallDuration,
            direction: Direction,
            to_number: To
          }
        });

        // Send initial outreach
        await sendInitial(session);
        console.log(`Initial outreach sent for session ${session.id}`);
      } else {
        console.log(`Skipping outreach for ${callerE164} - recent session exists`);
      }
    } catch (error) {
      console.error(`Outreach error for CallSid ${CallSid}:`, error);
    }
  }

  // Continue to next middleware/handler
  next();
}

// Export the route setup function
export function setupVoiceStatusPatch(app, existingHandler) {
  // Add our patch before the existing handler
  app.post('/voice/status', patchVoiceStatusForOutreach, existingHandler);
}