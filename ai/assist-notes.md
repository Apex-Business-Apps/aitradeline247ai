# Agent-Assist Media Streams Integration Notes

## Overview
TradeLine 24/7 Agent-Assist via Twilio Media Streams enables real-time call coaching and assistance during live calls.

## Media Streams WebSocket Shape

### Connection URL
```
wss://assist.tradeline247ai.com/stream
```

### Expected Message Format

#### Inbound (Twilio → Assistant)
```json
{
  "event": "media",
  "sequenceNumber": "1",
  "media": {
    "track": "inbound|outbound", 
    "chunk": "base64_encoded_audio",
    "timestamp": "2023-01-01T00:00:00.000Z",
    "payload": "mulaw_audio_data"
  },
  "streamSid": "MZ...",
  "accountSid": "AC...",
  "callSid": "CA..."
}
```

#### Outbound (Assistant → Agent Interface)
```json
{
  "type": "suggestion",
  "content": "Customer mentioned pricing - suggest our Enterprise plan",
  "confidence": 0.85,
  "timestamp": "2023-01-01T00:00:00.000Z",
  "callSid": "CA...",
  "priority": "high|medium|low"
}
```

## TwiML Integration

### Adding Media Stream to Voice Flow
```xml
<Response>
  <Say>Connecting you now with agent assistance.</Say>
  <Connect>
    <Stream url="wss://assist.tradeline247ai.com/stream" />
  </Connect>
</Response>
```

### Implementation Notes

1. **Audio Format**: Twilio Media Streams use μ-law (8kHz, 8-bit) encoding
2. **Latency**: Target sub-500ms for real-time suggestions
3. **Security**: Use WSS with proper authentication headers
4. **Fallback**: Graceful degradation if assist service unavailable

## Suggested Implementation

1. **Speech-to-Text**: Convert audio chunks to text transcripts
2. **Intent Recognition**: Analyze customer intent and sentiment
3. **Knowledge Base**: Query relevant responses from TL247 knowledge base
4. **Agent Coaching**: Provide real-time suggestions to improve call outcomes

## Environment Variables

```bash
ASSIST_WS=wss://assist.tradeline247ai.com/stream
ASSIST_API_KEY=your_assist_service_key
```

## Security Considerations

- Validate WebSocket origin and authentication
- Encrypt sensitive customer data in transit
- Implement rate limiting to prevent abuse
- Audit all assist interactions for compliance

## Future Enhancements

- Real-time sentiment analysis
- Automated call transcription and summarization  
- Integration with CRM for customer context
- A/B testing of different coaching strategies