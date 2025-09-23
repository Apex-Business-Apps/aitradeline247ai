import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ExternalLink, Settings, CheckCircle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const emailProviders = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Google\'s email service',
    logo: '📮',
    status: 'available',
    features: ['Auto-compose emails', 'Template management', 'Contact sync', 'Calendar integration'],
    platform: 'Web/Mobile'
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Microsoft\'s email and calendar service',
    logo: '📧',
    status: 'available',
    features: ['Exchange integration', 'Calendar sync', 'Contact management', 'Teams integration'],
    platform: 'Web/Mobile'
  },
  {
    id: 'apple-mail',
    name: 'Apple Mail',
    description: 'Native iOS and macOS email client',
    logo: '✉️',
    status: 'available',
    features: ['Native iOS integration', 'iCloud sync', 'Handoff support', 'VIP lists'],
    platform: 'iOS/macOS'
  },
  {
    id: 'thunderbird',
    name: 'Mozilla Thunderbird',
    description: 'Open-source email client',
    logo: '🦅',
    status: 'available',
    features: ['Add-on support', 'Privacy focused', 'Multi-account', 'Calendar integration'],
    platform: 'Desktop'
  }
];

const EmailIntegration = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState(`Hi {customer_name},

Thank you for calling TradeLine 24/7! 

Your inquiry about {inquiry_topic} has been received and will be processed within 24 hours. 

Here's a summary of your call:
- Call Duration: {call_duration}
- Primary Interest: {primary_interest}
- Follow-up Required: {follow_up_needed}

We'll be in touch soon!

Best regards,
TradeLine 24/7 Team`);

  const handleConnect = async (provider: any) => {
    setIsConnecting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Successfully connected to ${provider.name}!`);
    } catch (error) {
      toast.error(`Failed to connect to ${provider.name}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Email Integrations</h1>
              <p className="text-muted-foreground">Connect to email apps and automate follow-ups</p>
            </div>
          </div>
        </div>

        {/* Email Providers Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {emailProviders.map((provider) => (
            <Card 
              key={provider.id}
              className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm group hover:shadow-[var(--premium-shadow-medium)] transition-all duration-300"
              style={{ 
                boxShadow: 'var(--premium-shadow-subtle)',
                background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
                border: '1px solid hsl(var(--premium-border))'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{provider.logo}</div>
                    <div>
                      <CardTitle className="text-lg font-bold">{provider.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{provider.platform}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Available
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Features:</h4>
                  <div className="space-y-1">
                    {provider.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-muted/20">
                  <Button
                    className="w-full"
                    onClick={() => handleConnect(provider)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      'Connecting...'
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Connect {provider.name}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Email Template Configuration */}
        <Card 
          className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm"
          style={{ 
            boxShadow: 'var(--premium-shadow-subtle)',
            background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
            border: '1px solid hsl(var(--premium-border))'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Customize automated email responses sent after calls
            </p>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Email Subject</Label>
              <Input 
                id="email-subject"
                placeholder="Thank you for calling TradeLine 24/7"
                defaultValue="Thank you for calling TradeLine 24/7 - Follow-up"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-template">Email Template</Label>
              <Textarea 
                id="email-template"
                className="min-h-[200px] font-mono text-sm"
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                <p className="mb-1">Available variables:</p>
                <div className="grid grid-cols-2 gap-2">
                  <span>• {'{customer_name}'}</span>
                  <span>• {'{call_duration}'}</span>
                  <span>• {'{inquiry_topic}'}</span>
                  <span>• {'{primary_interest}'}</span>
                  <span>• {'{follow_up_needed}'}</span>
                  <span>• {'{call_date}'}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="auto-send">Auto-send emails</Label>
                <select className="w-full p-2 rounded-md border border-input bg-background">
                  <option>After every call</option>
                  <option>Only for qualified leads</option>
                  <option>Manual approval required</option>
                  <option>Disabled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="send-delay">Send delay</Label>
                <select className="w-full p-2 rounded-md border border-input bg-background">
                  <option>Immediate</option>
                  <option>5 minutes</option>
                  <option>15 minutes</option>
                  <option>1 hour</option>
                </select>
              </div>
            </div>

            <Button className="w-full md:w-auto">
              Save Email Configuration
            </Button>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default EmailIntegration;