import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

interface SummaryRequest {
  content: string;
  org_id: string;
  call_sid?: string;
  content_type: 'call' | 'email' | 'text';
}

interface SummaryResponse {
  subject: string;
  summary: string;
  next_actions: string[];
  tags: string[];
  confidence_score: number;
  model_used: string;
  escalated: boolean;
}

// JSON schema for structured output
const summarySchema = {
  type: "object",
  properties: {
    subject: {
      type: "string",
      description: "A concise subject line or title for the content (max 100 characters)"
    },
    summary: {
      type: "string",
      description: "A comprehensive summary of the main points and context (200-500 words)"
    },
    next_actions: {
      type: "array",
      items: {
        type: "string"
      },
      description: "List of specific actionable next steps (3-7 items max)"
    },
    tags: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Relevant tags for categorization (e.g., 'urgent', 'follow-up', 'technical', 'billing')"
    },
    confidence_score: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confidence level in the summary accuracy (0.0 to 1.0)"
    }
  },
  required: ["subject", "summary", "next_actions", "tags", "confidence_score"]
};

// Calculate confidence heuristics
function calculateConfidence(content: string, summary: any): number {
  let confidence = 0.5; // Base confidence
  
  // Length indicators
  if (content.length > 100) confidence += 0.1;
  if (content.length > 500) confidence += 0.1;
  
  // Structure indicators
  if (summary.next_actions && summary.next_actions.length > 0) confidence += 0.1;
  if (summary.subject && summary.subject.length > 10) confidence += 0.1;
  if (summary.tags && summary.tags.length > 0) confidence += 0.1;
  
  // Quality indicators
  if (summary.summary && summary.summary.length > 50) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

// Generate summary using small model first
async function generateSummary(content: string, contentType: string): Promise<{ summary: any; model: string; rawConfidence: number }> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const systemPrompt = `You are an expert at summarizing ${contentType} content. Create structured summaries that are accurate, actionable, and well-organized. Focus on key information, decisions made, and clear next steps.`;

  const userPrompt = `Please analyze and summarize the following ${contentType} content. Provide a structured response with:
- A clear, concise subject line
- A comprehensive summary of main points
- Specific actionable next steps
- Relevant tags for categorization
- Your confidence level in the summary accuracy

Content to summarize:
${content}`;

  try {
    // Try with small model first
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "summary_response",
            strict: true,
            schema: summarySchema
          }
        },
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    const summaryContent = JSON.parse(data.choices[0].message.content);
    
    return {
      summary: summaryContent,
      model: 'gpt-4o-mini',
      rawConfidence: summaryContent.confidence_score || 0.5
    };

  } catch (error) {
    console.error('Error with small model, trying escalation:', error);
    throw error;
  }
}

// Escalate to larger model if confidence is low
async function escalateSummary(content: string, contentType: string, previousSummary: any): Promise<{ summary: any; model: string; rawConfidence: number }> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const systemPrompt = `You are a senior expert at summarizing ${contentType} content. The previous summary had low confidence. Please provide a more thorough and accurate analysis.`;

  const userPrompt = `The previous summary had low confidence (${previousSummary.confidence_score}). Please provide a better analysis of this ${contentType} content:

Previous summary for reference:
Subject: ${previousSummary.subject}
Summary: ${previousSummary.summary}

Original content to re-analyze:
${content}

Please provide an improved structured response.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "summary_response",
          strict: true,
          schema: summarySchema
        }
      },
      temperature: 0.2,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const data = await response.json();
  const summaryContent = JSON.parse(data.choices[0].message.content);
  
  return {
    summary: summaryContent,
    model: 'gpt-4o',
    rawConfidence: summaryContent.confidence_score || 0.7
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content, org_id, call_sid, content_type = 'text' }: SummaryRequest = await req.json();
    
    if (!content || !org_id) {
      return new Response(JSON.stringify({ error: 'content and org_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Summarizing ${content_type} content for org ${org_id} (${content.length} chars)`);

    // Generate initial summary with small model
    let result = await generateSummary(content, content_type);
    let escalated = false;
    
    // Calculate overall confidence
    const calculatedConfidence = calculateConfidence(content, result.summary);
    const finalConfidence = Math.min(result.rawConfidence, calculatedConfidence);
    
    // Escalate if confidence is below threshold
    const CONFIDENCE_THRESHOLD = 0.6;
    if (finalConfidence < CONFIDENCE_THRESHOLD) {
      console.log(`Low confidence (${finalConfidence}), escalating to larger model`);
      try {
        result = await escalateSummary(content, content_type, result.summary);
        escalated = true;
      } catch (escalationError) {
        console.error('Escalation failed, using original summary:', escalationError);
        // Continue with original summary
      }
    }

    const response: SummaryResponse = {
      subject: result.summary.subject,
      summary: result.summary.summary,
      next_actions: result.summary.next_actions || [],
      tags: result.summary.tags || [],
      confidence_score: finalConfidence,
      model_used: result.model,
      escalated
    };

    // Store the summary in database
    const { error: insertError } = await supabase
      .from('call_summaries')
      .insert({
        org_id,
        call_sid,
        subject: response.subject,
        summary: response.summary,
        next_actions: response.next_actions,
        tags: response.tags,
        confidence_score: response.confidence_score,
        model_used: response.model_used,
        escalated: response.escalated
      });

    if (insertError) {
      console.error('Failed to store summary:', insertError);
    }

    // Log metrics
    const latency = Date.now() - startTime;
    await Promise.all([
      supabase
        .from('operational_metrics')
        .insert({
          org_id,
          metric_name: 'summary_latency_ms',
          metric_value: latency,
          metric_unit: 'milliseconds'
        }),
      supabase
        .from('operational_metrics')
        .insert({
          org_id,
          metric_name: 'summary_confidence_score',
          metric_value: response.confidence_score,
          metric_unit: 'score'
        }),
      supabase
        .from('operational_metrics')
        .insert({
          org_id,
          metric_name: 'summary_escalation_rate',
          metric_value: escalated ? 1 : 0,
          metric_unit: 'boolean'
        })
    ]);

    console.log(`Summary generated in ${latency}ms with confidence ${response.confidence_score}${escalated ? ' (escalated)' : ''}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('Error in summarize function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: latency 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});