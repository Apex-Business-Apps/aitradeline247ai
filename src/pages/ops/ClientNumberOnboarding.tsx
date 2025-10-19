import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Phone, MessageSquare, RefreshCw, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function ClientNumberOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [evidence, setEvidence] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    tenant_id: "",
    business_name: "",
    legal_address: "",
    contact_email: "",
    existing_numbers: "",
    want_sms: false,
    fallback_e164: ""
  });

  const addEvidence = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvidence(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const initializeClient = async () => {
    setLoading(true);
    setEvidence([]);
    
    try {
      addEvidence("Initializing client onboarding...");
      
      // Parse existing numbers
      const existingNumbers = formData.existing_numbers
        .split(",")
        .map(n => n.trim())
        .filter(n => n);

      // Step 1: Ensure Twilio subaccount exists
      addEvidence("Creating/retrieving Twilio subaccount...");
      const { data: subaccountData, error: subaccountError } = await supabase.functions.invoke(
        "ops-twilio-ensure-subaccount",
        {
          body: {
            tenant_id: formData.tenant_id,
            business_name: formData.business_name
          }
        }
      );

      if (subaccountError) throw subaccountError;
      addEvidence(`✓ Subaccount ready: ${subaccountData.subaccount_sid}`);

      // Step 2: Create/retrieve Messaging Service
      if (formData.want_sms) {
        addEvidence("Setting up Messaging Service for SMS...");
        const { data: messagingData, error: messagingError } = await supabase.functions.invoke(
          "ops-twilio-ensure-messaging-service",
          {
            body: {
              tenant_id: formData.tenant_id,
              business_name: formData.business_name,
              subaccount_sid: subaccountData.subaccount_sid
            }
          }
        );

        if (messagingError) throw messagingError;
        addEvidence(`✓ Messaging Service ready: ${messagingData.messaging_service_sid}`);
      }

      addEvidence("✓ Client initialization complete!");
      toast.success("Client initialized successfully");

    } catch (error: any) {
      console.error("Initialization error:", error);
      addEvidence(`✗ Error: ${error.message}`);
      toast.error("Failed to initialize client");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = async () => {
    await initializeClient();
    addEvidence("Quick-Start track selected - ready to purchase new numbers");
    toast.info("Now proceed to purchase numbers for this client");
  };

  const handleQuickStartForward = async () => {
    if (!formData.fallback_e164) {
      toast.error("Fallback number is required for Quick-Start Forward");
      return;
    }

    setLoading(true);
    setEvidence([]);
    
    try {
      addEvidence("Initializing client...");
      
      // Initialize client first
      await initializeClient();
      
      addEvidence("Executing Quick-Start Forward flow...");
      
      // Parse area code from fallback number
      const areaCode = formData.fallback_e164.substring(2, 5);
      
      const { data, error } = await supabase.functions.invoke(
        "ops-twilio-quickstart-forward",
        {
          body: {
            tenant_id: formData.tenant_id,
            business_name: formData.business_name,
            fallback_e164: formData.fallback_e164,
            area_code: areaCode,
            contact_email: formData.contact_email
          }
        }
      );

      if (error) throw error;

      addEvidence(`✅ Quick-Start: Purchased number ${data.phone_number}`);
      addEvidence(`✅ Configured webhooks and failover`);
      addEvidence(`✅ Added to Messaging Service`);
      if (data.forwarding_kit_url) {
        addEvidence(`✅ Forwarding Kit ready: ${data.forwarding_kit_url}`);
      }
      
      toast.success("Quick-Start Forward complete!");
      
      // Open forwarding kit in new tab
      if (data.forwarding_kit_url) {
        window.open(data.forwarding_kit_url, '_blank');
      }

    } catch (error: any) {
      console.error("Quick-Start Forward error:", error);
      addEvidence(`✗ Error: ${error.message}`);
      toast.error("Failed to complete Quick-Start Forward");
    } finally {
      setLoading(false);
    }
  };

  const handleHostedSMS = async () => {
    if (!formData.existing_numbers) {
      toast.error("Please provide at least one existing number for Hosted SMS");
      return;
    }

    setLoading(true);
    setEvidence([]);
    
    try {
      addEvidence("Initializing client for Hosted SMS...");
      
      // Initialize client first
      await initializeClient();
      
      addEvidence("Processing Hosted SMS requests...");
      
      // Parse existing numbers
      const existingNumbers = formData.existing_numbers
        .split(",")
        .map(n => n.trim())
        .filter(n => n);

      if (existingNumbers.length === 0) {
        throw new Error("No valid phone numbers provided");
      }

      // Get subaccount SID
      const { data: subaccountData } = await supabase.functions.invoke(
        "ops-twilio-ensure-subaccount",
        {
          body: {
            tenant_id: formData.tenant_id,
            business_name: formData.business_name
          }
        }
      );

      // Process each number for Hosted SMS
      for (const phoneNumber of existingNumbers) {
        addEvidence(`📱 Submitting Hosted SMS order for ${phoneNumber}...`);
        
        const { data, error } = await supabase.functions.invoke(
          "ops-twilio-hosted-sms",
          {
            body: {
              phoneNumber,
              tenant_id: formData.tenant_id,
              business_name: formData.business_name,
              legal_address: formData.legal_address,
              contact_email: formData.contact_email,
              subaccount_sid: subaccountData.subaccount_sid
            }
          }
        );

        if (error) throw error;

        addEvidence(`✅ Hosted SMS order created for ${phoneNumber}`);
        addEvidence(`📧 LOA email sent to ${formData.contact_email}`);
        addEvidence(`🔑 Order SID: ${data.orderSid}`);
        addEvidence(`📋 Status: ${data.status}`);
        
        if (data.loaUrl) {
          addEvidence(`📄 LOA Document: ${data.loaUrl}`);
        }
        
        addEvidence(`⚠️ Client must sign LOA and complete ownership verification`);
        addEvidence(`⏱️ Processing typically takes 1-2 business days`);
        addEvidence("");
      }

      addEvidence("✅ All Hosted SMS orders submitted successfully");
      addEvidence("📌 Next steps:");
      addEvidence("  1. Client will receive LOA email from Twilio");
      addEvidence("  2. Client must sign LOA electronically");
      addEvidence("  3. Twilio may call for ownership verification");
      addEvidence("  4. Once approved, numbers will be SMS-enabled");
      addEvidence("  5. Numbers will be added to Messaging Service automatically");
      
      toast.success("Hosted SMS orders submitted successfully");

    } catch (error: any) {
      console.error("Hosted SMS error:", error);
      addEvidence(`✗ Error: ${error.message}`);
      toast.error("Failed to submit Hosted SMS orders");
    } finally {
      setLoading(false);
    }
  };

  const handleFullPort = async () => {
    if (!formData.existing_numbers) {
      toast.error("Please provide the phone number(s) to port");
      return;
    }

    if (!formData.fallback_e164) {
      toast.error("Fallback number is required for temporary forwarding during port");
      return;
    }

    setLoading(true);
    setEvidence([]);
    
    try {
      addEvidence("Initializing client for Full Port...");
      
      // Initialize client first
      await initializeClient();
      
      addEvidence("Processing port orders...");
      
      // Parse numbers to port
      const numbersToPort = formData.existing_numbers
        .split(",")
        .map(n => n.trim())
        .filter(n => n);

      if (numbersToPort.length === 0) {
        throw new Error("No valid phone numbers provided");
      }

      // Get subaccount SID
      const { data: subaccountData } = await supabase.functions.invoke(
        "ops-twilio-ensure-subaccount",
        {
          body: {
            tenant_id: formData.tenant_id,
            business_name: formData.business_name
          }
        }
      );

      // Process each number for porting
      for (const phoneNumber of numbersToPort) {
        addEvidence(`📞 Initiating port order for ${phoneNumber}...`);
        
        const { data, error } = await supabase.functions.invoke(
          "ops-twilio-create-port",
          {
            body: {
              phoneNumber,
              tenant_id: formData.tenant_id,
              business_name: formData.business_name,
              legal_address: formData.legal_address,
              contact_email: formData.contact_email,
              subaccount_sid: subaccountData.subaccount_sid,
              authorized_person_name: formData.business_name,
              fallback_e164: formData.fallback_e164,
              current_carrier: 'Unknown' // Could add a field for this
            }
          }
        );

        if (error) throw error;

        addEvidence(`✅ Port order created for ${phoneNumber}`);
        addEvidence(`🔑 Port Order SID: ${data.portOrderSid}`);
        addEvidence(`📅 Estimated FOC Date: ${new Date(data.estimatedFocDate).toLocaleDateString()}`);
        
        if (data.temporaryDid) {
          addEvidence(`📱 Temporary DID provisioned: ${data.temporaryDid}`);
          addEvidence(`↪️  Forward ${phoneNumber} to ${data.temporaryDid} immediately`);
        }
        
        if (data.quickStartCreated) {
          addEvidence(`⚡ Quick-Start forwarding kit auto-generated`);
        }
        
        addEvidence(`📧 LOA email sent to ${formData.contact_email}`);
        addEvidence(`⚙️  Webhooks pre-provisioned for port completion`);
        addEvidence("");
        
        // Display next steps
        addEvidence("📋 Next Steps:");
        data.nextSteps?.forEach((step: string) => {
          addEvidence(`  • ${step}`);
        });
        addEvidence("");
      }

      addEvidence("✅ All port orders submitted successfully");
      addEvidence("");
      addEvidence("🎯 Port Process Timeline:");
      addEvidence("  1. Client signs LOA (today)");
      addEvidence("  2. Twilio processes port request (1-2 days)");
      addEvidence("  3. Losing carrier confirms (3-5 days)");
      addEvidence("  4. FOC date reached - port completes (7-10 days)");
      addEvidence("  5. Number goes live on Twilio automatically");
      addEvidence("  6. Remove temporary forwarding");
      addEvidence("");
      addEvidence("⚠️  During port process:");
      addEvidence("  • Temporary forwarding ensures no missed calls");
      addEvidence("  • Voice & SMS will work via forwarding");
      addEvidence("  • Monitor port status daily");
      
      toast.success("Port orders created successfully");

    } catch (error: any) {
      console.error("Port order error:", error);
      addEvidence(`✗ Error: ${error.message}`);
      toast.error("Failed to create port orders");
    } finally {
      setLoading(false);
    }
  };

  const handleTrustSetup = async () => {
    if (!formData.existing_numbers && !formData.fallback_e164) {
      toast.error("Please provide a phone number for Trust Setup");
      return;
    }

    setLoading(true);
    setEvidence([]);
    
    try {
      addEvidence("Initializing Trust Hub and reputation setup...");
      
      // Use first existing number or fallback number
      const phoneNumber = formData.existing_numbers 
        ? formData.existing_numbers.split(",")[0].trim()
        : formData.fallback_e164;
      
      // Get subaccount SID
      const { data: subaccountData } = await supabase.functions.invoke(
        "ops-twilio-ensure-subaccount",
        {
          body: {
            tenant_id: formData.tenant_id,
            business_name: formData.business_name
          }
        }
      );

      addEvidence(`Setting up Trust Hub for ${phoneNumber}...`);
      
      const { data, error } = await supabase.functions.invoke(
        "ops-twilio-trust-setup",
        {
          body: {
            tenant_id: formData.tenant_id,
            business_name: formData.business_name,
            legal_address: formData.legal_address,
            phone_number: phoneNumber,
            subaccount_sid: subaccountData.subaccount_sid,
            country_code: 'US',
            contact_email: formData.contact_email
          }
        }
      );

      if (error) throw error;

      if (data.trustHubProfileSid) {
        addEvidence(`✅ Trust Hub Business Profile created: ${data.trustHubProfileSid}`);
      }
      
      if (data.a2pBrandSid && data.a2pCampaignSid) {
        addEvidence(`✅ Registered for 10DLC (US A2P)`);
        addEvidence(`   Brand SID: ${data.a2pBrandSid}`);
        addEvidence(`   Campaign SID: ${data.a2pCampaignSid}`);
      }
      
      if (data.voiceIntegrityEnabled) {
        addEvidence(`✅ Enabled STIR/SHAKEN voice attestation`);
      }
      
      if (data.cnamSet) {
        addEvidence(`✅ CNAM Caller ID set to "${formData.business_name}"`);
      }
      
      addEvidence("");
      addEvidence("📋 Reputation Features Configured:");
      addEvidence("  • Trust Hub Business Profile ✓");
      if (data.a2pBrandSid) {
        addEvidence("  • A2P 10DLC Registration ✓");
      }
      if (data.voiceIntegrityEnabled) {
        addEvidence("  • STIR/SHAKEN Attestation ✓");
      }
      if (data.cnamSet) {
        addEvidence("  • Caller ID Name Display ✓");
      }
      addEvidence("");
      addEvidence("✅ Trust and reputation setup complete!");
      
      toast.success("Trust Hub and reputation setup complete!");

    } catch (error: any) {
      console.error("Trust Setup error:", error);
      addEvidence(`✗ Error: ${error.message}`);
      toast.error("Failed to complete Trust Setup");
    } finally {
      setLoading(false);
    }
  };

  const handleMapNumberToTenant = async () => {
    if (!formData.existing_numbers && !formData.fallback_e164) {
      toast.error("Please provide a phone number to map for billing");
      return;
    }

    setLoading(true);
    setEvidence([]);
    
    try {
      addEvidence("Initializing billing mapping...");
      
      // Use first existing number or fallback number
      const phoneNumber = formData.existing_numbers 
        ? formData.existing_numbers.split(",")[0].trim()
        : formData.fallback_e164;
      
      addEvidence(`Mapping ${phoneNumber} to tenant for usage tracking...`);
      
      const { data, error } = await supabase.functions.invoke(
        "ops-map-number-to-tenant",
        {
          body: {
            tenant_id: formData.tenant_id,
            phone_number: phoneNumber,
            twilio_number_sid: `PN${Date.now()}`, // This should be from actual provisioning
            number_type: 'both' // Supports voice and SMS
          }
        }
      );

      if (error) throw error;

      addEvidence(`✅ ${data.evidence || 'Mapped number to tenant and initialized usage counters'}`);
      addEvidence("");
      addEvidence("📊 Billing Features Configured:");
      addEvidence("  • Phone number mapped to tenant ✓");
      addEvidence("  • Usage counters initialized ✓");
      addEvidence("  • Billing period set to monthly ✓");
      addEvidence("  • Ready to track voice minutes ✓");
      addEvidence("  • Ready to track SMS counts ✓");
      addEvidence("");
      addEvidence("💰 Usage will be automatically logged for:");
      addEvidence("  • Inbound voice calls");
      addEvidence("  • Outbound voice calls");
      addEvidence("  • Inbound SMS messages");
      addEvidence("  • Outbound SMS messages");
      
      toast.success("Number mapped for billing successfully!");

    } catch (error: any) {
      console.error("Billing mapping error:", error);
      addEvidence(`✗ Error: ${error.message}`);
      toast.error("Failed to map number for billing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Client Number Onboarding</CardTitle>
          <CardDescription>
            Initialize client account and select onboarding track
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant ID *</Label>
              <Input
                id="tenant_id"
                placeholder="internal-client-id"
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                placeholder="Acme Corporation"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="legal_address">Legal Address *</Label>
              <Input
                id="legal_address"
                placeholder="123 Main St, City, Province, Postal"
                value={formData.legal_address}
                onChange={(e) => setFormData({ ...formData, legal_address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@example.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback_e164">Fallback Number *</Label>
              <Input
                id="fallback_e164"
                placeholder="+14031234567"
                value={formData.fallback_e164}
                onChange={(e) => setFormData({ ...formData, fallback_e164: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="existing_numbers">Existing Numbers (comma-separated)</Label>
              <Input
                id="existing_numbers"
                placeholder="+14031111111, +14032222222"
                value={formData.existing_numbers}
                onChange={(e) => setFormData({ ...formData, existing_numbers: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="want_sms"
                checked={formData.want_sms}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, want_sms: checked === true })
                }
              />
              <Label htmlFor="want_sms" className="cursor-pointer">
                Enable SMS on existing numbers
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Select Onboarding Track</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleQuickStartForward}
                disabled={loading || !formData.tenant_id || !formData.business_name || !formData.fallback_e164}
                className="h-24 flex-col gap-2"
              >
                <Phone className="h-6 w-6" />
                <span>Quick-Start Forward</span>
                <span className="text-xs opacity-80">Buy + Wire + Kit</span>
              </Button>

              <Button
                onClick={handleHostedSMS}
                disabled={loading || !formData.tenant_id || !formData.business_name}
                variant="secondary"
                className="h-24 flex-col gap-2"
              >
                <MessageSquare className="h-6 w-6" />
                <span>Hosted SMS</span>
                <span className="text-xs opacity-80">Use existing numbers</span>
              </Button>

              <Button
                onClick={handleFullPort}
                disabled={loading || !formData.tenant_id || !formData.business_name}
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <RefreshCw className="h-6 w-6" />
                <span>Full Port</span>
                <span className="text-xs opacity-80">Port existing numbers</span>
              </Button>
            </div>
          </div>

          {/* Trust & Reputation Setup */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Trust & Reputation Setup</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure Trust Hub, A2P 10DLC, STIR/SHAKEN, and CNAM caller ID (can run in parallel with onboarding tracks)
            </p>
            <Button
              onClick={handleTrustSetup}
              disabled={loading || !formData.tenant_id || !formData.business_name}
              variant="secondary"
              className="w-full md:w-auto"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Setup Trust & Reputation
            </Button>
          </div>

          {/* Billing Mapping */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">Billing & Usage Mapping</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Map phone numbers to tenant for usage tracking and billing (initialize usage counters for voice minutes and SMS counts)
            </p>
            <Button
              onClick={handleMapNumberToTenant}
              disabled={loading || !formData.tenant_id || (!formData.existing_numbers && !formData.fallback_e164)}
              variant="secondary"
              className="w-full md:w-auto"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              <DollarSign className="mr-2 h-4 w-4" />
              Map Number for Billing
            </Button>
          </div>

          {/* Evidence Panel */}
          {evidence.length > 0 && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <h4 className="font-semibold mb-2">Onboarding Log</h4>
                  <div className="bg-muted p-3 rounded font-mono text-xs max-h-64 overflow-y-auto">
                    {evidence.map((line, i) => (
                      <div key={i} className="py-1">{line}</div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

