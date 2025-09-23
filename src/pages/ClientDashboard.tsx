import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CallSummary } from '@/components/dashboard/CallSummary';

const ClientDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-6 space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Client Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor your AI receptionist performance and manage your account
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Stats Section - Full width on mobile, spans 2 cols on lg */}
          <div className="md:col-span-2 lg:col-span-3">
            <DashboardStats />
          </div>

          {/* Quick Actions */}
          <div className="md:col-span-1 lg:col-span-1">
            <QuickActions />
          </div>

          {/* Call Summary */}
          <div className="md:col-span-1 lg:col-span-1">
            <CallSummary />
          </div>

          {/* Recent Activity - Full width */}
          <div className="md:col-span-2 lg:col-span-1">
            <RecentActivity />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ClientDashboard;