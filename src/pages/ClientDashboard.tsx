import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CallSummary } from '@/components/dashboard/CallSummary';
import { IntegrationsGrid } from '@/components/dashboard/IntegrationsGrid';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-4 px-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Page Header with Home Button */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Client Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor your AI receptionist performance and manage your account
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>

        {/* Dashboard Grid - Mobile Optimized */}
        <div className="space-y-6">
          {/* Stats Section */}
          <DashboardStats />

          {/* Integrations Section */}
          <IntegrationsGrid />

          {/* Action Cards - Stack on mobile */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickActions />
            <CallSummary />
            <div className="sm:col-span-2 lg:col-span-1">
              <RecentActivity />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ClientDashboard;