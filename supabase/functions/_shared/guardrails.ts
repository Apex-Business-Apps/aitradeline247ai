/**
 * Guardrails enforcement - checks keywords and forces escalation
 * These hard rules run OUTSIDE the model to ensure reliability
 */

export interface EscalationRules {
  urgent_keywords: string[];
  transfer_number: string;
  always_escalate_intents?: string[];
  confidence_threshold?: number;
}

export interface GuardrailCheckResult {
  should_escalate: boolean;
  reason?: string;
  escalation_type?: 'urgent' | 'low_confidence' | 'intent_based' | 'explicit_request';
  metadata?: any;
}

/**
 * Check if conversation should be escalated based on hard rules
 */
export function checkGuardrails(
  transcript: string,
  capturedFields: any,
  escalationRules: EscalationRules
): GuardrailCheckResult {
  const lowerTranscript = transcript.toLowerCase();
  
  // 1. Check urgent keywords (emergency, urgent, asap, etc.)
  for (const keyword of escalationRules.urgent_keywords || []) {
    if (lowerTranscript.includes(keyword.toLowerCase())) {
      return {
        should_escalate: true,
        reason: `Urgent keyword detected: "${keyword}"`,
        escalation_type: 'urgent',
        metadata: { keyword }
      };
    }
  }
  
  // 2. Check for explicit transfer requests
  const transferPhrases = [
    'speak to a person',
    'talk to someone',
    'human',
    'real person',
    'actual person',
    'transfer me',
    'connect me'
  ];
  
  for (const phrase of transferPhrases) {
    if (lowerTranscript.includes(phrase)) {
      return {
        should_escalate: true,
        reason: 'Explicit transfer request',
        escalation_type: 'explicit_request',
        metadata: { phrase }
      };
    }
  }
  
  // 3. Check low confidence on multiple fields
  let lowConfidenceCount = 0;
  const confidenceThreshold = escalationRules.confidence_threshold || 0.6;
  
  for (const [field, value] of Object.entries(capturedFields || {})) {
    if (typeof value === 'object' && value !== null && 'confidence' in value) {
      if (value.confidence < confidenceThreshold) {
        lowConfidenceCount++;
      }
    }
  }
  
  if (lowConfidenceCount >= 2) {
    return {
      should_escalate: true,
      reason: `Low confidence on ${lowConfidenceCount} fields`,
      escalation_type: 'low_confidence',
      metadata: { low_confidence_count: lowConfidenceCount }
    };
  }
  
  // 4. Check always-escalate intents
  for (const intent of escalationRules.always_escalate_intents || []) {
    if (lowerTranscript.includes(intent.toLowerCase())) {
      return {
        should_escalate: true,
        reason: `Auto-escalate intent: "${intent}"`,
        escalation_type: 'intent_based',
        metadata: { intent }
      };
    }
  }
  
  return { should_escalate: false };
}

/**
 * Log guardrail trigger for audit
 */
export async function logGuardrailTrigger(
  supabase: any,
  callSid: string,
  result: GuardrailCheckResult
) {
  await supabase.from('call_logs').update({
    handoff: true,
    handoff_reason: `guardrail_${result.escalation_type}`,
    captured_fields: {
      guardrail_triggered: true,
      guardrail_reason: result.reason,
      guardrail_metadata: result.metadata
    }
  }).eq('call_sid', callSid);
}
