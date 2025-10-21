import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Phone, MessageSquare, Loader2, AlertCircle, ExternalLink, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function TwilioWire() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [environment, setEnvironment] = useState<'staging' | 'production'>('staging');
  const { toast } = useToast();

  const stagingUrl = 'https://hysvqdwmhxnblxfqnszn.supabase.co';
  const productionUrl = 'https://hysvqdwmhxnblxfqnszn.supabase.co';

  const getWebhookUrls = (env: 'staging' | 'production') => ({
    voice_answer: `${env === 'staging' ? stagingUrl : productionUrl}/functions/v1/voice-answer`,
    voice_status: `${env === 'staging' ? stagingUrl : productionUrl}/functions/v1/voice-status`,
    sms_inbound: `${env === 'staging' ? stagingUrl : productionUrl}/functions/v1/sms-inbound`,
  });

  const WEBHOOK_URLS = getWebhookUrls(environment);

  const loadNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ops-twilio-list-numbers');
      if (error) throw error;
      setNumbers(data?.numbers || []);
    } catch (error: any) {
      toast({
        title: "Failed to load numbers",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNumbers();
  }, [loadNumbers]);

  const applyWebhooks = async () => {
    if (!selectedNumber) {
      toast({
        title: "No number selected",
        description: "Please select a phone number first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('ops-twilio-configure-webhooks', {
        body: {
          phoneNumber: selectedNumber,
          voiceUrl: WEBHOOK_URLS.voice_answer,
          voiceStatusCallback: WEBHOOK_URLS.voice_status,
          smsUrl: WEBHOOK_URLS.sms_inbound
        }
      });

      if (error) throw error;

      toast({
        title: "Webhooks Applied",
        description: `Successfully configured webhooks for ${selectedNumber}`
      });

      await loadNumbers();
    } catch (error: any) {
      toast({
        title: "Failed to apply webhooks",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (type: 'voice' | 'sms') => {
    setTesting(true);
    try {
      const url = type === 'voice' ? WEBHOOK_URLS.voice_answer : WEBHOOK_URLS.sms_inbound;
      
      const { error } = await supabase.functions.invoke('ops-twilio-test-webhook', {
        body: { url, type }
      });

      if (error) throw error;

      setTestResults({ ...testResults, [type]: 'success' });
      
      toast({
        title: "Test Successful",
        description: `${type === 'voice' ? 'Voice' : 'SMS'} webhook returned 200 OK`
      });
    } catch (error: any) {
      setTestResults({ ...testResults, [type]: 'error' });
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard"
    });
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Twilio Wiring</h1>
          <p className="text-muted-foreground mt-2">
            Configure webhook URLs for staging and production
          </p>
        </div>
        <Tabs value={environment} onValueChange={(v) => setEnvironment(v as any)}>
          <TabsList>
            <TabsTrigger value="staging">Staging</TabsTrigger>
            <TabsTrigger value="production">
              <Rocket className="w-4 h-4 mr-2" />
              Production
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {environment === 'production' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Production Environment:</strong> You are configuring production webhooks. 
            Make sure staging tests pass before wiring production.
          </AlertDescription>
        </Alert>
      )}

      {/* Webhook URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>
            These are your staging webhook URLs. They will be applied to the selected number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(WEBHOOK_URLS).map(([key, url]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {key.includes('voice') ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  <span className="font-medium capitalize">
                    {key.replace('_', ' ')}
                  </span>
                </div>
                <code className="text-xs text-muted-foreground break-all">{url}</code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(url)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Number Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Phone Number</CardTitle>
          <CardDescription>
            Choose which Twilio number to configure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && !numbers.length ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                {numbers.map((number) => (
                  <button
                    key={number.phoneNumber}
                    onClick={() => setSelectedNumber(number.phoneNumber)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      selectedNumber === number.phoneNumber
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono font-medium">{number.phoneNumber}</div>
                        {number.friendlyName && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {number.friendlyName}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {number.voiceUrl === WEBHOOK_URLS.voice_answer && (
                          <Badge variant="outline" className="gap-1">
                            <Check className="w-3 h-3" />
                            Configured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {!numbers.length && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No Twilio numbers found. Make sure you have numbers provisioned in your Twilio account.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <div className="flex gap-2">
            <Button
              onClick={loadNumbers}
              variant="outline"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Refresh Numbers
            </Button>
            <Button
              onClick={applyWebhooks}
              disabled={!selectedNumber || loading}
            >
              Apply Webhooks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Test Webhooks</CardTitle>
          <CardDescription>
            Send test requests to verify your webhooks are responding correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Button
                onClick={() => testWebhook('voice')}
                disabled={testing}
                variant="outline"
                className="w-full justify-start"
              >
                <Phone className="w-4 h-4 mr-2" />
                Test Voice Webhook
                {testResults.voice === 'success' && (
                  <Check className="w-4 h-4 ml-auto text-green-600" />
                )}
                {testResults.voice === 'error' && (
                  <AlertCircle className="w-4 h-4 ml-auto text-red-600" />
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => testWebhook('sms')}
                disabled={testing}
                variant="outline"
                className="w-full justify-start"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Test SMS Webhook
                {testResults.sms === 'success' && (
                  <Check className="w-4 h-4 ml-auto text-green-600" />
                )}
                {testResults.sms === 'error' && (
                  <AlertCircle className="w-4 h-4 ml-auto text-red-600" />
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription className="flex items-center gap-2">
              Tests expect 200 OK responses. Check Edge Function logs for details.
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 ml-auto"
                asChild
              >
                <a
                  href="https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn/functions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Logs
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Current Configuration */}
      {selectedNumber && numbers.find(n => n.phoneNumber === selectedNumber) && (
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {(() => {
                const num = numbers.find(n => n.phoneNumber === selectedNumber);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Phone Number:</span>
                      <span className="font-mono">{num.phoneNumber}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Voice URL:</span>
                      <span className="font-mono text-xs truncate">{num.voiceUrl || 'Not set'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">SMS URL:</span>
                      <span className="font-mono text-xs truncate">{num.smsUrl || 'Not set'}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
