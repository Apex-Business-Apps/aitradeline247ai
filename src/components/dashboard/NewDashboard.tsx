import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WinsSection } from '@/components/dashboard/new/WinsSection';
import { NextActionsSection } from '@/components/dashboard/new/NextActionsSection';
import { WelcomeHeader } from '@/components/dashboard/new/WelcomeHeader';

const NEW_DASHBOARD_ENABLED = process.env.NEW_DASHBOARD === 'true';

interface NewDashboardProps {
  children?: React.ReactNode;
}

export const NewDashboard: React.FC<NewDashboardProps> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const forceNewDashboard = searchParams.get('new_dashboard') === '1';
  
  // Feature flag guard
  if (!NEW_DASHBOARD_ENABLED && !forceNewDashboard) {
    return <>{children}</>;
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-background"
      data-testid="new-dashboard-container"
    >
      <Header />
      
      <main className="flex-1 px-4 py-6 space-y-8 max-w-7xl mx-auto w-full">
        <WelcomeHeader />
        <WinsSection />
        <NextActionsSection />
      </main>
      
      <Footer />
    </div>
  );
};