import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Play, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const TEST_SCENARIOS = [
  {
    id: 'lead_intake',
    title: 'Lead Intake - New Customer',
    script: 'Hi, I saw your ad online and I need help with my business phone system. Can you tell me about your services?',
    expected_behavior: ['Greet warmly', 'Ask qualifying questions', 'Capture contact info', 'Book demo or callback']
  },
  {
    id: 'pricing_question',
    title: 'Pricing Inquiry',
    script: 'How much does your service cost per month?',
    expected_behavior: ['Provide pricing overview', 'Ask about business size', 'Offer to schedule detailed quote call']
  },
  {
    id: 'warranty_question',
    title: 'Warranty/Policy Question',
    script: 'What is your refund policy if I am not satisfied?',
    expected_behavior: ['Reference KB policy', 'Explain terms clearly', 'Offer to email detailed policy']
  },
  {
    id: 'scheduling',
    title: 'Appointment Booking',
    script: 'I would like to book a consultation for next Tuesday at 2pm',
    expected_behavior: ['Confirm availability', 'Capture details', 'Read back confirmation', 'Send confirmation']
  },
  {
    id: 'upset_caller',
    title: 'Upset Customer',
    script: 'This is ridiculous! Your system went down and I lost business! I want to speak to a manager right now!',
    expected_behavior: ['Acknowledge emotion', 'Apologize', 'Escalate immediately', 'Do not argue']
  },
  {
    id: 'after_hours',
    title: 'After Hours Call',
    script: 'Hi, are you still open? I need help urgently.',
    expected_behavior: ['State current hours', 'Offer callback', 'Capture emergency contact', 'Set expectations']
  },
  {
    id: 'emergency',
    title: 'Emergency Keyword',
    script: 'This is an emergency! Our entire phone system is down and we cannot receive calls!',
    expected_behavior: ['Immediate escalation', 'No delay', 'Acknowledge urgency']
  },
  {
    id: 'vague_inquiry',
    title: 'Vague Question',
    script: 'So... what do you guys do exactly?',
    expected_behavior: ['Ask clarifying question', 'Provide concise overview', 'Identify need']
  },
  {
    id: 'competitor_mention',
    title: 'Competitor Comparison',
    script: 'I am currently using RingCentral. Why should I switch to you?',
    expected_behavior: ['Focus on value prop', 'No negative competitor talk', 'Ask about pain points']
  },
  {
    id: 'technical_detail',
    title: 'Technical Deep-Dive',
    script: 'Does your system support SIP trunking and E911 compliance?',
    expected_behavior: ['Use KB if available', 'Escalate to technical team if uncertain', 'No fabrication']
  }
];

const RUBRIC_CRITERIA = [
  { key: 'correct_info', label: 'Correct Information', weight: 0.3 },
  { key: 'tone_adherence', label: 'Tone Adherence', weight: 0.2 },
  { key: 'escalation_correct', label: 'Escalation Correct', weight: 0.2 },
  { key: 'brevity', label: 'Brevity (≤15s)', weight: 0.15 },
  { key: 'next_step_clarity', label: 'Next Step Clarity', weight: 0.15 }
];

export default function VoiceDryRun() {
  const [running, setRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const runTest = async (scenario: any) => {
    try {
      // Call chat endpoint with test scenario
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            { role: 'user', content: scenario.script }
          ]
        }
      });

      if (error) throw error;

      // Parse streamed response
      let fullResponse = '';
      const reader = data.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch {}
          }
        }
      }

      return {
        scenario: scenario.id,
        title: scenario.title,
        input: scenario.script,
        output: fullResponse,
        expected: scenario.expected_behavior,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Test error:', error);
      return {
        scenario: scenario.id,
        title: scenario.title,
        error: error.message
      };
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    setResults([]);
    
    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      setCurrentScenario(i);
      const result = await runTest(TEST_SCENARIOS[i]);
      setResults(prev => [...prev, result]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setRunning(false);
    toast({
      title: "Dry Run Complete",
      description: `Tested ${TEST_SCENARIOS.length} scenarios`
    });
  };

  const calculateScore = (result: any) => {
    if (result.error) return 0;
    
    // Simple scoring based on presence and length
    let score = 0;
    
    // Has response
    if (result.output?.length > 0) score += 20;
    
    // Not too long (≤300 chars ~= 15s at normal pace)
    if (result.output?.length <= 300) score += 20;
    
    // Expected behaviors mentioned
    const outputLower = result.output?.toLowerCase() || '';
    const matchedBehaviors = result.expected.filter((b: string) => 
      outputLower.includes(b.toLowerCase().split(' ')[0])
    );
    score += (matchedBehaviors.length / result.expected.length) * 60;
    
    return Math.round(score);
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice AI Dry Run</h1>
          <p className="text-muted-foreground mt-2">
            Test 10 scripted scenarios with rubric scoring
          </p>
        </div>
        
        <Button 
          onClick={runAllTests} 
          disabled={running}
          size="lg"
          className="gap-2"
        >
          <Play className="w-5 h-5" />
          {running ? "Running Tests..." : "Run All Tests"}
        </Button>
      </div>

      {running && (
        <Card>
          <CardHeader>
            <CardTitle>Testing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scenario {currentScenario + 1} of {TEST_SCENARIOS.length}</span>
                <span>{Math.round((currentScenario / TEST_SCENARIOS.length) * 100)}%</span>
              </div>
              <Progress value={(currentScenario / TEST_SCENARIOS.length) * 100} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {results.map((result, idx) => {
          const score = calculateScore(result);
          const scenario = TEST_SCENARIOS.find(s => s.id === result.scenario);
          
          return (
            <Card key={idx} className={result.error ? "border-destructive" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {score >= 80 ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                       score >= 60 ? <AlertTriangle className="w-5 h-5 text-yellow-600" /> :
                       <XCircle className="w-5 h-5 text-red-600" />}
                      {result.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {scenario?.script}
                    </CardDescription>
                  </div>
                  <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}>
                    Score: {score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.error ? (
                  <div className="text-sm text-destructive">
                    Error: {result.error}
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-1">AI Response:</p>
                      <div className="text-sm bg-muted p-3 rounded-md">
                        {result.output}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Expected Behaviors:</p>
                      <ul className="text-sm space-y-1">
                        {result.expected.map((behavior: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            {behavior}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-5 gap-2 pt-2 border-t">
                      {RUBRIC_CRITERIA.map(criterion => (
                        <div key={criterion.key} className="text-center">
                          <p className="text-xs text-muted-foreground">{criterion.label}</p>
                          <p className="text-sm font-medium">
                            {Math.round((score / 100) * (criterion.weight * 100))}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {results.length > 0 && !running && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">
                  {Math.round(results.reduce((acc, r) => acc + calculateScore(r), 0) / results.length)}/100
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passing (≥80)</p>
                <p className="text-2xl font-bold">
                  {results.filter(r => calculateScore(r) >= 80).length}/{results.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed ({"<"}60)</p>
                <p className="text-2xl font-bold text-destructive">
                  {results.filter(r => calculateScore(r) < 60).length}/{results.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
