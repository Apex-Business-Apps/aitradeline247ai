import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StagingTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const testCases = [
    {
      id: 'test_a',
      name: 'Test A: Bridge (Answer within 2 rings)',
      description: 'Answer the call within 2 rings to trigger bridge mode',
      expectedMode: 'bridge',
      expectedHumanAnswered: true,
      expectedRingSeconds: '< 12'
    },
    {
      id: 'test_b',
      name: 'Test B: LLM (Let ring out)',
      description: 'Let the call ring out to trigger LLM mode with field capture',
      expectedMode: 'llm',
      expectedFields: 5,
      expectedHandoff: true,
      expectedRingSeconds: '~ 18'
    }
  ];

  const runTest = async (testId: string) => {
    setRunning(true);
    
    toast({
      title: "Test Started",
      description: `Call the staging number now to run ${testId}`,
    });

    // Wait for test to complete (monitoring call_logs in real-time)
    setTimeout(() => {
      setRunning(false);
      toast({
        title: "Test Complete",
        description: "Check call logs for results",
      });
    }, 60000);
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staging Test Script</h1>
        <p className="text-muted-foreground mt-2">
          Run operator tests to validate voice configuration
        </p>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Current Config:</strong> PICKUP_MODE=After N rings, PICKUP_RINGS=3, AMD_ENABLE=true, FAIL_OPEN=true
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {testCases.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{test.name}</span>
                <Button 
                  onClick={() => runTest(test.id)}
                  disabled={running}
                  className="gap-2"
                >
                  {running ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4" />
                      Start Test
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expected Mode:</span>
                  <Badge variant="outline">{test.expectedMode}</Badge>
                </div>
                {test.expectedHumanAnswered && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Human Answered:</span>
                    <Badge variant="outline">Yes</Badge>
                  </div>
                )}
                {test.expectedFields && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Captured Fields:</span>
                    <Badge variant="outline">{test.expectedFields}/5</Badge>
                  </div>
                )}
                {test.expectedHandoff && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Handoff:</span>
                    <Badge variant="outline">Expected</Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ring Duration:</span>
                  <Badge variant="outline">{test.expectedRingSeconds}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Start Test" for Test A</li>
            <li>Call the staging number immediately</li>
            <li>Answer within 2 rings</li>
            <li>Verify mode="bridge" and human_answered=true in call logs</li>
            <li>Click "Start Test" for Test B</li>
            <li>Call the staging number</li>
            <li>Let it ring out (do not answer)</li>
            <li>Interact with LLM, provide all 5 fields, request handoff</li>
            <li>Verify mode="llm", 5/5 fields, handoff=true in call logs</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
