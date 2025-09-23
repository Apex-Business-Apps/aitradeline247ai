import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Smartphone, MessageSquare, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const phoneIntegrations = [
  {
    id: 'ios-phone',
    name: 'iOS Phone App',
    description: 'Native iPhone calling integration',
    logo: '📱',
    status: 'available',
    platform: 'iOS',
    features: ['Call forwarding', 'Voicemail transcription', 'Contact sync', 'Call history'],
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  {
    id: 'android-phone',
    name: 'Android Phone',
    description: 'Native Android calling integration',
    logo: '🤖',
    status: 'available',
    platform: 'Android',
    features: ['Call screening', 'Smart replies', 'Contact integration', 'Call recording'],
    color: 'bg-green-500/10 text-green-600 border-green-500/20'
  },
  {
    id: 'imessage',
    name: 'iMessage',
    description: 'Apple\'s messaging service',
    logo: '💙',
    status: 'available',
    platform: 'iOS',
    features: ['Auto-reply', 'Business chat', 'Rich messages', 'Read receipts'],
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  {
    id: 'android-messages',
    name: 'Android Messages',
    description: 'Google\'s messaging app',
    logo: '💬',
    status: 'available',
    platform: 'Android',
    features: ['RCS support', 'Smart compose', 'Spam detection', 'Web sync'],
    color: 'bg-green-500/10 text-green-600 border-green-500/20'
  }
];

const smsProviders = [
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Cloud communications platform',
    features: ['Global SMS', 'Voice calls', 'WhatsApp API', 'Programmable messaging']
  },
  {
    id: 'vonage',
    name: 'Vonage',
    description: 'Business communications API',
    features: ['SMS API', 'Voice API', 'Verify API', 'Number insight']
  }
];

const PhoneIntegration = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [twilioCredentials, setTwilioCredentials] = useState({
    accountSid: '',
    authToken: '',
    phoneNumber: ''
  });

  const handleConnect = async (integration: any) => {
    setIsConnecting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Successfully connected to ${integration.name}!`);
    } catch (error) {
      toast.error(`Failed to connect to ${integration.name}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleProviderSetup = async (provider: any) => {
    if (provider.id === 'twilio' && (!twilioCredentials.accountSid || !twilioCredentials.authToken)) {
      toast.error('Please fill in your Twilio credentials');
      return;
    }
    
    setIsConnecting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Successfully configured ${provider.name}!`);
    } catch (error) {
      toast.error(`Failed to configure ${provider.name}`);
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Phone & SMS Integration</h1>
              <p className="text-muted-foreground">Connect to native phone and messaging apps</p>
            </div>
          </div>
        </div>

        {/* Native Phone Integrations */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Native Mobile Integrations
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {phoneIntegrations.map((integration) => (
              <Card 
                key={integration.id}
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
                      <div className="text-3xl">{integration.logo}</div>
                      <div>
                        <CardTitle className="text-lg font-bold">{integration.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
                        <Badge className={`mt-2 ${integration.color}`}>
                          {integration.platform}
                        </Badge>
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
                    <div className="grid grid-cols-1 gap-1">
                      {integration.features.map((feature) => (
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
                      onClick={() => handleConnect(integration)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        'Setting up...'
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure {integration.name}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* SMS Provider Configuration */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Providers
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {smsProviders.map((provider) => (
              <Card 
                key={provider.id}
                className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm"
                style={{ 
                  boxShadow: 'var(--premium-shadow-subtle)',
                  background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
                  border: '1px solid hsl(var(--premium-border))'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-lg font-bold">{provider.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                </CardHeader>

                <CardContent className="relative z-10 space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Features:</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {provider.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {provider.id === 'twilio' && (
                    <div className="space-y-3 pt-4 border-t border-muted/20">
                      <div className="space-y-2">
                        <Label htmlFor="account-sid">Account SID</Label>
                        <Input
                          id="account-sid"
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          value={twilioCredentials.accountSid}
                          onChange={(e) => setTwilioCredentials(prev => ({ ...prev, accountSid: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="auth-token">Auth Token</Label>
                        <Input
                          id="auth-token"
                          type="password"
                          placeholder="Your Twilio Auth Token"
                          value={twilioCredentials.authToken}
                          onChange={(e) => setTwilioCredentials(prev => ({ ...prev, authToken: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone-number">Twilio Phone Number</Label>
                        <Input
                          id="phone-number"
                          placeholder="+1234567890"
                          value={twilioCredentials.phoneNumber}
                          onChange={(e) => setTwilioCredentials(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-muted/20">
                    <Button
                      className="w-full"
                      onClick={() => handleProviderSetup(provider)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        'Configuring...'
                      ) : (
                        `Configure ${provider.name}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PhoneIntegration;