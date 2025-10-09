import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const navigationItems = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Compare', href: '/compare' },
  { name: 'Security', href: '/security' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' }
];
export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header 
      data-site-header 
      className="sticky top-0 z-[9999] isolate bg-white dark:bg-gray-950 border-b border-slate-200/30 dark:border-slate-800/30"
      style={{ 
        height: '56px',
        boxShadow: 'none'
      }}
    >
      <style>{`
        @media (min-width: 769px) {
          header[data-site-header] {
            height: 64px !important;
          }
        }
      `}</style>
      <div 
        data-header-inner 
        className="mx-auto px-4"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: '0.5rem',
          height: '100%',
          paddingInline: 'max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right))'
        }}
      >
        {/* LEFT: Logo + Badge (decorative, not in nav) */}
        <div data-slot="left" className="flex items-center gap-3" style={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}>
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/assets/official-logo.svg" 
              alt="TradeLine 24/7 Logo" 
              className="h-8 w-auto"
              style={{ height: '32px' }}
              loading="eager"
            />
          </Link>
          <img 
            src="/assets/brand/badges/built-in-canada-badge.png" 
            alt="Built in Canada badge" 
            className="h-7 w-auto"
            style={{ height: '28px' }}
            loading="eager"
          />
        </div>

        {/* CENTER: Nav */}
        <nav 
          data-slot="center" 
          role="navigation" 
          aria-label="Main navigation"
          className="hidden md:flex justify-center"
          style={{ justifySelf: 'center', minWidth: 0 }}
        >
          <div className="flex items-center gap-5">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center",
                    "hover:bg-[hsl(var(--brand-orange-primary)/0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--brand-orange-primary))]",
                    isActive 
                      ? "bg-[hsl(var(--brand-orange-primary)/0.14)] text-[hsl(var(--brand-orange-primary))] shadow-none" 
                      : "text-foreground bg-transparent"
                  )}
                  style={{ fontSize: '16px', boxShadow: 'none' }}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* RIGHT: Locale + Auth CTA */}
        <div 
          data-slot="right" 
          className="flex items-center gap-2"
          style={{ justifySelf: 'end', marginLeft: 'auto', whiteSpace: 'nowrap', minWidth: 'max-content' }}
        >
          <LanguageSwitcher />
          
          <Button 
            variant="default"
            onClick={() => navigate(user ? '/app/dashboard' : '/auth')}
            className="bg-green-600 hover:bg-green-700 text-white min-h-[44px] min-w-[44px] px-4"
            style={{ fontSize: '16px' }}
          >
            {user ? 'Dashboard' : 'Login'}
          </Button>

          {/* Mobile menu toggle */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-accent min-h-[44px] min-w-[44px]" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed left-0 right-0 bg-white dark:bg-gray-950 border-b border-slate-200/30 dark:border-slate-800/30 z-[10000]"
          style={{ 
            top: 'var(--sat, 0)',
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
        >
          <nav className="px-4 py-4 space-y-1" style={{ paddingInline: 'max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right))' }}>
            {user && (
              <Link
                to="/app/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-base font-medium rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 min-h-[44px]"
                style={{ fontSize: '16px' }}
              >
                Dashboard
              </Link>
            )}
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    "block px-4 py-3 text-base font-medium rounded-md min-h-[44px]",
                    isActive 
                      ? "bg-[hsl(var(--brand-orange-primary)/0.14)] text-[hsl(var(--brand-orange-primary))]"
                      : "hover:bg-accent"
                  )}
                  style={{ fontSize: '16px' }}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};