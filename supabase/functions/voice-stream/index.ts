import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

serve(async (req) => {
  const upgrade = req.headers.get("upgrade") || "";
  
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected websocket connection", { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const url = new URL(req.url);
  const callSid = url.searchParams.get('callSid');
  
  if (!callSid) {
    socket.close(1008, 'Missing callSid');
    return response;
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  if (!OPENAI_API_KEY) {
    socket.close(1011, 'OpenAI API key not configured');
    return response;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get voice config and system prompt
  const { data: config } = await supabase
    .from('voice_config')
    .select('*')
    .single();

  const systemPrompt = config?.system_prompt || 
    `You are TradeLine 24/7, an AI receptionist. Canadian English. Be warm, concise (≤15s per reply). 
     Capture: name, callback number, email, job summary, preferred date/time. Confirm back. 
     Offer to connect to a human on request/urgent. If human unreachable, take a message and promise a callback. 
     Never invent data; read numbers digit-by-digit. On background noise, ask to repeat briefly.`;

  let openaiWs: WebSocket;
  let streamSid: string | null = null;
  let lastActivityTime = Date.now();
  let silenceCheckInterval: number;
  let transcript = '';
  let capturedFields: any = {};

  // Connect to OpenAI Realtime API
  try {
    openaiWs = new WebSocket(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      }
    );

    openaiWs.onopen = () => {
      console.log('✅ Connected to OpenAI Realtime API');
      
      // Configure session
      openaiWs.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: systemPrompt,
          voice: config?.llm_voice || 'alloy',
          input_audio_format: 'g711_ulaw',
          output_audio_format: 'g711_ulaw',
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          temperature: 0.8,
          max_response_output_tokens: 'inf'
        }
      }));
    };

    openaiWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      lastActivityTime = Date.now();

      // Handle different event types
      if (data.type === 'response.audio.delta' && streamSid) {
        // Forward audio to Twilio
        socket.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: {
            payload: data.delta
          }
        }));
      } else if (data.type === 'response.audio_transcript.delta') {
        transcript += data.delta;
      } else if (data.type === 'response.done') {
        // Extract captured fields from response
        if (data.response?.output) {
          try {
            capturedFields = JSON.parse(data.response.output);
          } catch {}
        }
      } else if (data.type === 'error') {
        console.error('OpenAI error:', data.error);
        
        // Fail open: bridge to human
        if (config?.fail_open !== false) {
          socket.send(JSON.stringify({
            event: 'clear',
            streamSid: streamSid
          }));
          
          supabase.from('call_logs')
            .update({ 
              handoff: true, 
              handoff_reason: 'llm_error',
              fail_path: 'fail_open_bridge'
            })
            .eq('call_sid', callSid)
            .then();
        }
      }
    };

    openaiWs.onerror = (error) => {
      console.error('OpenAI WebSocket error:', error);
    };

    openaiWs.onclose = () => {
      console.log('OpenAI WebSocket closed');
      clearInterval(silenceCheckInterval);
    };

  } catch (error) {
    console.error('Failed to connect to OpenAI:', error);
    socket.close(1011, 'OpenAI connection failed');
    return response;
  }

  // PROMPT C: Watchdog - 3s handshake timeout, log evidence
  const handshakeStartTime = Date.now();
  let handshakeCompleted = false;
  
  const handshakeWatchdog = setTimeout(async () => {
    if (!handshakeCompleted) {
      const elapsedMs = Date.now() - handshakeStartTime;
      console.log(`⚠️ Handshake timeout (${elapsedMs}ms), failing over to human`);
      
      // PROMPT C: Record evidence row (unique on call_sid)
      await supabase.from('voice_stream_logs').upsert({
        call_sid: callSid,
        started_at: new Date(handshakeStartTime).toISOString(),
        connected_at: null,
        elapsed_ms: elapsedMs,
        fell_back: true,
        error_message: 'Handshake timeout (>3000ms)'
      }, { onConflict: 'call_sid' });
      
      // Tag call with stream_fallback=true
      await supabase.from('call_logs')
        .update({ 
          handoff: true, 
          handoff_reason: 'handshake_timeout',
          fail_path: 'watchdog_bridge',
          captured_fields: { stream_fallback: true }
        })
        .eq('call_sid', callSid);
      
      openaiWs.close();
      socket.close();
    }
  }, 3000);

  // Silence detection (6s threshold)
  silenceCheckInterval = setInterval(() => {
    const timeSinceActivity = Date.now() - lastActivityTime;
    
    if (timeSinceActivity > 6000 && openaiWs.readyState === WebSocket.OPEN) {
      console.log('⚠️ Silence detected (>6s), sending nudge');
      
      openaiWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: 'Are you still there?'
          }]
        }
      }));
      
      openaiWs.send(JSON.stringify({ type: 'response.create' }));
      
      // If no response after nudge, bridge to human
      setTimeout(() => {
        const timeSinceNudge = Date.now() - lastActivityTime;
        if (timeSinceNudge > 9000) {
          console.log('⚠️ No response after nudge, bridging to human');
          supabase.from('call_logs')
            .update({ 
              handoff: true, 
              handoff_reason: 'silence_timeout',
              fail_path: 'silence_bridge'
            })
            .eq('call_sid', callSid)
            .then();
        }
      }, 3000);
    }
  }, 2000);

  // Handle Twilio Media Stream events
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.event === 'start') {
      streamSid = data.start.streamSid;
      handshakeCompleted = true;
      clearTimeout(handshakeWatchdog);
      
      const handshakeTime = Date.now() - handshakeStartTime;
      console.log(`✅ Media stream started: ${streamSid} (handshake: ${handshakeTime}ms)`);
      
      // PROMPT C: Record successful handshake evidence
      supabase.from('voice_stream_logs').upsert({
        call_sid: callSid,
        started_at: new Date(handshakeStartTime).toISOString(),
        connected_at: new Date().toISOString(),
        elapsed_ms: handshakeTime,
        fell_back: false
      }, { onConflict: 'call_sid' }).then();
      
      // Update call log with session ID and handshake metrics
      supabase.from('call_logs')
        .update({ 
          llm_session_id: streamSid,
          captured_fields: { handshake_ms: handshakeTime, stream_fallback: false }
        })
        .eq('call_sid', callSid)
        .then();
        
    } else if (data.event === 'media' && openaiWs.readyState === WebSocket.OPEN) {
      // Forward audio to OpenAI
      openaiWs.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: data.media.payload
      }));
      
    } else if (data.event === 'stop') {
      console.log('📞 Call ended');
      
      // Save transcript and captured fields
      await supabase.from('call_logs')
        .update({
          transcript: transcript,
          captured_fields: capturedFields,
          ended_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('call_sid', callSid);
      
      // Send transcript email asynchronously
      fetch(`${supabaseUrl}/functions/v1/send-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ callSid })
      }).catch(err => console.error('Failed to trigger transcript email:', err));
      
      openaiWs.close();
      clearInterval(silenceCheckInterval);
    }
  };

  socket.onclose = () => {
    console.log('Twilio stream closed');
    openaiWs?.close();
    clearInterval(silenceCheckInterval);
  };

  socket.onerror = (error) => {
    console.error('Socket error:', error);
  };

  return response;
});