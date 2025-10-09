import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
const navigationItems = [{
  name: 'Home',
  href: '/'
}, {
  name: 'Features',
  href: '/features'
}, {
  name: 'Pricing',
  href: '/pricing#no-monthly'
}, {
  name: 'Compare',
  href: '/compare'
}, {
  name: 'Security',
  href: '/security'
}, {
  name: 'FAQ',
  href: '/faq'
}, {
  name: 'Contact',
  href: '/contact'
}];
const adminNavigationItems = [{
  name: 'Calls',
  href: '/calls'
}, {
  name: 'Phone Apps',
  href: '/phone-apps'
}, {
  name: 'Settings',
  href: '/ops/voice'
}];
export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    user,
    userRole,
    signOut,
    isAdmin
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobileMenuOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-mobile-menu]') && !target.closest('[data-hamburger]')) {
          setIsMobileMenuOpen(false);
        }
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isMobileMenuOpen]);
  
  return (
    <header 
      data-site-header 
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-14 md:h-16" 
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
    >
      <div data-header-inner className="container h-full">
        {/* Logo & Badge */}
        <div data-slot="left" className="flex items-center gap-3">
          <Logo className="h-8 w-auto" />
          <img 
            src="/assets/brand/badges/built-in-canada.svg" 
            alt="Built in Canada badge" 
            className="h-7 md:h-8 w-auto"
            loading="eager"
            role="presentation"
          />
        </div>

        {/* Desktop Navigation */}
        <nav 
          data-slot="center" 
          role="navigation" 
          aria-label="Primary navigation" 
          className="hidden md:flex"
        >
          <ul className="flex items-center md:gap-5 lg:gap-6">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href || 
                              (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link 
                    to={item.href}
                    className={cn(
                      "inline-flex h-11 items-center justify-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 min-h-[44px] min-w-[44px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isActive 
                        ? "bg-primary/14 text-foreground" 
                        : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
            {/* Admin-only navigation items */}
            {isAdmin() && adminNavigationItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link 
                    to={item.href}
                    className={cn(
                      "inline-flex h-11 items-center justify-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 min-h-[44px] min-w-[44px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isActive 
                        ? "bg-primary/20 text-primary" 
                        : "bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right: Locale + Auth Button */}
        <div data-slot="right" className="flex items-center gap-2">
          <LanguageSwitcher />
          
          {/* Mobile Menu Button */}
          <button 
            data-hamburger
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Auth Button */}
          <div className="hidden md:block">
            {user ? (
              <Button 
                variant="success" 
                onClick={() => navigate('/app/dashboard')} 
                className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Dashboard
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={() => navigate('/auth')} 
                className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div 
          data-mobile-menu
          className="md:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-lg border-b shadow-lg"
          style={{
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <nav role="navigation" aria-label="Mobile navigation">
            <ul className="py-4 space-y-2">
              {/* Dashboard first when logged in */}
              {user && (
                <li>
                  <Link 
                    to="/app/dashboard"
                    className="flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium rounded-full bg-primary/14 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
              )}
              
              {/* Main navigation items */}
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href || 
                                (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <Link 
                      to={item.href}
                      className={cn(
                        "flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium rounded-full transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isActive 
                          ? "bg-primary/14 text-foreground" 
                          : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
              
              {/* Admin items */}
              {isAdmin() && adminNavigationItems.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link 
                      to={item.href}
                      className={cn(
                        "flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium rounded-full transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isActive 
                          ? "bg-primary/20 text-primary" 
                          : "bg-primary/10 text-primary hover:bg-primary/15"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
              
              {/* Auth button for mobile */}
              <li className="pt-2">
                {user ? (
                  <Button 
                    variant="success" 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/app/dashboard');
                    }} 
                    className="w-full min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Dashboard
                  </Button>
                ) : (
                  <Button 
                    variant="success" 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/auth');
                    }} 
                    className="w-full min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Login
                  </Button>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};