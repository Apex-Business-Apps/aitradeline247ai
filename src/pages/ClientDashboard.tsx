import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { NewDashboard } from '@/components/dashboard/NewDashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { error, lastUpdated, refresh } = useDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          </div>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Error Banner */}
        {error && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-yellow-800 dark:text-yellow-300">{error}</span>
              <Button 
                onClick={refresh}
                variant="outline" 
                size="sm"
                className="ml-4 h-auto px-3 py-1 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Last Updated Info */}
        {lastUpdated && (
          <div className="text-xs text-muted-foreground mb-6 text-center">
            {lastUpdated}
          </div>
        )}

        <NewDashboard />
      </main>

      <Footer />
    </div>
  );
};

export default ClientDashboard;
