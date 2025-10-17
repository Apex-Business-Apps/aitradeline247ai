import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { AppErrorBoundary } from "@/components/errors/ErrorBoundary";
import { RagSearchFab } from "@/components/rag/RagSearchFab";
import { RagSearchDrawer } from "@/components/rag/RagSearchDrawer";
import StartupSplash from "@/components/StartupSplash";
import { RouterProvider } from "react-router-dom";
import { router } from "@/sys/router";

import "@/lib/errorReporter"; // Initialize global error tracking
import "@/utils/keyboardNavigation"; // Initialize keyboard navigation utilities

const queryClient = new QueryClient();

const routerFallback = (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
    <div className="space-y-2 text-center">
      <p className="text-sm font-medium text-muted-foreground">Loading experience…</p>
      <p className="text-lg font-semibold">Preparing TradeLine 24/7 for you.</p>
    </div>
  </div>
);

const App = () => {
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
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {import.meta.env.VITE_SPLASH_ENABLED !== "false" && <StartupSplash />}
          <AppErrorBoundary>
            <>
              <RouterProvider router={router} fallbackElement={routerFallback} />
              <RagSearchFab onClick={() => setRagDrawerOpen(true)} />
              <RagSearchDrawer open={ragDrawerOpen} onOpenChange={setRagDrawerOpen} />
            </>
          </AppErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
