import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const WelcomeHeader: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const currentTime = new Date().getHours();
  
  useEffect(() => {
    async function fetchUserName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else {
          setUserName(user.email?.split('@')[0] || 'there');
        }
      }
    }
    fetchUserName();
  }, []);
  
  const getGreeting = () => {
    if (currentTime < 12) return "Good morning";
    if (currentTime < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="space-y-4" data-testid="welcome-header">
      {/* Greeting and Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your AI receptionist is working hard for you today
          </p>
        </div>
        
        {/* Quick Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-9 w-9 hover:bg-accent"
            data-testid="home-button"
            aria-label="Go to homepage"
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-accent"
            data-testid="settings-button"
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-muted-foreground">AI receptionist is active</span>
      </div>
    </header>
  );
};