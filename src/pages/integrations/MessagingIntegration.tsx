import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ExternalLink, Settings, CheckCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

const messagingApps = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'World\'s most popular messaging app',
    logo: '💚',
    status: 'available',
    features: ['Business API', 'Auto-replies', 'Rich media support', 'Broadcast lists'],
    setupType: 'oauth',
    color: 'bg-green-500/10 text-green-600 border-green-500/20'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Fast and secure messaging',
    logo: '✈️',
    status: 'available',
    features: ['Bot API', 'Inline queries', 'File sharing', 'Channel broadcasts'],
    setupType: 'bot-token',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Business communication platform',
    logo: '💼',
    status: 'available',
    features: ['Slack app', 'Workflow automation', 'Custom commands', 'Thread replies'],
    setupType: 'oauth',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Enterprise communication hub',
    logo: '👥',
    status: 'available',
    features: ['Teams bot', 'Meeting integration', 'File collaboration', 'Power Automate'],
    setupType: 'oauth',
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Community chat platform',
    logo: '🎮',
    status: 'coming-soon',
    features: ['Discord bot', 'Server integration', 'Voice channels', 'Rich embeds'],
    setupType: 'bot-token',
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Meta\'s messaging platform',
    logo: '📘',
    status: 'coming-soon',
    features: ['Messenger API', 'Rich cards', 'Quick replies', 'Persistent menu'],
    setupType: 'oauth',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  }
];

const MessagingIntegration = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [credentials, setCredentials] = useState({
    telegramBotToken: '',
    whatsappApiKey: ''
  });

  const handleConnect = async (app: any) => {
    setIsConnecting(true);
    
    try {
      if (app.setupType === 'bot-token' && app.id === 'telegram' && !credentials.telegramBotToken) {
        toast.error('Please enter your Telegram bot token');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Successfully connected to ${app.name}!`);
    } catch (error) {
      toast.error(`Failed to connect to ${app.name}`);
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Messaging App Integrations</h1>
              <p className="text-muted-foreground">Connect to popular messaging platforms</p>
            </div>
          </div>
        </div>

        {/* Messaging Apps Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {messagingApps.map((app) => (
            <Card 
              key={app.id}
              className={`relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm group hover:shadow-[var(--premium-shadow-medium)] transition-all duration-300 ${
                app.status === 'coming-soon' ? 'opacity-75' : ''
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
                    <div className="text-3xl">{app.logo}</div>
                    <div>
                      <CardTitle className="text-lg font-bold">{app.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{app.description}</p>
                    </div>
                  </div>
                  <Badge className={app.status === 'available' 
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                  }>
                    {app.status === 'available' ? 'Available' : 'Coming Soon'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Features:</h4>
                  <div className="space-y-1">
                    {app.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special setup for bot-token apps */}
                {app.setupType === 'bot-token' && app.id === 'telegram' && app.status === 'available' && (
                  <div className="space-y-2 pt-4 border-t border-muted/20">
                    <Label htmlFor="telegram-token">Bot Token</Label>
                    <Input
                      id="telegram-token"
                      placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={credentials.telegramBotToken}
                      onChange={(e) => setCredentials(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your bot token from @BotFather on Telegram
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-muted/20">
                  <Button
                    className="w-full"
                    onClick={() => handleConnect(app)}
                    disabled={isConnecting || app.status === 'coming-soon'}
                  >
                    {app.status === 'coming-soon' ? (
                      'Coming Soon'
                    ) : isConnecting ? (
                      'Connecting...'
                    ) : (
                      <>
                        {app.setupType === 'oauth' ? (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        ) : (
                          <Settings className="h-4 w-4 mr-2" />
                        )}
                        Connect {app.name}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Auto-response Configuration */}
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
              Auto-Response Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure automated responses across all messaging platforms
            </p>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="response-delay">Response Delay</Label>
                <select className="w-full p-2 rounded-md border border-input bg-background">
                  <option>Immediate</option>
                  <option>30 seconds</option>
                  <option>1 minute</option>
                  <option>2 minutes</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-hours">Business Hours Only</Label>
                <select className="w-full p-2 rounded-md border border-input bg-background">
                  <option>Yes</option>
                  <option>No</option>
                  <option>Custom schedule</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-message">Default Auto-Reply Message</Label>
              <Input 
                id="auto-message"
                placeholder="Thanks for your message! We'll get back to you soon."
                defaultValue="Hi! Thanks for reaching out to TradeLine 24/7. We've received your message and will respond within 24 hours during business hours."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keyword Triggers (comma-separated)</Label>
              <Input 
                id="keywords"
                placeholder="urgent, help, pricing, demo"
                defaultValue="urgent, help, support, pricing, demo, info"
              />
              <p className="text-xs text-muted-foreground">
                Messages containing these keywords will trigger immediate notifications
              </p>
            </div>

            <Button className="w-full md:w-auto">
              Save Auto-Response Settings
            </Button>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default MessagingIntegration;