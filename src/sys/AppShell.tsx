import { Outlet } from "react-router-dom";
import { AnalyticsTracker } from "@/components/sections/AnalyticsTracker";
import { WebVitalsTracker } from "@/components/monitoring/WebVitalsTracker";
import { WebVitalsReporter } from "@/components/monitoring/WebVitalsReporter";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { MiniChat } from "@/components/ui/MiniChat";
import { TwilioLinkGuard } from "@/components/TwilioLinkGuard";
import { CanonicalRedirect } from "@/components/CanonicalRedirect";
import { PreviewDiagnostics } from "@/components/dev/PreviewDiagnostics";
import { SmokeChecks } from "@/components/testing/SmokeChecks";
import LayoutCanon from "@/components/LayoutCanon";
import { useSessionSecurity } from "@/hooks/useSessionSecurity";

export function AppShell() {
  useSessionSecurity();

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
      <PreviewDiagnostics />
    </>
  );
}
