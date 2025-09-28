import DemoSpotlight from "./DemoSpotlight";
import { CallSummary } from "@/components/dashboard/CallSummary";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { IntegrationsGrid } from "@/components/dashboard/IntegrationsGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TwilioStats } from "@/components/dashboard/TwilioStats";
import KpiRibbon from "./KpiRibbon";
import HealthWidget from "./HealthWidget";
import OnboardingChecklist from "@/features/checklist/OnboardingChecklist";
import SavedViews from "@/features/views/SavedViews";
import { useDashboardLayout } from "./hooks/useDashboardLayout";

interface DashboardProps {
  demoMode?: boolean;
}

export default function Dashboard({ demoMode = false }: DashboardProps) {
  const { layout, getCurrentLayout } = useDashboardLayout();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Demo spotlight overlay */}
      {demoMode && <DemoSpotlight rect={null} />}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" data-demo="dashboard-header">Dashboard</h1>
        <SavedViews 
          kind="dashboard" 
          currentState={getCurrentLayout()}
          onLoadView={(payload) => console.log('Load layout:', payload)}
        />
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* KPI Ribbon */}
      <KpiRibbon />

      {/* Health Widget */}
      <HealthWidget />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2" data-demo="missed-calls">
          <CallSummary />
        </div>

        <div data-demo="callbacks">
          <QuickActions />
        </div>

        <div data-demo="analytics">
          <DashboardStats />
        </div>

        <div data-demo="settings">
          <TwilioStats />
        </div>

        <div data-demo="test-call">
          <RecentActivity />
        </div>

        <div className="md:col-span-3" data-demo="integrations">
          <IntegrationsGrid />
        </div>
      </div>
    </div>
  );
}