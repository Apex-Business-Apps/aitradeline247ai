import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, ExternalLink, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const crmProviders = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'World\'s #1 CRM platform',
    logo: '🌩️',
    status: 'available',
    features: ['Lead Management', 'Contact Sync', 'Opportunity Tracking', 'Custom Fields'],
    setupUrl: 'https://salesforce.com/oauth'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Inbound marketing and sales platform',
    logo: '🧡',
    status: 'available',
    features: ['Contact Management', 'Deal Pipeline', 'Email Tracking', 'Analytics'],
    setupUrl: 'https://hubspot.com/oauth'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales-focused CRM for growing teams',
    logo: '🔵',
    status: 'available',
    features: ['Pipeline Management', 'Activity Tracking', 'Email Integration', 'Reports'],
    setupUrl: 'https://pipedrive.com/oauth'
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Complete business suite CRM',
    logo: '📊',
    status: 'available',
    features: ['Lead Scoring', 'Workflow Automation', 'Social CRM', 'Mobile Access'],
    setupUrl: 'https://zoho.com/oauth'
  }
];

const CRMIntegration = () => {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (provider: any) => {
    setIsConnecting(true);
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully connected to ${provider.name}!`);
      
      // In a real implementation, this would:
      // 1. Open OAuth flow for the provider
      // 2. Handle the callback
      // 3. Store the tokens securely
      // 4. Test the connection
      
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">CRM Integrations</h1>
              <p className="text-muted-foreground">Connect your AI receptionist to your CRM</p>
            </div>
          </div>
        </div>

        {/* CRM Providers Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {crmProviders.map((provider) => (
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
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    {provider.status === 'available' ? 'Available' : 'Coming Soon'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
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

        {/* Configuration Section */}
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
              Integration Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure how your AI receptionist interacts with your CRM
            </p>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sync-frequency">Sync Frequency</Label>
                <select className="w-full p-2 rounded-md border border-input bg-background">
                  <option>Real-time</option>
                  <option>Every 5 minutes</option>
                  <option>Every 15 minutes</option>
                  <option>Hourly</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-source">Default Lead Source</Label>
                <Input 
                  id="lead-source"
                  placeholder="AI Receptionist"
                  defaultValue="TradeLine 24/7 AI"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
              <Input 
                id="webhook-url"
                placeholder="https://your-crm.com/webhook"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Receive real-time notifications when leads are created or updated
              </p>
            </div>

            <Button className="w-full md:w-auto">
              Save Configuration
            </Button>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default CRMIntegration;