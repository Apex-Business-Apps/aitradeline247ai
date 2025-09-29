import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, Save, CheckCircle } from "lucide-react";
import { getSettings, saveSettings, placeTestCall, createPortal } from "@/lib/api";
import { validatePhone, normalize, formatForDisplay } from "@/lib/phone";
import { setSEO } from "@/lib/seo";
import type { SettingsGetResponse } from "@/lib/api";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const [emailToLookup, setEmailToLookup] = useState('');
  
  const [data, setData] = useState<SettingsGetResponse | null>(null);
  const [formData, setFormData] = useState({
    business_name: '',
    business_target_e164: '',
    email_recipients: [] as string[]
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestCalling, setIsTestCalling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailRecipientsText, setEmailRecipientsText] = useState('');

  useEffect(() => {
    setSEO({
      title: "Settings — TradeLine 24/7",
      description: "Manage your AI receptionist settings and subscription.",
      path: "/settings",
    });

    // Check for success param from Stripe
    if (searchParams.get('success') === '1') {
      setSuccess('Subscription created successfully! Please configure your settings below.');
    }

    // Try to get email from localStorage or URL params
    const storedEmail = localStorage.getItem('tl247_email');
    if (storedEmail) {
      setEmailToLookup(storedEmail);
      loadSettings(storedEmail);
    }
  }, [searchParams]);

  const loadSettings = async (email: string) => {
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await getSettings(email);
      setData(response);
      
      if (response.settings) {
        setFormData({
          business_name: response.settings.business_name,
          business_target_e164: response.settings.business_target_e164,
          email_recipients: response.settings.email_recipients
        });
        setEmailRecipientsText(response.settings.email_recipients.join(', '));
      }
      
      // Store email for future visits
      localStorage.setItem('tl247_email', email);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailToLookup) {
      loadSettings(emailToLookup);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email_recipients') {
      setEmailRecipientsText(value);
      setFormData(prev => ({
        ...prev,
        email_recipients: value.split(',').map(email => email.trim()).filter(Boolean)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: field === 'business_target_e164' ? normalize(value) : value
      }));
    }
    setError('');
    setSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.org || !emailToLookup) return;
    
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      // Validate form
      if (!formData.business_name.trim()) {
        throw new Error('Business name is required');
      }

      const phoneValidation = validatePhone(formData.business_target_e164);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error);
      }

      await saveSettings({
        email_to: emailToLookup,
        business_name: formData.business_name.trim(),
        business_target_e164: normalize(formData.business_target_e164),
        email_recipients: formData.email_recipients
      });

      setSuccess('Settings saved successfully!');
      
      // Reload to get updated data
      await loadSettings(emailToLookup);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestCall = async () => {
    if (!emailToLookup) return;
    
    setIsTestCalling(true);
    setError('');
    setSuccess('');

    try {
      const response = await placeTestCall({ email_to: emailToLookup });
      if (response.placed) {
        setSuccess(`Test call placed successfully! Call SID: ${response.call_sid}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place test call');
    } finally {
      setIsTestCalling(false);
    }
  };

  const handleBillingPortal = async () => {
    if (!data?.subscription?.stripe_customer_id) return;

    try {
      const response = await createPortal({
        stripe_customer_id: data.subscription.stripe_customer_id
      });
      window.location.href = response.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trialing': return 'bg-blue-500';
      case 'past_due': return 'bg-yellow-500';
      case 'canceled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-20">
        <div className="container max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Organization Settings</h1>
            <p className="text-muted-foreground">Configure your AI receptionist service</p>
          </div>

          {!data && (
            <Card>
              <CardHeader>
                <CardTitle>Load Organization</CardTitle>
                <CardDescription>Enter your organization email to load settings</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailLookupSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email-lookup">Organization Email</Label>
                    <Input
                      id="email-lookup"
                      type="email"
                      value={emailToLookup}
                      onChange={(e) => setEmailToLookup(e.target.value)}
                      placeholder="contact@yourbusiness.com"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load Settings'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {data && (
            <>
              {/* Organization Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Organization Details
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setData(null);
                        setEmailToLookup('');
                        localStorage.removeItem('tl247_email');
                      }}
                    >
                      Switch Org
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Name:</strong> {data.org.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {data.org.email_to}
                  </div>
                  <div>
                    <strong>Phone:</strong> {formatForDisplay(data.org.target_e164)}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(data.org.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Status */}
              {data.subscription && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Subscription Status
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleBillingPortal}
                      >
                        Manage Billing
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <strong>Plan:</strong> 
                      <Badge variant="secondary">{data.subscription.plan}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Status:</strong>
                      <Badge className={getStatusColor(data.subscription.status)}>
                        {data.subscription.status}
                      </Badge>
                    </div>
                    {data.subscription.current_period_end && (
                      <div>
                        <strong>Renews:</strong> {new Date(data.subscription.current_period_end).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Settings Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Configuration</CardTitle>
                  <CardDescription>Configure how your AI receptionist operates</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <Label htmlFor="business-name">Business Name *</Label>
                      <Input
                        id="business-name"
                        value={formData.business_name}
                        onChange={(e) => handleInputChange('business_name', e.target.value)}
                        placeholder="Your Business Name"
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        This name will be used in AI conversations
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="target-phone">Business Phone Number *</Label>
                      <Input
                        id="target-phone"
                        value={formData.business_target_e164}
                        onChange={(e) => handleInputChange('business_target_e164', e.target.value)}
                        placeholder="(555) 123-4567"
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Where to forward important calls that need human attention
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="email-recipients">Email Recipients</Label>
                      <Textarea
                        id="email-recipients"
                        value={emailRecipientsText}
                        onChange={(e) => handleInputChange('email_recipients', e.target.value)}
                        placeholder="email1@company.com, email2@company.com"
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Comma-separated emails to receive call notifications and transcripts
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                          </>
                        )}
                      </Button>

                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleTestCall}
                        disabled={isTestCalling || !data.settings}
                      >
                        {isTestCalling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Calling...
                          </>
                        ) : (
                          <>
                            <Phone className="mr-2 h-4 w-4" />
                            Test Call
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Settings;