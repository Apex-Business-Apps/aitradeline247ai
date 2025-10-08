import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, FileText, Upload, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type OnboardingTrack = "quick-start" | "hosted-sms" | "full-port";

export default function NumberOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [track, setTrack] = useState<OnboardingTrack>("quick-start");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [evidence, setEvidence] = useState<Record<string, any>>({});

  const handleQuickStart = async (data: any) => {
    setLoading(true);
    try {
      // Call edge function to buy number and configure
      const { data: result, error } = await supabase.functions.invoke('ops-twilio-buy-number', {
        body: { areaCode: data.areaCode, country: data.country }
      });

      if (error) throw error;

      setEvidence({
        ...evidence,
        phoneSid: result.phoneSid,
        number: result.number,
        webhooksConfigured: true,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Number Purchased",
        description: `Successfully configured ${result.number}`,
      });

      setStep(step + 1);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to purchase number",
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

  const handleFullPort = async (data: any) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ops-twilio-create-port', {
        body: { 
          phoneNumber: data.phoneNumber,
          loaDocument: data.loaDocument,
          billDocument: data.billDocument
        }
      });

      if (error) throw error;

      setEvidence({
        ...evidence,
        portOrderId: result.portOrderId,
        phoneNumber: data.phoneNumber,
        focDate: result.focDate,
        tempDid: result.tempDid,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Port Order Created",
        description: `Temporary number: ${result.tempDid}`,
      });

      setStep(step + 1);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create port order",
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

              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="full-port" id="full-port" />
                <Label htmlFor="full-port" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">Full Port</div>
                      <div className="text-sm text-muted-foreground">
                        Port number completely (LOA + bill required)
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
          
          <TabsContent value="full-port">
            <FullPortWizard 
              step={step} 
              onSubmit={handleFullPort} 
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
              <Label htmlFor="areaCode">Area Code</Label>
              <Input
                id="areaCode"
                placeholder="587"
                value={formData.areaCode}
                onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
              />
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
              {loading ? "Purchasing..." : "Purchase Number"}
            </Button>
          </>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Number configured successfully! Webhooks and messaging service are ready.
              </AlertDescription>
            </Alert>
            <Button onClick={() => window.open('/ops/numbers', '_blank')}>
              View Configuration
            </Button>
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

function FullPortWizard({ step, onSubmit, loading, evidence }: any) {
  const [formData, setFormData] = useState({ phoneNumber: '', loaDocument: null, billDocument: null });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Full Port - Port Existing Number</CardTitle>
        <CardDescription>Step {step} of 4</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <Alert>
              <AlertDescription>
                <div className="font-semibold mb-2">Porting Requirements:</div>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Letter of Authorization (LOA) with exact name/address</li>
                  <li>Recent bill (within 30 days)</li>
                  <li>Account holder authorization</li>
                  <li>FOC (Firm Order Commitment) date coordination</li>
                </ul>
                <div className="mt-2 text-xs">
                  <a href="https://www.twilio.com/docs/phone-numbers/regulatory" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    View country-specific requirements →
                  </a>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="portPhoneNumber">Phone Number (E.164)</Label>
              <Input
                id="portPhoneNumber"
                placeholder="+15878428885"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="portLoa">LOA Document</Label>
              <Input
                id="portLoa"
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData({ ...formData, loaDocument: e.target.files?.[0] || null })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bill">Recent Bill</Label>
              <Input
                id="bill"
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData({ ...formData, billDocument: e.target.files?.[0] || null })}
              />
            </div>
            
            <Button 
              onClick={() => onSubmit(formData)} 
              disabled={loading || !formData.loaDocument || !formData.billDocument}
            >
              {loading ? "Creating Port Order..." : "Create Port Order"}
            </Button>
          </>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>Port order created successfully!</div>
                  <div className="text-sm">
                    <div>Port Order ID: <code>{evidence.portOrderId}</code></div>
                    <div>FOC Date: <code>{evidence.focDate}</code></div>
                    <div>Temporary DID: <code>{evidence.tempDid}</code></div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            <Button onClick={() => window.open('/ops/ports', '_blank')}>
              Track Port Status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
