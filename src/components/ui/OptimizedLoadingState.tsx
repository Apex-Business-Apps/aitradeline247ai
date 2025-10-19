import React, { useState, useEffect } from 'react';

interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export const OptimizedLoadingState: React.FC<LoadingStateProps> = ({ 
  isLoading, 
  message = 'Loading...', 
  progress 
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div 
      id="loading-container"
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      style={{ 
        opacity: 0,
        transform: 'translateY(-10px) scale(0.95)',
        transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      <div className="bg-card border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Optimized spinner */}
          <div className="relative">
            <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
            {progress !== undefined && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Loading message */}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {message}{dots}
            </p>
            
            {progress !== undefined && (
              <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
