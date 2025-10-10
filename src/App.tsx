import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useSessionSecurity } from "@/hooks/useSessionSecurity";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnalyticsTracker } from "@/components/sections/AnalyticsTracker";
import { WebVitalsTracker } from "@/components/monitoring/WebVitalsTracker";
import { WebVitalsReporter } from "@/components/monitoring/WebVitalsReporter";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { HelmetProvider } from 'react-helmet-async';
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { MiniChat } from "@/components/ui/MiniChat";
import { AppErrorBoundary } from '@/components/errors/ErrorBoundary';
import { SmokeChecks } from '@/components/testing/SmokeChecks';
import { RagSearchFab } from "@/components/rag/RagSearchFab";
import { RagSearchDrawer } from "@/components/rag/RagSearchDrawer";
import { TwilioLinkGuard } from "@/components/TwilioLinkGuard";
import { useAuth } from "@/hooks/useAuth";

import "@/utils/keyboardNavigation"; // Initialize keyboard navigation utilities
import StartupSplash from "@/components/StartupSplash";
import LayoutCanon from "@/components/LayoutCanon";
import Index from "./pages/Index";
import DesignTokens from "./pages/DesignTokens";
import ClientDashboard from "./pages/ClientDashboard";
import Auth from "./pages/Auth";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Demo from "./pages/Demo";
import Security from "./pages/Security";
import Compare from "./pages/Compare";
import CRMIntegration from "./pages/integrations/CRMIntegration";
import EmailIntegration from "./pages/integrations/EmailIntegration";
import PhoneIntegration from "./pages/integrations/PhoneIntegration";
import MessagingIntegration from "./pages/integrations/MessagingIntegration";
import MobileIntegration from "./pages/integrations/MobileIntegration";
import AutomationIntegration from "./pages/integrations/AutomationIntegration";
import CallCenter from "./pages/CallCenter";
import SMSDeliveryDashboard from "./pages/SMSDeliveryDashboard";
import AdminKB from "./pages/AdminKB";
import CampaignManager from "./pages/CampaignManager";
import CryptoInit from "./pages/ops/CryptoInit";
import Activation from "./pages/ops/Activation";
import VoiceSettings from "./pages/ops/VoiceSettings";
import BusinessProfile from "./pages/ops/BusinessProfile";
import VoiceDryRun from "./pages/ops/VoiceDryRun";
import TwilioWire from "./pages/ops/TwilioWire";
import StagingTest from "./pages/ops/StagingTest";
import VoiceHealth from "./pages/ops/VoiceHealth";
import CallLogs from "./pages/CallLogs";
import PhoneApps from "./pages/PhoneApps";
import NumberOnboarding from "./pages/ops/NumberOnboarding";
import TwilioEvidence from "./pages/ops/TwilioEvidence";
import MessagingHealth from "./pages/ops/MessagingHealth";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";

// Lazy load admin-only pages
const NumberOnboard = React.lazy(() => import("./pages/onboarding/NumberOnboard"));


const queryClient = new QueryClient();

