import React from 'react';
import { Logo } from '@/components/ui/logo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background mt-auto sticky bottom-0">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <Logo variant="text" size="sm" />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>© 2024 TradeLine 24/7. Never miss a call. We've got it.</span>
              <span>•</span>
              <span>Hosted in Canada • Apex Business Systems • Edmonton, Alberta</span>
              <img src="/assets/brand/hosted-in-canada-badge.svg" alt="Hosted in Canada" width="130" height="32" className="ml-2" />
            </div>
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