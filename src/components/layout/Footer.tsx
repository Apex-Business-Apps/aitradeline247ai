import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © 2024 TradeLine 24/7. All rights reserved.
            </p>
          </div>
          
          <nav className="flex items-center gap-6">
            <a 
              href="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a 
              href="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </a>
            <a 
              href="mailto:contact@tradeline247.com" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              contact@tradeline247.com
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};