// Minimal admin guard component
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAdmin()) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// App monitoring wrapper component
const AppWithMonitoring = () => {
  // Initialize session security monitoring
  useSessionSecurity();

  return (
    <>
      <SecurityMonitor />
      <AnalyticsTracker />
      <WebVitalsTracker />
      <WebVitalsReporter />
      <LayoutCanon />
      <SmokeChecks />
      <TwilioLinkGuard />
      <Routes>
        <Route path="/" element={<main id="main"><Index /></main>} />
        <Route path="/auth" element={<main id="main"><Auth /></main>} />
        <Route path="/thank-you" element={<main id="main"><ThankYou /></main>} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/features" element={<main id="main"><Features /></main>} />
        <Route path="/pricing" element={<main id="main"><Pricing /></main>} />
        <Route path="/faq" element={<main id="main"><FAQ /></main>} />
        <Route path="/contact" element={<main id="main"><Contact /></main>} />
        <Route path="/demo" element={<main id="main"><Demo /></main>} />
        <Route path="/security" element={<main id="main"><Security /></main>} />
        <Route path="/compare" element={<main id="main"><Compare /></main>} />
        <Route path="/privacy" element={<main id="main"><Privacy /></main>} />
        <Route path="/terms" element={<main id="main"><Terms /></main>} />
        <Route path="/design-tokens" element={<main id="main"><DesignTokens /></main>} />
        <Route path="/dashboard" element={<main id="main"><ClientDashboard /></main>} />
        <Route path="/dashboard/integrations/crm" element={<main id="main"><CRMIntegration /></main>} />
        <Route path="/dashboard/integrations/email" element={<main id="main"><EmailIntegration /></main>} />
        <Route path="/dashboard/integrations/phone" element={<main id="main"><PhoneIntegration /></main>} />
        <Route path="/dashboard/integrations/messaging" element={<main id="main"><MessagingIntegration /></main>} />
        <Route path="/dashboard/integrations/mobile" element={<main id="main"><MobileIntegration /></main>} />
        <Route path="/dashboard/integrations/automation" element={<main id="main"><AutomationIntegration /></main>} />
        <Route path="/call-center" element={<main id="main"><CallCenter /></main>} />
        <Route path="/calls" element={<main id="main"><CallLogs /></main>} />
        <Route path="/phone-apps" element={<main id="main"><PhoneApps /></main>} />
        <Route path="/sms-delivery" element={<main id="main"><SMSDeliveryDashboard /></main>} />
        <Route path="/admin/kb" element={<main id="main"><AdminKB /></main>} />
        <Route path="/admin/campaigns" element={<main id="main"><CampaignManager /></main>} />
        <Route path="/ops/crypto/init" element={<main id="main"><CryptoInit /></main>} />
        <Route path="/ops/activation" element={<main id="main"><Activation /></main>} />
        <Route path="/ops/voice" element={<main id="main"><VoiceSettings /></main>} />
        <Route path="/ops/business-profile" element={<main id="main"><BusinessProfile /></main>} />
        <Route path="/ops/voice-dryrun" element={<main id="main"><VoiceDryRun /></main>} />
        <Route path="/ops/twilio/wire" element={<main id="main"><TwilioWire /></main>} />
        <Route path="/ops/staging-test" element={<main id="main"><StagingTest /></main>} />
        <Route path="/ops/voice-health" element={<main id="main"><VoiceHealth /></main>} />
        <Route path="/ops/messaging-health" element={<main id="main"><MessagingHealth /></main>} />
        <Route path="/ops/number-onboarding" element={<main id="main"><NumberOnboarding /></main>} />
        <Route path="/onboarding/number" element={<Navigate to="/ops/numbers/onboard" replace />} />
        <Route path="/ops/numbers/onboard" element={
          <main id="main">
            <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
              <RequireAdmin>
                <NumberOnboard />
              </RequireAdmin>
            </React.Suspense>
          </main>
        } />
        <Route path="/ops/twilio-evidence" element={<main id="main"><TwilioEvidence /></main>} />
        <Route path="/admin/knowledge-base" element={<main id="main"><AdminKnowledgeBase /></main>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<main id="main"><NotFound /></main>} />
      </Routes>
    </>
  );
};


const App = () => {
  const [ragDrawerOpen, setRagDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setRagDrawerOpen(prev => !prev);
      }
      if (e.key === 'Escape' && ragDrawerOpen) {
        setRagDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ragDrawerOpen]);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {import.meta.env.VITE_SPLASH_ENABLED !== "false" && <StartupSplash />}
          <AppErrorBoundary>
            <BrowserRouter basename="/">
              <AppWithMonitoring />
              <InstallPrompt />
              <MiniChat />
              <RagSearchFab onClick={() => setRagDrawerOpen(true)} />
              <RagSearchDrawer open={ragDrawerOpen} onOpenChange={setRagDrawerOpen} />
            </BrowserRouter>
          </AppErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
