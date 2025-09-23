import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Mail, 
  Users, 
  MessageSquare, 
  ExternalLink,
  Zap,
  Phone,
  Database
} from 'lucide-react';

const integrations = [
  {
    id: 'crm',
    title: 'CRM Software',
    description: 'Connect to Salesforce, HubSpot, Pipedrive, and more',
    icon: Database,
    status: 'available',
    route: '/dashboard/integrations/crm',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  {
    id: 'email',
    title: 'Email Apps',
    description: 'Gmail, Outlook, Apple Mail integration',
    icon: Mail,
    status: 'available',
    route: '/dashboard/integrations/email',
    color: 'bg-green-500/10 text-green-600 border-green-500/20'
  },
  {
    id: 'phone',
    title: 'Phone & SMS',
    description: 'Native phone and messaging for iOS & Android',
    icon: Phone,
    status: 'available',
    route: '/dashboard/integrations/phone',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  },
  {
    id: 'messaging',
    title: 'Messaging Apps',
    description: 'WhatsApp, Telegram, Slack, Teams',
    icon: MessageSquare,
    status: 'available',
    route: '/dashboard/integrations/messaging',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
  },
  {
    id: 'mobile',
    title: 'Mobile Apps',
    description: 'iOS and Android native app integrations',
    icon: Smartphone,
    status: 'available',
    route: '/dashboard/integrations/mobile',
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
  },
  {
    id: 'automation',
    title: 'Automation',
    description: 'Zapier, IFTTT, Microsoft Power Automate',
    icon: Zap,
    status: 'available',
    route: '/dashboard/integrations/automation',
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'connected':
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Connected</Badge>;
    case 'available':
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Available</Badge>;
    case 'coming-soon':
      return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Coming Soon</Badge>;
    default:
      return null;
  }
};

export const IntegrationsGrid: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card 
      className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm"
      style={{ 
        boxShadow: 'var(--premium-shadow-subtle)',
        background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.6) 100%)',
        border: '1px solid hsl(var(--premium-border))'
      }}
    >
      {/* Premium Glass Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
            <ExternalLink className="h-5 w-5 text-primary/70" />
          </div>
          <span>One-Click Integrations</span>
        </CardTitle>
        <p className="text-muted-foreground/80">
          Connect seamlessly to your favorite apps and services
        </p>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration, index) => (
            <button
              key={integration.id}
              onClick={() => navigate(integration.route)}
              className="group p-4 rounded-2xl bg-gradient-to-r from-muted/10 to-muted/5 hover:from-primary/5 hover:to-primary/10 border border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-[var(--premium-shadow-subtle)] hover:-translate-y-0.5 animate-fade-in text-left"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${integration.color} group-hover:scale-110 transition-transform duration-300`}>
                  <integration.icon className="h-5 w-5" />
                </div>
                {getStatusBadge(integration.status)}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground group-hover:text-primary/90 transition-colors">
                  {integration.title}
                </h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">
                  {integration.description}
                </p>
              </div>
              
              <div className="mt-3 pt-3 border-t border-muted/20">
                <div className="flex items-center text-xs text-muted-foreground/60 group-hover:text-primary/70 transition-colors">
                  <span>Click to configure</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};