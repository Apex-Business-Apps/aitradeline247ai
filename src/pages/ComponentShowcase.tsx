import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { KpiCard } from '@/components/dashboard/components/KpiCard';
import { SparklineCard } from '@/components/dashboard/components/SparklineCard';
import { NextItemRow } from '@/components/dashboard/components/NextItemRow';
import { TranscriptRow } from '@/components/dashboard/components/TranscriptRow';
import { QuickAction } from '@/components/dashboard/components/QuickAction';
import { AnnouncementCard } from '@/components/dashboard/components/AnnouncementCard';
import { DollarSign, Calendar, Phone, TrendingUp, Settings, BarChart3, Download, MessageSquare } from 'lucide-react';

// Import mock data and types
import kpiData from '@/mocks/dashboard/kpis.json';
import nextItemsData from '@/mocks/dashboard/next-items.json';
import transcriptData from '@/mocks/dashboard/transcripts.json';
import { Kpi, NextItem, Transcript } from '@/types/dashboard';

const ComponentShowcase: React.FC = () => {
  // Sample sparkline data
  const sparklineData = [
    { value: 120, label: 'Mon' },
    { value: 140, label: 'Tue' },
    { value: 110, label: 'Wed' },
    { value: 180, label: 'Thu' },
    { value: 165, label: 'Fri' },
    { value: 190, label: 'Sat' },
    { value: 175, label: 'Sun' }
  ];

  // Sample quick actions
  const quickActions = [
    {
      id: 'configure',
      title: 'Configure AI',
      description: 'Adjust response settings and personality',
      icon: 'Settings',
      variant: 'outline' as const
    },
    {
      id: 'reports',
      title: 'View Reports',
      description: 'Analytics and performance insights',
      icon: 'BarChart3',
      variant: 'outline' as const
    },
    {
      id: 'export',
      title: 'Export Data',
      description: 'Download call logs and transcripts',
      icon: 'Download',
      variant: 'outline' as const
    }
  ];

  // Sample announcements
  const announcements = [
    {
      id: 'info_1', 
      title: 'New Feature Available',
      message: 'Voice recognition has been upgraded for better accuracy. Your calls will now be transcribed with 95% accuracy.',
      type: 'info' as const,
      dismissible: true,
      actionText: 'Learn More',
      actionUrl: '/features'
    },
    {
      id: 'success_1',
      title: 'Integration Complete', 
      message: 'Your CRM is now connected and syncing leads automatically.',
      type: 'success' as const,
      dismissible: true
    },
    {
      id: 'warning_1',
      title: 'Payment Method Expiring',
      message: 'Your credit card expires next month. Update your billing information to avoid service interruption.',
      type: 'warning' as const,
      dismissible: true,
      actionText: 'Update Billing',
      actionUrl: '/billing'
    }
  ];

  const handleAction = (itemId: string, action: string) => {
    console.log(`Action: ${action} on item: ${itemId}`);
  };

  const handleQuickAction = (actionId: string) => {
    console.log(`Quick action: ${actionId}`);
  };

  const handleReply = (transcriptId: string) => {
    console.log(`Reply to transcript: ${transcriptId}`);
  };

  const handleAnnouncementDismiss = (announcementId: string) => {
    console.log(`Dismissed announcement: ${announcementId}`);
  };

  const handleAnnouncementAction = (announcementId: string, actionUrl?: string) => {
    console.log(`Announcement action: ${announcementId}, URL: ${actionUrl}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Component Showcase</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Phase 3 reusable components with typed data contracts and mock fixtures
            </p>
          </div>

          {/* KPI Cards */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">KPI Cards</h2>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <KpiCard
                kpi={kpiData[0] as Kpi}
                title="Bookings this week"
                subtitle="new appointments"
                icon={Calendar}
                color="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-50 dark:bg-blue-900/20"
                ariaLabel="47 bookings this week, up 12%"
                trend="+12%"
              />
              <KpiCard
                kpi={kpiData[1] as Kpi}
                title="Expected payout"
                subtitle="Paid out on Dec 15"
                icon={DollarSign}
                color="text-green-600 dark:text-green-400"
                bgColor="bg-green-50 dark:bg-green-900/20"
                ariaLabel="Expected payout $3,240, paid out on December 15th"
              />
              <KpiCard
                kpi={kpiData[2] as Kpi}
                title="Calls we caught"
                subtitle="response rate"
                icon={Phone}
                color="text-primary"
                bgColor="bg-primary/10"
                ariaLabel="94% calls we caught, up 8% vs last week"
                trend="Up vs last week +8%"
              />
              <KpiCard
                kpi={kpiData[3] as Kpi}
                title="Missed but saved"
                subtitle="became bookings"
                icon={TrendingUp}
                color="text-purple-600 dark:text-purple-400"
                bgColor="bg-purple-50 dark:bg-purple-900/20"
                ariaLabel="8 missed calls but saved, became bookings"
                badge="rescued"
              />
            </div>
          </section>

          {/* Sparkline Cards */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Sparkline Cards</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <SparklineCard
                title="Weekly Bookings"
                data={sparklineData}
                currentValue="47"
                trend="+12%"
                trendType="positive"
              />
              <SparklineCard
                title="Response Time"
                data={sparklineData.map(d => ({ ...d, value: d.value * 0.01 }))}
                currentValue="1.2s"
                trend="-8.3%"
                trendType="positive"
              />
              <SparklineCard
                title="Conversion Rate"
                data={sparklineData.map(d => ({ ...d, value: d.value * 0.4 }))}
                currentValue="68.4%"
                trend="+4.2%"
                trendType="positive"
              />
            </div>
          </section>

          {/* Next Item Rows */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Next Item Rows</h2>
            <div className="space-y-3 max-w-4xl">
              {nextItemsData.map((item) => (
                <NextItemRow
                  key={item.id}
                  item={item as NextItem}
                  onAction={handleAction}
                />
              ))}
            </div>
          </section>

          {/* Transcript Rows */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Transcript Rows</h2>
            <div className="space-y-3 max-w-4xl">
              {transcriptData.map((transcript) => (
                <TranscriptRow
                  key={transcript.id}
                  transcript={transcript as Transcript}
                  onReply={handleReply}
                />
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Quick Actions</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
              <QuickAction
                action={quickActions[0]}
                icon={Settings}
                onClick={handleQuickAction}
              />
              <QuickAction
                action={quickActions[1]}
                icon={BarChart3}
                onClick={handleQuickAction}
              />
              <QuickAction
                action={quickActions[2]}
                icon={Download}
                onClick={handleQuickAction}
              />
            </div>
          </section>

          {/* Announcement Cards */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Announcement Cards</h2>
            <div className="space-y-4 max-w-4xl">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onDismiss={handleAnnouncementDismiss}
                  onAction={handleAnnouncementAction}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ComponentShowcase;