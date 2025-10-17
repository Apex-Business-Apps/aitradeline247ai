import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import LayoutCanon from "@/components/LayoutCanon";
import { AnalyticsTracker } from "@/components/sections/AnalyticsTracker";
import { WebVitalsTracker } from "@/components/monitoring/WebVitalsTracker";
import { WebVitalsReporter } from "@/components/monitoring/WebVitalsReporter";
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { TwilioLinkGuard } from "@/components/TwilioLinkGuard";
import { CanonicalRedirect } from "@/components/CanonicalRedirect";
import { PreviewDiagnostics } from "@/components/dev/PreviewDiagnostics";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { MiniChat } from "@/components/ui/MiniChat";
import { SmokeChecks } from "@/components/testing/SmokeChecks";
import { RagSearchFab } from "@/components/rag/RagSearchFab";
import { RagSearchDrawer } from "@/components/rag/RagSearchDrawer";
import { useSessionSecurity } from "@/hooks/useSessionSecurity";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import ThankYou from "@/pages/ThankYou";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import Demo from "@/pages/Demo";
import Security from "@/pages/Security";
import Compare from "@/pages/Compare";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import DesignTokens from "@/pages/DesignTokens";
import ClientDashboard from "@/pages/ClientDashboard";
import CRMIntegration from "@/pages/integrations/CRMIntegration";
import EmailIntegration from "@/pages/integrations/EmailIntegration";
import PhoneIntegration from "@/pages/integrations/PhoneIntegration";
import MessagingIntegration from "@/pages/integrations/MessagingIntegration";
import MobileIntegration from "@/pages/integrations/MobileIntegration";
import AutomationIntegration from "@/pages/integrations/AutomationIntegration";
import CallCenter from "@/pages/CallCenter";
import CallLogs from "@/pages/CallLogs";
import PhoneApps from "@/pages/PhoneApps";
import SMSDeliveryDashboard from "@/pages/SMSDeliveryDashboard";
import AdminKB from "@/pages/AdminKB";
import CampaignManager from "@/pages/CampaignManager";
import CryptoInit from "@/pages/ops/CryptoInit";
import Activation from "@/pages/ops/Activation";
import VoiceSettings from "@/pages/ops/VoiceSettings";
import TwilioWire from "@/pages/ops/TwilioWire";
import StagingTest from "@/pages/ops/StagingTest";
import VoiceHealth from "@/pages/ops/VoiceHealth";
import MessagingHealth from "@/pages/ops/MessagingHealth";
import ClientNumberOnboarding from "@/pages/ops/ClientNumberOnboarding";
import TwilioEvidence from "@/pages/ops/TwilioEvidence";
import NotFound from "./NotFound";

const withMain = (node: ReactNode) => <main id="main">{node}</main>;

const AppLayout = () => {
  useSessionSecurity();
  const [ragDrawerOpen, setRagDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setRagDrawerOpen((prev) => !prev);
      }
      if (e.key === "Escape" && ragDrawerOpen) {
        setRagDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ragDrawerOpen]);

  return (
    <>
      <CanonicalRedirect />
      <SecurityMonitor />
      <AnalyticsTracker />
      <WebVitalsTracker />
      <WebVitalsReporter />
      <LayoutCanon />
      <SmokeChecks />
      <TwilioLinkGuard />
      <Outlet />
      <InstallPrompt />
      <MiniChat />
      <RagSearchFab onClick={() => setRagDrawerOpen(true)} />
      <RagSearchDrawer open={ragDrawerOpen} onOpenChange={setRagDrawerOpen} />
      <PreviewDiagnostics />
    </>
  );
};

export const appRouter = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      errorElement: <NotFound />,
      children: [
        { index: true, element: withMain(<Index />) },
        { path: "auth", element: withMain(<Auth />) },
        { path: "thank-you", element: withMain(<ThankYou />) },
        { path: "signup", element: <Navigate to="/auth" replace /> },
        { path: "features", element: withMain(<Features />) },
        { path: "pricing", element: withMain(<Pricing />) },
        { path: "faq", element: withMain(<FAQ />) },
        { path: "contact", element: withMain(<Contact />) },
        { path: "demo", element: withMain(<Demo />) },
        { path: "security", element: withMain(<Security />) },
        { path: "compare", element: withMain(<Compare />) },
        { path: "privacy", element: withMain(<Privacy />) },
        { path: "terms", element: withMain(<Terms />) },
        { path: "design-tokens", element: withMain(<DesignTokens />) },
        { path: "dashboard", element: withMain(<ClientDashboard />) },
        { path: "dashboard/integrations/crm", element: withMain(<CRMIntegration />) },
        { path: "dashboard/integrations/email", element: withMain(<EmailIntegration />) },
        { path: "dashboard/integrations/phone", element: withMain(<PhoneIntegration />) },
        { path: "dashboard/integrations/messaging", element: withMain(<MessagingIntegration />) },
        { path: "dashboard/integrations/mobile", element: withMain(<MobileIntegration />) },
        { path: "dashboard/integrations/automation", element: withMain(<AutomationIntegration />) },
        { path: "call-center", element: withMain(<CallCenter />) },
        { path: "calls", element: withMain(<CallLogs />) },
        { path: "phone-apps", element: withMain(<PhoneApps />) },
        { path: "sms-delivery", element: withMain(<SMSDeliveryDashboard />) },
        { path: "admin/kb", element: withMain(<AdminKB />) },
        { path: "admin/campaigns", element: withMain(<CampaignManager />) },
        { path: "ops/crypto/init", element: withMain(<CryptoInit />) },
        { path: "ops/activation", element: withMain(<Activation />) },
        { path: "ops/voice", element: withMain(<VoiceSettings />) },
        { path: "ops/twilio/wire", element: withMain(<TwilioWire />) },
        { path: "ops/staging-test", element: withMain(<StagingTest />) },
        { path: "ops/voice-health", element: withMain(<VoiceHealth />) },
        { path: "ops/messaging-health", element: withMain(<MessagingHealth />) },
        { path: "ops/numbers/onboard", element: withMain(<ClientNumberOnboarding />) },
        { path: "ops/twilio-evidence", element: withMain(<TwilioEvidence />) },
        { path: "*", element: withMain(<NotFound />) },
      ],
    },
  ],
  {
    basename: "/",
  }
);
