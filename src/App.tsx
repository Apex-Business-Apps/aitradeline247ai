import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnalyticsTracker } from "@/components/sections/AnalyticsTracker";
import { WebVitalsTracker } from "@/components/monitoring/WebVitalsTracker";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { HelmetProvider } from 'react-helmet-async';
import { useErrorTracking } from "@/hooks/useErrorTracking";
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

const queryClient = new QueryClient();

// App monitoring wrapper component
const AppWithMonitoring = () => {
  // Initialize error tracking
  useErrorTracking();

  return (
    <>
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
        <Route path="/components" element={<main id="main"><ComponentShowcase /></main>} />
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
