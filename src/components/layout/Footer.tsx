import React from 'react';
import { Logo } from '@/components/ui/logo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <Logo variant="text" size="sm" />
            </div>
            <address className="not-italic text-sm">
              <strong>Apex Business Systems</strong> • Edmonton, Alberta • Built Canadian<br />
              <a href="mailto:info@tradeline247ai.com" className="hover:text-foreground transition-colors">info@tradeline247ai.com</a>
            </address>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
              <span>© 2025 TradeLine 24/7. Never miss a call. We got it.</span>
            </div>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <a 
              href="/security" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Security
            </a>
            <a 
              href="/compare" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Compare
            </a>
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
              href="mailto:info@tradeline247ai.com" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};
