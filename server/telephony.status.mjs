import { createClient } from "@supabase/supabase-js";

const supa = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

export async function telephonyStatusHandler(req, res) {
  console.log("Telephony status callback received:", req.body);
  
  // Twilio sends application/x-www-form-urlencoded; middleware is already set globally.
  const {
    CallSid, CallStatus, From, To, Direction, StartTime, EndTime, CallDuration
  } = req.body || {};

  // Upsert lifecycle (idempotent by CallSid)
  if (supa) {
    try {
      const { error } = await supa.from("call_lifecycle").upsert({
        call_sid: CallSid,
        from_number: From, 
        to_number: To, 
        direction: Direction, 
        status: CallStatus,
        start_time: StartTime ? new Date(StartTime) : null,
        end_time: EndTime ? new Date(EndTime) : null,
        talk_seconds: Number(CallDuration || 0),
        meta: req.body,
        updated_at: new Date()
      }, { onConflict: "call_sid" });
      
      if (error) {
        console.error("Error upserting call lifecycle:", error);
      } else {
        console.log(`Call lifecycle updated for ${CallSid}: ${CallStatus}`);
      }
    } catch (e) {
      console.error("Database error:", e);
    }
  }

  // Outreach trigger: missed/abandoned if no-answer/busy OR completed with low talk time
  const missed = ["no-answer","busy","failed"].includes(String(CallStatus)) ||
                 (String(CallStatus) === "completed" && Number(CallDuration || 0) < 10);

  if (missed && From) {
    console.log(`Missed call detected for ${CallSid}, triggering outreach to ${From}`);
    const dedupeKey = new Date().toISOString().slice(0,13); // hour bucket
    
    try {
      const { sendWhatsAppQuickReply } = await import("./outreach/whatsapp.mjs");
      const { sendSMSFallback } = await import("./outreach/sms.mjs");
      
      const sent = await sendWhatsAppQuickReply({ to: From, callSid: CallSid, dedupeKey });
      if (!sent) {
        console.log("WhatsApp failed, falling back to SMS");
        await sendSMSFallback({ to: From, callSid: CallSid, dedupeKey });
      }
    } catch (e) {
      console.error("Outreach error for CallSid", CallSid, e);
    }
  }

  res.status(200).send("ok");
}