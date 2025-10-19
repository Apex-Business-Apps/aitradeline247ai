import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Download, MessageSquare, BarChart3 } from 'lucide-react';

const actions = [
  {
    title: 'Configure AI',
    description: 'Customize your AI receptionist settings',
    icon: Settings,
    variant: 'default' as const
  },
  {
    title: 'View Reports',
    description: 'Download detailed analytics',
    icon: BarChart3,
    variant: 'secondary' as const
  },
  {
    title: 'Export Data',
    description: 'Download call logs and transcripts',
    icon: Download,
    variant: 'outline' as const
  },
  {
    title: 'Live Chat',
    description: 'Chat with our support team',
    icon: MessageSquare,
    variant: 'outline' as const
  }
];

export const QuickActions: React.FC = () => {
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
        <CardTitle className="text-lg font-bold text-foreground tracking-tight">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        {actions.map((action, index) => (
          <button
            key={action.title}
            className="group w-full h-auto p-4 justify-start min-h-[4rem] touch-manipulation text-left rounded-2xl bg-gradient-to-r from-muted/10 to-muted/5 hover:from-primary/5 hover:to-primary/10 border border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-[var(--premium-shadow-subtle)] hover:-translate-y-0.5 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/15 group-hover:to-primary/8 transition-all duration-300">
                <action.icon className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors duration-300" />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="font-semibold text-base text-foreground group-hover:text-primary/90 transition-colors duration-300 truncate mb-1">
                  {action.title}
                </div>
                <div className="text-sm text-muted-foreground/70 line-clamp-2 leading-relaxed">
                  {action.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
};
