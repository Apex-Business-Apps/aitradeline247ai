import React, { useEffect, useState } from 'react';
import { DemoStep } from './DemoScript';

interface DemoSpotlightProps {
  currentStep: DemoStep | null;
  isActive: boolean;
}

export default function DemoSpotlight({ currentStep, isActive }: DemoSpotlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!currentStep || !isActive) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(currentStep.target);
    if (!element) {
      console.warn(`Demo target not found: ${currentStep.target}`);
      setTargetRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setTargetRect(rect);

    // Apply zoom transform to the page
    const zoom = currentStep.zoom || 1;
    if (zoom !== 1) {
      document.body.style.transform = `scale(${zoom})`;
      document.body.style.transformOrigin = `${rect.left + rect.width/2}px ${rect.top + rect.height/2}px`;
      document.body.style.transition = 'transform 0.5s ease-in-out';
    } else {
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
    }

    // Scroll element into view
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center', 
      inline: 'center' 
    });

  }, [currentStep, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      document.body.style.transition = '';
    };
  }, []);

  if (!isActive || !targetRect || !currentStep) {
    return null;
  }

  const padding = 8;
  const spotlightStyle = {
    left: targetRect.left - padding,
    top: targetRect.top - padding,
    width: targetRect.width + (padding * 2),
    height: targetRect.height + (padding * 2),
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark overlay with cutout */}
      <div 
        className="absolute inset-0 bg-black/50"
        style={{
          clipPath: `polygon(0% 0%, 0% 100%, ${spotlightStyle.left}px 100%, ${spotlightStyle.left}px ${spotlightStyle.top}px, ${spotlightStyle.left + spotlightStyle.width}px ${spotlightStyle.top}px, ${spotlightStyle.left + spotlightStyle.width}px ${spotlightStyle.top + spotlightStyle.height}px, ${spotlightStyle.left}px ${spotlightStyle.top + spotlightStyle.height}px, ${spotlightStyle.left}px 100%, 100% 100%, 100% 0%)`
        }}
      />
      
      {/* Highlighted border */}
      <div
        className="absolute border-2 border-primary rounded-lg pointer-events-auto"
        style={spotlightStyle}
      >
        {/* Pulse animation */}
        <div className="absolute inset-0 border-2 border-primary rounded-lg animate-pulse opacity-50" />
      </div>

      {/* Description tooltip */}
      {currentStep.description && (
        <div
          className="absolute bg-white dark:bg-gray-900 text-black dark:text-white px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs z-10"
          style={{
            left: Math.min(spotlightStyle.left, window.innerWidth - 200),
            top: spotlightStyle.top - 50,
          }}
        >
          {currentStep.description}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-900" />
        </div>
      )}
    </div>
  );
}