import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnalyticsTracker } from "@/components/sections/AnalyticsTracker";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/design-tokens" element={<DesignTokens />} />
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/dashboard/integrations/crm" element={<CRMIntegration />} />
          <Route path="/dashboard/integrations/email" element={<EmailIntegration />} />
          <Route path="/dashboard/integrations/phone" element={<PhoneIntegration />} />
          <Route path="/dashboard/integrations/messaging" element={<MessagingIntegration />} />
          <Route path="/dashboard/integrations/mobile" element={<MobileIntegration />} />
          <Route path="/dashboard/integrations/automation" element={<AutomationIntegration />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
