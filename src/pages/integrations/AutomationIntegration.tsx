import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, ExternalLink, Settings, CheckCircle, Play, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const automationProviders = [
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect 6,000+ apps with automated workflows',
    logo: '⚡',
    status: 'available',
    features: ['Trigger workflows', 'Multi-step zaps', 'Conditional logic', 'Error handling'],
    pricing: 'Free + Premium',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
  },
  {
    id: 'ifttt',
    name: 'IFTTT',
    description: 'If This Then That - Simple automation',
    logo: '🔗',
    status: 'available',
    features: ['Simple triggers', 'Applet creation', 'Location-based', 'IoT integration'],
    pricing: 'Free + Pro',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  {
    id: 'power-automate',
    name: 'Microsoft Power Automate',
    description: 'Enterprise automation for Microsoft ecosystem',
    logo: '🔄',
    status: 'available',
    features: ['Microsoft 365', 'AI Builder', 'Desktop flows', 'Approval workflows'],
    pricing: 'Subscription',
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
  },
  {
    id: 'make',
    name: 'Make (formerly Integromat)',
    description: 'Visual automation platform',
    logo: '🎯',
    status: 'coming-soon',
    features: ['Visual builder', 'Complex scenarios', 'Data transformation', 'Real-time sync'],
    pricing: 'Free + Premium',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  }
];

const automationTemplates = [
  {
    id: 'crm-lead',
    title: 'CRM Lead Creation',
    description: 'Automatically create leads in your CRM when calls are completed',
    trigger: 'Call Completed',
    action: 'Create CRM Lead',
    apps: ['Salesforce', 'HubSpot', 'Pipedrive'],
    difficulty: 'Easy'
  },
  {
    id: 'email-followup',
    title: 'Email Follow-up',
    description: 'Send follow-up emails to callers based on call outcome',
    trigger: 'Call Tagged',
    action: 'Send Email',
    apps: ['Gmail', 'Outlook', 'SendGrid'],
    difficulty: 'Easy'
  },
  {
    id: 'calendar-booking',
    title: 'Calendar Booking',
    description: 'Schedule appointments in calendar when requested during calls',
    trigger: 'Appointment Requested',
    action: 'Create Calendar Event',
    apps: ['Google Calendar', 'Outlook Calendar', 'Calendly'],
    difficulty: 'Medium'
  },
  {
    id: 'slack-notification',
    title: 'Team Notifications',
    description: 'Notify team members in Slack for urgent or high-priority calls',
    trigger: 'High Priority Call',
    action: 'Send Slack Message',
    apps: ['Slack', 'Microsoft Teams', 'Discord'],
    difficulty: 'Easy'
  }
];

const AutomationIntegration = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

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

  const handleTemplateSetup = (template: any) => {
    toast.success(`Setting up "${template.title}" automation...`);
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL');
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          event: 'webhook_test',
          data: { message: 'Test webhook from TradeLine 24/7' }
        })
      });

      toast.success('Test webhook sent successfully!');
    } catch (error) {
      toast.error('Failed to send test webhook');
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Automation Integrations</h1>
              <p className="text-muted-foreground">Connect to automation platforms and create workflows</p>
            </div>
          </div>
        </div>

        {/* Automation Providers */}
        <div className="grid gap-6 md:grid-cols-2">
          {automationProviders.map((provider) => (
            <Card 
              key={provider.id}
              className={`relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm group hover:shadow-[var(--premium-shadow-medium)] transition-all duration-300 ${
                provider.status === 'coming-soon' ? 'opacity-75' : ''
              }`}
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
                      <Badge className={`mt-2 ${provider.color}`}>
                        {provider.pricing}
                      </Badge>
                    </div>
                  </div>
                  <Badge className={provider.status === 'available' 
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                  }>
                    {provider.status === 'available' ? 'Available' : 'Coming Soon'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Features:</h4>
                  <div className="grid grid-cols-1 gap-1">
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
                    variant="default"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleConnect(provider)}
                    disabled={isConnecting || provider.status === 'coming-soon'}
                  >
                    {provider.status === 'coming-soon' ? (
                      'Coming Soon'
                    ) : isConnecting ? (
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

        {/* Webhook Configuration */}
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
              Webhook Configuration
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up webhooks to trigger external automations
            </p>
          </CardHeader>

          <CardContent className="relative z-10 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={testWebhook} variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Test
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy your webhook URL from Zapier, IFTTT, or other automation platforms
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="events">Trigger Events</Label>
                <select className="w-full p-2 rounded-md border border-input bg-background">
                  <option>All events</option>
                  <option>Call completed</option>
                  <option>Call missed</option>
                  <option>Lead qualified</option>
                  <option>Appointment requested</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Data Format</Label>
                <select className="w-full p-2 rounded-md border border-input bg-background">
                  <option>JSON</option>
                  <option>Form data</option>
                  <option>XML</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automation Templates */}
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
              <Zap className="h-5 w-5" />
              Automation Templates
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Pre-built automation workflows you can set up instantly
            </p>
          </CardHeader>

          <CardContent className="relative z-10">
            <div className="grid gap-4 md:grid-cols-2">
              {automationTemplates.map((template, index) => (
                <div 
                  key={template.id}
                  className="p-4 rounded-2xl bg-gradient-to-r from-muted/10 to-muted/5 border border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-[var(--premium-shadow-subtle)] animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-foreground">{template.title}</h3>
                      <Badge className={`text-xs ${
                        template.difficulty === 'Easy' 
                          ? 'bg-green-500/10 text-green-600 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}>
                        {template.difficulty}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded">
                        {template.trigger}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded">
                        {template.action}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.apps.map((app) => (
                        <span key={app} className="text-xs px-2 py-1 bg-muted/30 rounded">
                          {app}
                        </span>
                      ))}
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleTemplateSetup(template)}
                    >
                      <Play className="h-3 w-3 mr-2" />
                      Set Up Automation
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default AutomationIntegration;