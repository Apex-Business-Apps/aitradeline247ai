import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { EnhancedSecurityHeaders } from "@/components/security/EnhancedSecurityHeaders";
import { useSessionSecurity } from "@/hooks/useSessionSecurity";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnalyticsTracker } from "@/components/sections/AnalyticsTracker";
import { WebVitalsTracker } from "@/components/monitoring/WebVitalsTracker";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { HelmetProvider } from 'react-helmet-async';
import { useErrorTracking } from "@/hooks/useErrorTracking";
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { MiniChat } from "@/components/ui/MiniChat";
import useKlaviyoPageview from "@/hooks/useKlaviyoPageview";
import { setSEO } from "@/lib/seo";
import { useEffect } from "react";
import "@/utils/keyboardNavigation"; // Initialize keyboard navigation utilities
import StartupSplash from "@/components/StartupSplash";
import Index from "./pages/Index";
import DesignTokens from "./pages/DesignTokens";
import ClientDashboard from "./pages/ClientDashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import CRMIntegration from "./pages/integrations/CRMIntegration";
import EmailIntegration from "./pages/integrations/EmailIntegration";
import PhoneIntegration from "./pages/integrations/PhoneIntegration";
import MessagingIntegration from "./pages/integrations/MessagingIntegration";
import MobileIntegration from "./pages/integrations/MobileIntegration";
import AutomationIntegration from "./pages/integrations/AutomationIntegration";
import ComponentShowcase from "./pages/ComponentShowcase";
import CallCenter from "./pages/CallCenter";
import AdminKB from "./pages/AdminKB";
import TelephonyQA from "./pages/qa/Telephony";
import Dashboard from "./pages/qa/Dashboard";
import SEOQA from "./pages/qa/SEO";
import PWAQA from "./pages/qa/PWA";

const queryClient = new QueryClient();

// Fallback SEO component
function RouteSEOFallback() {
  const { pathname } = useLocation();
  useEffect(() => {
    setSEO({
      title: "TradeLine 24/7 — Your 24/7 AI Receptionist",
      description: "Recover missed calls and bookings with an AI receptionist built for trades & local businesses.",
      path: pathname || "/",
    });
  }, [pathname]);
  return null;
}

// App monitoring wrapper component
const AppWithMonitoring = () => {
  // Initialize error tracking
  useErrorTracking();
  
  // Initialize session security monitoring
  useSessionSecurity();
  
  // Initialize performance optimization
  const { measureRenderTime } = usePerformanceOptimization();
  
  // Initialize Klaviyo pageview tracking
  useKlaviyoPageview();

  return (
    <>
      <RouteSEOFallback />
      <SecurityHeaders />
      <EnhancedSecurityHeaders />
      <SecurityMonitor />
      <AnalyticsTracker />
      <WebVitalsTracker />
      <Routes>
        <Route path="/" element={<main id="main"><Index /></main>} />
        <Route path="/auth" element={<main id="main"><Auth /></main>} />
        <Route path="/features" element={<main id="main"><Features /></main>} />
        <Route path="/pricing" element={<main id="main"><Pricing /></main>} />
        <Route path="/faq" element={<main id="main"><FAQ /></main>} />
        <Route path="/contact" element={<main id="main"><Contact /></main>} />
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
        <Route path="/components" element={<main id="main"><ComponentShowcase /></main>} />
        <Route path="/admin/kb" element={<main id="main"><AdminKB /></main>} />
        <Route path="/qa/telephony" element={<main id="main"><TelephonyQA /></main>} />
        <Route path="/qa/dashboard" element={<main id="main"><Dashboard /></main>} />
        <Route path="/qa/seo" element={<main id="main"><SEOQA /></main>} />
        <Route path="/qa/pwa" element={<main id="main"><PWAQA /></main>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<main id="main"><NotFound /></main>} />
      </Routes>
    </>
  );
};


const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {import.meta.env.VITE_SPLASH_ENABLED !== "false" && <StartupSplash />}
        <BrowserRouter>
          <AppWithMonitoring />
          <InstallPrompt />
          <MiniChat />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
