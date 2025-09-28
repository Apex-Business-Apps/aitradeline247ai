import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NewDashboard } from '@/components/dashboard/NewDashboard';
import DemoSpotlight from '@/features/dashboard/DemoSpotlight';
import { demoSteps, DemoState, initialDemoState } from '@/features/dashboard/DemoScript';
import { useToast } from '@/hooks/use-toast';

export default function DemoDashboard() {
  const [searchParams] = useSearchParams();
  const [demoState, setDemoState] = useState<DemoState>(() => ({
    ...initialDemoState,
    speed: parseFloat(searchParams.get('speed') || '1.0'),
    loop: searchParams.get('loop') === '1'
  }));
  
  const { toast } = useToast();

  const startDemo = useCallback(() => {
    setDemoState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      currentStep: 0
    }));
    
    toast({
      title: "Demo Started",
      description: "Press Space to pause/resume, Escape to stop",
    });
  }, [toast]);

  const stopDemo = useCallback(() => {
    setDemoState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentStep: 0
    }));
    
    // Reset page transform
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
    
    toast({
      title: "Demo Stopped",
      description: "Click Start Demo to begin again",
    });
  }, [toast]);

  const togglePause = useCallback(() => {
    setDemoState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (demoState.isPlaying) {
          togglePause();
        } else {
          startDemo();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stopDemo();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [demoState.isPlaying, togglePause, startDemo, stopDemo]);

  // Demo step progression
  useEffect(() => {
    if (!demoState.isPlaying || demoState.isPaused) return;

    const currentStep = demoSteps[demoState.currentStep];
    if (!currentStep) {
      // Demo finished
      if (demoState.loop) {
        setDemoState(prev => ({ ...prev, currentStep: 0 }));
      } else {
        stopDemo();
      }
      return;
    }

    const timeout = setTimeout(() => {
      setDemoState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    }, currentStep.wait / demoState.speed);

    return () => clearTimeout(timeout);
  }, [demoState.currentStep, demoState.isPlaying, demoState.isPaused, demoState.speed, demoState.loop, stopDemo]);

  // Add demo data attributes to elements
  useEffect(() => {
    // Add data-demo attributes to dashboard elements
    const addDemoAttributes = () => {
      // Header
      const header = document.querySelector('h1, .welcome-header, [class*="welcome"]');
      if (header) header.setAttribute('data-demo', 'dashboard-header');

      // KPI Cards
      const kpiCards = document.querySelectorAll('[class*="grid"] [class*="card"]:not([data-demo])');
      if (kpiCards.length >= 4) {
        kpiCards[0]?.setAttribute('data-demo', 'missed-calls');
        kpiCards[1]?.setAttribute('data-demo', 'callbacks');
        kpiCards[2]?.setAttribute('data-demo', 'analytics');
        kpiCards[3]?.setAttribute('data-demo', 'integrations');
      }

      // Settings and test call buttons
      const buttons = document.querySelectorAll('button, a[class*="button"]');
      buttons.forEach(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('settings') || text.includes('configure')) {
          btn.setAttribute('data-demo', 'settings');
        } else if (text.includes('test') || text.includes('call')) {
          btn.setAttribute('data-demo', 'test-call');
        }
      });
    };

    // Run after component mounts and updates
    const timer = setTimeout(addDemoAttributes, 100);
    return () => clearTimeout(timer);
  }, []);

  // Disable pointer events during demo (except spotlight target)
  useEffect(() => {
    if (demoState.isPlaying) {
      document.body.style.pointerEvents = 'none';
      document.body.style.userSelect = 'none';
      
      // Re-enable for current target
      const currentStep = demoSteps[demoState.currentStep];
      if (currentStep) {
        const target = document.querySelector(currentStep.target);
        if (target) {
          (target as HTMLElement).style.pointerEvents = 'auto';
        }
      }
    } else {
      document.body.style.pointerEvents = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.body.style.pointerEvents = '';
      document.body.style.userSelect = '';
    };
  }, [demoState.isPlaying, demoState.currentStep]);

  const currentStep = demoSteps[demoState.currentStep] || null;

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Controls */}
      <div className="fixed top-4 right-4 z-50 space-x-2">
        {!demoState.isPlaying ? (
          <button
            onClick={startDemo}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg hover:bg-primary/90 transition-colors"
          >
            Start Demo
          </button>
        ) : (
          <>
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md shadow-lg hover:bg-secondary/90 transition-colors"
            >
              {demoState.isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={stopDemo}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md shadow-lg hover:bg-destructive/90 transition-colors"
            >
              Stop
            </button>
          </>
        )}
      </div>

      {/* Demo Progress */}
      {demoState.isPlaying && (
        <div className="fixed top-4 left-4 z-50 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium mb-1">
            Demo Progress: {demoState.currentStep + 1}/{demoSteps.length}
          </div>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((demoState.currentStep + 1) / demoSteps.length) * 100}%` }}
            />
          </div>
          {demoState.isPaused && (
            <div className="text-xs text-muted-foreground mt-1">Paused</div>
          )}
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 py-6">
        <NewDashboard />
      </div>

      {/* Demo Spotlight Overlay */}
      <DemoSpotlight 
        currentStep={currentStep}
        isActive={demoState.isPlaying && !demoState.isPaused}
      />

      {/* Instructions */}
      {!demoState.isPlaying && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-md text-center">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Interactive dashboard demo</p>
            <p className="text-xs">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> to start/pause • 
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Esc</kbd> to stop
            </p>
          </div>
        </div>
      )}
    </div>
  );
}