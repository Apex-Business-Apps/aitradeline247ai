import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Download, Settings, CheckCircle, ExternalLink, QrCode } from 'lucide-react';
import { toast } from 'sonner';

const mobileFeatures = [
  {
    id: 'push-notifications',
    title: 'Push Notifications',
    description: 'Instant alerts for new calls and messages',
    icon: '🔔',
    platforms: ['iOS', 'Android']
  },
  {
    id: 'call-forwarding',
    title: 'Call Forwarding',
    description: 'Forward calls directly to your mobile device',
    icon: '📞',
    platforms: ['iOS', 'Android']
  },
  {
    id: 'voice-commands',
    title: 'Voice Commands',
    description: 'Control your AI receptionist with voice',
    icon: '🎤',
    platforms: ['iOS', 'Android']
  },
  {
    id: 'quick-responses',
    title: 'Quick Responses',
    description: 'Pre-configured responses for common scenarios',
    icon: '⚡',
    platforms: ['iOS', 'Android']
  },
  {
    id: 'analytics-mobile',
    title: 'Mobile Analytics',
    description: 'View performance metrics on the go',
    icon: '📊',
    platforms: ['iOS', 'Android']
  },
  {
    id: 'offline-mode',
    title: 'Offline Mode',
    description: 'Access cached data without internet',
    icon: '📱',
    platforms: ['iOS', 'Android']
  }
];

const appStores = [
  {
    platform: 'iOS',
    name: 'App Store',
    url: 'https://apps.apple.com/app/tradeline247',
    icon: '🍎',
    version: '2.1.0',
    rating: '4.8',
    downloads: '10K+'
  },
  {
    platform: 'Android',
    name: 'Google Play',
    url: 'https://play.google.com/store/apps/details?id=com.tradeline247',
    icon: '🤖',
    version: '2.1.0',
    rating: '4.7',
    downloads: '25K+'
  }
];

const MobileIntegration = () => {
  const navigate = useNavigate();
  const [showQRCode, setShowQRCode] = useState(false);

  const handleDownload = (store: any) => {
    toast.success(`Redirecting to ${store.name}...`);
    // In a real app, this would open the app store
    window.open(store.url, '_blank');
  };

  const generateQRCode = () => {
    setShowQRCode(true);
    toast.success('QR Code generated! Scan with your mobile device.');
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5">
              <Smartphone className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mobile App Integration</h1>
              <p className="text-muted-foreground">Native iOS and Android apps for TradeLine 24/7</p>
            </div>
          </div>
        </div>

        {/* App Download Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {appStores.map((store) => (
            <Card 
              key={store.platform}
              className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm group hover:shadow-[var(--premium-shadow-medium)] transition-all duration-300"
              style={{ 
                boxShadow: 'var(--premium-shadow-subtle)',
                background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
                border: '1px solid hsl(var(--premium-border))'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{store.icon}</div>
                    <div>
                      <CardTitle className="text-xl font-bold">{store.platform} App</CardTitle>
                      <p className="text-sm text-muted-foreground">Download from {store.name}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Available
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-foreground">{store.version}</div>
                    <div className="text-xs text-muted-foreground">Version</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{store.rating}</div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">{store.downloads}</div>
                    <div className="text-xs text-muted-foreground">Downloads</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => handleDownload(store)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download for {store.platform}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={generateQRCode}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Show QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* QR Code Display */}
        {showQRCode && (
          <Card 
            className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm text-center"
            style={{ 
              boxShadow: 'var(--premium-shadow-subtle)',
              background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
              border: '1px solid hsl(var(--premium-border))'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <CardContent className="relative z-10 py-8">
              <div className="inline-block p-8 bg-white rounded-2xl shadow-lg">
                <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">QR Code</p>
                    <p className="text-xs text-gray-400">Scan to download</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-muted-foreground">
                Scan this QR code with your mobile device to download the app
              </p>
            </CardContent>
          </Card>
        )}

        {/* Mobile Features */}
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
              Mobile App Features
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Powerful features available in our native mobile apps
            </p>
          </CardHeader>

          <CardContent className="relative z-10">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mobileFeatures.map((feature, index) => (
                <div 
                  key={feature.id}
                  className="p-4 rounded-2xl bg-gradient-to-r from-muted/10 to-muted/5 border border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-[var(--premium-shadow-subtle)] animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{feature.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                      <div className="flex gap-2">
                        {feature.platforms.map((platform) => (
                          <Badge 
                            key={platform}
                            className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs"
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
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
              <ExternalLink className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Follow these steps to set up the mobile app
            </p>
          </CardHeader>

          <CardContent className="relative z-10 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-foreground">Download the App</h4>
                  <p className="text-sm text-muted-foreground">Get the TradeLine 24/7 app from your device's app store</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-foreground">Sign In</h4>
                  <p className="text-sm text-muted-foreground">Use your TradeLine 24/7 account credentials to sign in</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-foreground">Enable Notifications</h4>
                  <p className="text-sm text-muted-foreground">Allow push notifications to stay updated on calls and messages</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-semibold text-foreground">Configure Settings</h4>
                  <p className="text-sm text-muted-foreground">Customize your preferences and sync with your dashboard settings</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default MobileIntegration;