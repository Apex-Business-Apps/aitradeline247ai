/**
 * Dynamic prompt builder that combines business profile + RAG retrieval
 */

export interface BusinessProfile {
  business_name: string;
  industry: string;
  timezone: string;
  service_area: string;
  hours: any;
  booking_rules: any;
  brand_voice: {
    formality: string;
    tone: string;
    tempo: string;
    dont_say: string[];
    do_say: string[];
  };
  faq: any[];
  escalation: any;
  compliance: {
    consent_script_version: string;
  };
}

export interface RAGSnippet {
  content: string;
  source_title?: string;
  score?: number;
}

/**
 * Build system prompt with business profile + RAG context
 */
export function buildSystemPrompt(
  profile: BusinessProfile,
  ragSnippets: RAGSnippet[] = []
): string {
  const basePrompt = `You are the receptionist for ${profile.business_name} (${profile.industry}), answering calls and texts.

GOALS:
- Greet warmly and professionally
- Understand caller intent through active listening
- Book appointments per these rules: ${JSON.stringify(profile.booking_rules)}
- Escalate to human per: ${JSON.stringify(profile.escalation)}

VOICE & STYLE:
- Formality: ${profile.brand_voice.formality}
- Tone: ${profile.brand_voice.tone}
- Speaking tempo: ${profile.brand_voice.tempo}
- NEVER use these phrases: ${profile.brand_voice.dont_say.join(', ')}
- PREFER these phrases: ${profile.brand_voice.do_say.join(', ')}

CRITICAL RULES:
1. Only use information from: (a) this business profile, (b) the retrieved knowledge notes below
2. If unsure about something, ask ONE brief clarifying question
3. If still unclear after clarification, offer to escalate to a human
4. Never fabricate information - it's better to say "let me connect you with someone who can help"
5. Read phone numbers and confirmation codes digit-by-digit, slowly
6. Keep responses under 15 seconds - be concise and natural

RETRIEVED KNOWLEDGE NOTES:
${ragSnippets.length > 0 
  ? ragSnippets.map((s, i) => `[${i+1}] ${s.source_title || 'Document'}: ${s.content}`).join('\n\n')
  : '(No specific knowledge retrieved for this query - use general business profile only)'
}

BUSINESS HOURS:
${JSON.stringify(profile.hours, null, 2)}

FAQ REFERENCE:
${profile.faq.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`;

  return basePrompt;
}

/**
 * Few-shot examples to lock in tone and format
 */
export function getFewShotExamples(profile: BusinessProfile): Array<{role: string, content: string}> {
  const formality = profile.brand_voice.formality.toLowerCase();
  
  if (formality === 'casual' || formality === 'friendly') {
    return [
      {
        role: 'user',
        content: 'Hi, I need to book an appointment'
      },
      {
        role: 'assistant',
        content: `Hey there! I'd be happy to help you book an appointment with ${profile.business_name}. Could you tell me what service you're interested in?`
      },
      {
        role: 'user',
        content: 'What are your prices?'
      },
      {
        role: 'assistant',
        content: 'Great question! Our pricing varies by service. Let me connect you with someone who can give you exact numbers for what you need.'
      }
    ];
  } else {
    // Professional/Formal
    return [
      {
        role: 'user',
        content: 'I need to schedule an appointment'
      },
      {
        role: 'assistant',
        content: `Good morning, thank you for calling ${profile.business_name}. I'll be glad to assist you with scheduling. What service are you interested in?`
      },
      {
        role: 'user',
        content: 'What are your rates?'
      },
      {
        role: 'assistant',
        content: 'Our pricing depends on the specific service you require. I\'d like to connect you with our team who can provide you with accurate pricing details.'
      }
    ];
  }
}
