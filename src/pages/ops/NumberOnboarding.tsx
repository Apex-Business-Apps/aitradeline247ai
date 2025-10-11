import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type OnboardingTrack = "quick-start" | "hosted-sms";

export default function NumberOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [track, setTrack] = useState<OnboardingTrack>("quick-start");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [evidence, setEvidence] = useState<Record<string, any>>({});
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();
      
      if (data) setOrganizationId(data.org_id);
    };
    fetchOrgId();
  }, []);

  const handleQuickStart = async (data: any) => {
    if (!organizationId) {
      toast({
        title: "Error",
        description: "Organization ID not found",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ops-twilio-buy-number', {
        body: { 
          organizationId,
          areaCode: data.areaCode, 
          country: data.country || 'CA'
        }
      });

      if (error) throw error;

      setEvidence({
        phoneSid: result.phoneSid,
        number: result.number,
        webhooksConfigured: result.webhooksConfigured,
        voiceUrl: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-answer`,
        smsUrl: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/webcomms-sms-reply`,
        statusCallback: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/voice-status`,
        smsStatusCallback: `https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/webcomms-sms-status`,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Number Purchased",
        description: `Successfully configured ${result.number}`,
      });

      setStep(2);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to purchase number",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHostedSMS = async (data: any) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ops-twilio-hosted-sms', {
        body: { 
          phoneNumber: data.phoneNumber,
          loaDocument: data.loaDocument 
        }
      });

      if (error) throw error;

      setEvidence({
        ...evidence,
        loaSubmissionId: result.submissionId,
        phoneNumber: data.phoneNumber,
        status: result.status,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Hosted SMS Submitted",
        description: "LOA submitted for approval",
      });

      setStep(step + 1);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit hosted SMS request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Client Number Onboarding</h1>
          <p className="text-muted-foreground">Configure Twilio numbers for your clients</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Onboarding Track</CardTitle>
            <CardDescription>Choose the appropriate method for your client</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={track} onValueChange={(v) => setTrack(v as OnboardingTrack)}>
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="quick-start" id="quick-start" />
                <Label htmlFor="quick-start" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">Quick Start</div>
                      <div className="text-sm text-muted-foreground">
                        Buy new local DID → Configure webhooks → Messaging service
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="hosted-sms" id="hosted-sms" />
                <Label htmlFor="hosted-sms" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">Hosted SMS (US/CA)</div>
                      <div className="text-sm text-muted-foreground">
                        Host SMS on existing number (voice stays with current carrier)
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

            </RadioGroup>
          </CardContent>
        </Card>

        <Tabs value={track}>
          <TabsContent value="quick-start">
            <QuickStartWizard 
              step={step} 
              onSubmit={handleQuickStart} 
              loading={loading}
              evidence={evidence}
            />
          </TabsContent>
          
          <TabsContent value="hosted-sms">
            <HostedSMSWizard 
              step={step} 
              onSubmit={handleHostedSMS} 
              loading={loading}
              evidence={evidence}
            />
          </TabsContent>
          
        </Tabs>

        {Object.keys(evidence).length > 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">Evidence Captured:</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(evidence, null, 2)}
                </pre>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

function QuickStartWizard({ step, onSubmit, loading, evidence }: any) {
  const [formData, setFormData] = useState({ areaCode: '', country: 'US' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Start - Buy New Number</CardTitle>
        <CardDescription>Step {step} of 3</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="areaCode">Area Code (Optional)</Label>
              <Input
                id="areaCode"
                placeholder="587"
                value={formData.areaCode}
                onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Leave empty for any available number</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <Button onClick={() => onSubmit(formData)} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Searching & Purchasing..." : "Purchase Number"}
            </Button>
          </>
        )}
        {step === 2 && evidence && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-semibold mb-2">Number Provisioned Successfully!</div>
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Route Card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold">Number (E.164):</div>
                  <div className="font-mono">{evidence.number}</div>
                  
                  <div className="font-semibold">Phone SID:</div>
                  <div className="font-mono text-xs break-all">{evidence.phoneSid}</div>
                  
                  <div className="font-semibold">Voice URL:</div>
                  <div className="font-mono text-xs break-all">{evidence.voiceUrl}</div>
                  
                  <div className="font-semibold">SMS URL:</div>
                  <div className="font-mono text-xs break-all">{evidence.smsUrl}</div>
                  
                  <div className="font-semibold">Status Callback:</div>
                  <div className="font-mono text-xs break-all">{evidence.statusCallback}</div>
                  
                  <div className="font-semibold">SMS Status Callback:</div>
                  <div className="font-mono text-xs break-all">{evidence.smsStatusCallback}</div>
                  
                  <div className="font-semibold">Webhooks:</div>
                  <div className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HostedSMSWizard({ step, onSubmit, loading, evidence }: any) {
  const [formData, setFormData] = useState({ phoneNumber: '', loaDocument: null });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hosted SMS - Configure Existing Number</CardTitle>
        <CardDescription>Step {step} of 3</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (E.164)</Label>
              <Input
                id="phoneNumber"
                placeholder="+15878839797"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loa">LOA Document</Label>
              <Input
                id="loa"
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData({ ...formData, loaDocument: e.target.files?.[0] || null })}
              />
            </div>
            <Button onClick={() => onSubmit(formData)} disabled={loading || !formData.loaDocument}>
              {loading ? "Submitting..." : "Submit LOA"}
            </Button>
          </>
        )}
        {step === 2 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              LOA submitted for approval. Tracking ID: {evidence.loaSubmissionId}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

