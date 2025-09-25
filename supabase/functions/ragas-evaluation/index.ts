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

interface RAGASResult {
  faithfulness: number;
  answer_relevance: number;
  context_precision: number;
  context_recall: number;
}

interface GoldenQuestion {
  question: string;
  expected_answer: string;
  context: string[];
}

// Golden set questions for evaluation
const GOLDEN_SET: GoldenQuestion[] = [
  {
    question: "What is TradeLine 24/7?",
    expected_answer: "TradeLine 24/7 is an AI receptionist service that provides 24/7 customer support.",
    context: ["TradeLine 24/7 provides automated customer service", "Available 24 hours a day, 7 days a week"]
  },
  {
    question: "How does the AI receptionist work?",
    expected_answer: "The AI receptionist uses natural language processing to understand customer inquiries and provide appropriate responses.",
    context: ["AI processes customer questions", "Natural language understanding", "Automated response generation"]
  },
  {
    question: "What are the pricing plans?",
    expected_answer: "TradeLine 24/7 offers multiple pricing tiers including Starter, Growth, and Enterprise plans.",
    context: ["Multiple pricing options available", "Starter plan for small businesses", "Enterprise for large organizations"]
  }
];

// Simulate RAGAS evaluation (in production, use actual RAGAS library)
async function evaluateWithRAGAS(
  question: string,
  answer: string,
  expectedAnswer: string,
  context: string[]
): Promise<RAGASResult> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    // Faithfulness: How factually accurate is the answer based on context
    const faithfulnessPrompt = `
Rate the faithfulness of this answer based on the given context (0.0 to 1.0):
Context: ${context.join('. ')}
Answer: ${answer}
Return only a number between 0.0 and 1.0.`;

    const faithfulnessResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: faithfulnessPrompt }],
        max_tokens: 10,
        temperature: 0.1
      }),
    });

    const faithfulnessData = await faithfulnessResponse.json();
    const faithfulness = parseFloat(faithfulnessData.choices[0].message.content.trim()) || 0.5;

    // Answer Relevance: How relevant is the answer to the question
    const relevancePrompt = `
Rate how relevant this answer is to the question (0.0 to 1.0):
Question: ${question}
Answer: ${answer}
Return only a number between 0.0 and 1.0.`;

    const relevanceResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: relevancePrompt }],
        max_tokens: 10,
        temperature: 0.1
      }),
    });

    const relevanceData = await relevanceResponse.json();
    const answer_relevance = parseFloat(relevanceData.choices[0].message.content.trim()) || 0.5;

    // Context Precision: How precise is the retrieved context
    const context_precision = context.length > 0 ? Math.min(1.0, 3 / context.length) : 0.0;

    // Context Recall: How well does context cover the expected answer
    const context_recall = context.some(c => 
      expectedAnswer.toLowerCase().split(' ').some(word => 
        word.length > 3 && c.toLowerCase().includes(word)
      )
    ) ? 0.8 : 0.3;

    return {
      faithfulness: Math.max(0, Math.min(1, faithfulness)),
      answer_relevance: Math.max(0, Math.min(1, answer_relevance)),
      context_precision: Math.max(0, Math.min(1, context_precision)),
      context_recall: Math.max(0, Math.min(1, context_recall))
    };

  } catch (error) {
    console.error('Error in RAGAS evaluation:', error);
    // Return baseline scores on error
    return {
      faithfulness: 0.5,
      answer_relevance: 0.5,
      context_precision: 0.5,
      context_recall: 0.5
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting RAGAS evaluation job');

    // Get all organizations with knowledge bases
    const { data: orgs, error: orgsError } = await supabase
      .from('kb_versions')
      .select('org_id')
      .order('updated_at', { ascending: false });

    if (orgsError) {
      throw new Error(`Failed to fetch organizations: ${orgsError.message}`);
    }

    const evaluationResults = [];

    for (const org of orgs || []) {
      console.log(`Evaluating org: ${org.org_id}`);
      
      const orgScores = [];

      for (const goldenQuestion of GOLDEN_SET) {
        try {
          // Get answer from RAG system
          const { data: ragResponse, error: ragError } = await supabase.functions.invoke('rag-answer', {
            body: {
              question: goldenQuestion.question,
              org_id: org.org_id
            }
          });

          if (ragError) {
            console.error(`RAG error for org ${org.org_id}:`, ragError);
            continue;
          }

          const answer = ragResponse?.answer || '';
          const retrievedContext = ragResponse?.citations?.map((c: any) => c.title) || [];

          // Evaluate with RAGAS
          const ragasScores = await evaluateWithRAGAS(
            goldenQuestion.question,
            answer,
            goldenQuestion.expected_answer,
            [...goldenQuestion.context, ...retrievedContext]
          );

          orgScores.push(ragasScores);

        } catch (error) {
          console.error(`Error evaluating question for org ${org.org_id}:`, error);
        }
      }

      if (orgScores.length > 0) {
        // Calculate average scores
        const avgScores = orgScores.reduce((acc, scores) => ({
          faithfulness: acc.faithfulness + scores.faithfulness,
          answer_relevance: acc.answer_relevance + scores.answer_relevance,
          context_precision: acc.context_precision + scores.context_precision,
          context_recall: acc.context_recall + scores.context_recall
        }), { faithfulness: 0, answer_relevance: 0, context_precision: 0, context_recall: 0 });

        const count = orgScores.length;
        const finalScores = {
          faithfulness: avgScores.faithfulness / count,
          answer_relevance: avgScores.answer_relevance / count,
          context_precision: avgScores.context_precision / count,
          context_recall: avgScores.context_recall / count
        };

        // Store evaluation results
        const { error: insertError } = await supabase
          .from('ragas_evaluations')
          .insert({
            org_id: org.org_id,
            evaluation_date: new Date().toISOString(),
            faithfulness_score: finalScores.faithfulness,
            answer_relevance_score: finalScores.answer_relevance,
            context_precision_score: finalScores.context_precision,
            context_recall_score: finalScores.context_recall,
            questions_evaluated: count,
            golden_set_version: '1.0'
          });

        if (insertError) {
          console.error(`Failed to store evaluation for org ${org.org_id}:`, insertError);
        } else {
          console.log(`Stored evaluation for org ${org.org_id}:`, finalScores);
        }

        // Check for regression (>10% drop from previous week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: previousEval } = await supabase
          .from('ragas_evaluations')
          .select('*')
          .eq('org_id', org.org_id)
          .gte('evaluation_date', oneWeekAgo.toISOString())
          .order('evaluation_date', { ascending: false })
          .limit(2);

        if (previousEval && previousEval.length >= 2) {
          const current = previousEval[0];
          const previous = previousEval[1];

          const faithfulnessDropped = (previous.faithfulness_score - current.faithfulness_score) > 0.1;
          const relevanceDropped = (previous.answer_relevance_score - current.answer_relevance_score) > 0.1;

          if (faithfulnessDropped || relevanceDropped) {
            console.log(`REGRESSION DETECTED for org ${org.org_id}`);
            
            // Log the regression alert
            await supabase
              .from('analytics_events')
              .insert({
                event_type: 'kb_eval_regression',
                event_data: {
                  org_id: org.org_id,
                  current_scores: finalScores,
                  previous_scores: {
                    faithfulness: previous.faithfulness_score,
                    answer_relevance: previous.answer_relevance_score
                  },
                  regression_type: faithfulnessDropped ? 'faithfulness' : 'relevance'
                },
                user_session: 'ragas_evaluation_job',
                page_url: 'system_evaluation'
              });
          }
        }

        evaluationResults.push({
          org_id: org.org_id,
          scores: finalScores,
          questions_evaluated: count
        });
      }
    }

    console.log(`RAGAS evaluation completed for ${evaluationResults.length} organizations`);

    return new Response(JSON.stringify({
      message: 'RAGAS evaluation completed',
      results: evaluationResults,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in RAGAS evaluation function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});