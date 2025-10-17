import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./AppShell";
import NotFoundBoundary from "./NotFound";
import Index from "@/pages/Index";
import DesignTokens from "@/pages/DesignTokens";
import ClientDashboard from "@/pages/ClientDashboard";
import Auth from "@/pages/Auth";
import ThankYou from "@/pages/ThankYou";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Demo from "@/pages/Demo";
import Security from "@/pages/Security";
import Compare from "@/pages/Compare";
import CRMIntegration from "@/pages/integrations/CRMIntegration";
import EmailIntegration from "@/pages/integrations/EmailIntegration";
import PhoneIntegration from "@/pages/integrations/PhoneIntegration";
import MessagingIntegration from "@/pages/integrations/MessagingIntegration";
import MobileIntegration from "@/pages/integrations/MobileIntegration";
import AutomationIntegration from "@/pages/integrations/AutomationIntegration";
import CallCenter from "@/pages/CallCenter";
import SMSDeliveryDashboard from "@/pages/SMSDeliveryDashboard";
import AdminKB from "@/pages/AdminKB";
import CampaignManager from "@/pages/CampaignManager";
import CryptoInit from "@/pages/ops/CryptoInit";
import Activation from "@/pages/ops/Activation";
import VoiceSettings from "@/pages/ops/VoiceSettings";
import TwilioWire from "@/pages/ops/TwilioWire";
import StagingTest from "@/pages/ops/StagingTest";
import VoiceHealth from "@/pages/ops/VoiceHealth";
import CallLogs from "@/pages/CallLogs";
import PhoneApps from "@/pages/PhoneApps";
import ClientNumberOnboarding from "@/pages/ops/ClientNumberOnboarding";
import TwilioEvidence from "@/pages/ops/TwilioEvidence";
import MessagingHealth from "@/pages/ops/MessagingHealth";
import LegacyNotFound from "@/pages/NotFound";

const withMain = (node: JSX.Element) => <main id="main">{node}</main>;

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppShell />,
      errorElement: <NotFoundBoundary />,
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
        { path: "*", element: withMain(<LegacyNotFound />) },
      ],
    },
  ],
  { basename: "/" }
);
