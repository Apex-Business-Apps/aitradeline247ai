/**
 * HeaderV2 - New header implementation with exact specifications
 * 
 * Spec Requirements:
 * - Grid 3-zones: Left (Home+badge) | Center (nav) | Right (Locale+Login)
 * - Nav visually centered to viewport
 * - Heights: 56px ≤768px, 64px ≥769px
 * - One-pixel divider under header, no shadows
 * - Badge decorative between logo & nav, height 28-32px, no shadow
 * - Active links: soft pill (brand orange @ ~14% opacity), no shadow
 * - Locale: compact pill (EN+globe), sits left of Login, both 36-40px tall
 * - Mobile: nav is single-line horizontal scroll with edge fades; tap target ≥44px
 * - A11y: role="navigation", aria-current="page" on active
 * - iOS jitter guard: will-change: transform; translateZ(0)
 */
import React, { useState } from 'react';
import { Globe, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES } from '@/i18n/config';

const navigationItems = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing#no-monthly' },
  { name: 'Compare', href: '/compare' },
  { name: 'Security', href: '/security' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' }
];

export const HeaderV2: React.FC = () => {
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('common');

  const isActiveRoute = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLocaleMenuOpen(false);
  };

  return (
    <>
      <style>{`
        header[data-header-v2] {
          height: 56px;
          border-bottom: 1px solid hsl(var(--border));
          box-shadow: none;
          will-change: transform;
          transform: translateZ(0);
        }
        
        @media (min-width: 769px) {
          header[data-header-v2] {
            height: 64px;
          }
        }
        
        header[data-header-v2] [data-v2-inner] {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 0.5rem;
          height: 100%;
          padding-inline: max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right));
        }
        
        header[data-header-v2] [data-v2-slot="left"] {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        header[data-header-v2] [data-v2-slot="center"] {
          justify-self: center;
        }
        
        header[data-header-v2] [data-v2-slot="right"] {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        header[data-header-v2] .v2-nav {
          display: flex;
          gap: 0.25rem;
        }
        
        header[data-header-v2] .v2-nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--foreground));
          background: transparent;
          border-radius: 9999px;
          transition: all 0.2s;
          text-decoration: none;
          min-height: 44px;
        }
        
        header[data-header-v2] .v2-nav-link:hover {
          background: hsl(var(--accent));
        }
        
        header[data-header-v2] .v2-nav-link:focus-visible {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }
        
        header[data-header-v2] .v2-nav-link[aria-current="page"] {
          background: hsl(var(--primary) / 0.14);
          color: hsl(var(--primary));
        }
        
        header[data-header-v2] .v2-badge {
          height: 30px;
          width: auto;
        }
        
        header[data-header-v2] .v2-locale-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          height: 38px;
          padding: 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--foreground));
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        header[data-header-v2] .v2-locale-btn:hover {
          background: hsl(var(--accent));
        }
        
        header[data-header-v2] .v2-locale-btn:focus-visible {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }
        
        header[data-header-v2] .v2-login-btn {
          height: 38px;
          min-height: 38px;
        }
        
        @media (max-width: 768px) {
          header[data-header-v2] [data-v2-slot="center"] {
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
          }
          
          header[data-header-v2] [data-v2-slot="center"]::-webkit-scrollbar {
            display: none;
          }
          
          header[data-header-v2] .v2-nav {
            padding: 0 1rem;
          }
        }
      `}</style>
      
      <header 
        data-header-v2 
        data-site-header
        className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div data-v2-inner className="container">
          {/* Left: Home Button + Badge */}
          <div data-v2-slot="left">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => navigate('/')} 
              className="transition-all duration-200"
              aria-label="Go to homepage"
            >
              Home
            </Button>
            <img 
              src="/assets/brand/badges/built-in-canada-badge.png" 
              alt="Built in Canada" 
              className="v2-badge"
              loading="eager"
            />
          </div>

          {/* Center: Navigation */}
          <nav data-v2-slot="center" role="navigation" aria-label="Primary navigation">
            <div className="v2-nav">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="v2-nav-link"
                  aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* Right: Locale + Login/User */}
          <div data-v2-slot="right">
            {/* Locale Switcher */}
            <div className="relative">
              <button
                className="v2-locale-btn"
                onClick={() => setLocaleMenuOpen(!localeMenuOpen)}
                aria-label={t('language.switch')}
                aria-expanded={localeMenuOpen}
                aria-haspopup="true"
              >
                <Globe className="h-4 w-4" />
                <span className="uppercase">{i18n.language}</span>
              </button>
              
              {localeMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 bg-background border border-border rounded-md shadow-lg p-1 min-w-[120px] z-50"
                  role="menu"
                >
                  {SUPPORTED_LOCALES.map((locale) => (
                    <button
                      key={locale}
                      onClick={() => changeLanguage(locale)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-sm transition-colors",
                        i18n.language === locale ? 'bg-accent' : 'hover:bg-accent'
                      )}
                      role="menuitem"
                    >
                      {t(`language.${locale}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Login / User Actions */}
            {user ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()} 
                className="v2-login-btn transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            ) : (
              <Button 
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')} 
                className="v2-login-btn transition-all duration-200"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
