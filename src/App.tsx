import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppErrorBoundary } from "@/components/errors/ErrorBoundary";
import StartupSplash from "@/components/StartupSplash";
import { appRouter } from "@/sys/router";
import "@/lib/errorReporter";
import "@/utils/keyboardNavigation";

const queryClient = new QueryClient();

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {import.meta.env.VITE_SPLASH_ENABLED !== "false" && <StartupSplash />}
          <AppErrorBoundary>
            <RouterProvider router={appRouter} fallbackElement={<div>Loading…</div>} />
          </AppErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
