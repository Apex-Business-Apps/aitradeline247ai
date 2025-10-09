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
  href: '/pricing'
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
  name: 'Dashboard',
  href: '/dashboard'
}, {
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    user,
    userRole,
    signOut,
    isAdmin
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActivePath = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return <header data-site-header className="sticky z-50 w-full border-b bg-background" style={{
      top: 'max(0px, var(--sat))',
      height: 'clamp(56px, 8vw, 64px)'
    }} data-lovable-lock="permanent">
      <div data-header-inner className="container" data-lovable-lock="permanent">
        {/* Logo & Badge */}
        <div data-slot="left" className="flex items-center gap-3" data-lovable-lock="permanent">
          <Logo variant="icon" size="sm" className="cursor-pointer" onClick={() => navigate('/')} aria-label="TradeLine 24/7 home" />
          <img 
            src="/assets/brand/badges/built-in-canada-badge.png" 
            alt="Built in Canada" 
            className="h-[28px] sm:h-[32px] w-auto mx-3"
            width="78"
            height="32"
            loading="eager"
            role="img"
            aria-hidden="true"
            data-lovable-lock="permanent"
          />
        </div>

        {/* Desktop Navigation */}
        <nav data-slot="center" role="navigation" aria-label="Primary navigation" className="" data-lovable-lock="permanent">
          <ul className="items-center">
            {navigationItems.map((item, index) => {
              const isActive = isActivePath(item.href);
              return (
                <li key={item.name}>
                  <Link 
                    to={item.href} 
                    className={cn(
                      "inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg transition-colors duration-200 shadow-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "min-w-[44px] min-h-[44px]",
                      isActive 
                        ? "bg-primary/15 text-foreground" 
                        : "text-foreground/70 hover:text-foreground hover:bg-accent/30"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
            {/* Admin-only navigation items */}
            {isAdmin() && adminNavigationItems.map((item, index) => {
              const isActive = isActivePath(item.href);
              return (
                <li key={item.name}>
                  <Link 
                    to={item.href} 
                    className={cn(
                      "inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-lg transition-colors duration-200 shadow-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "min-w-[44px] min-h-[44px]",
                      isActive
                        ? "bg-primary/15 text-foreground"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent/30"
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

        {/* Locale & Auth */}
        <div data-slot="right" className="flex items-center gap-3" data-lovable-lock="permanent">
          <LanguageSwitcher data-lovable-lock="permanent" />
          

          {user ? <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {user.user_metadata?.display_name || user.email}
                </span>
                {userRole && <span className={cn("text-xs px-2 py-1 rounded-full font-medium hidden sm:block transition-all duration-200", isAdmin() ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200")}>
                    {userRole.toUpperCase()}
                  </span>}
              </div>
              <Button 
                variant="outline" 
                size="default"
                onClick={() => signOut()} 
                className="h-9 rounded-xl border transition-colors duration-200 min-w-[44px] min-h-[44px] shadow-none"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div> : <Button 
              variant="success" 
              size="default"
              onClick={() => navigate('/auth')} 
              className="h-9 rounded-xl border border-primary/20 transition-colors duration-200 min-h-[44px] shadow-none"
            >
              Login
            </Button>}
        </div>
      </div>

      {/* Mobile Navigation */}
      {false && <div className="md:hidden border-t bg-background">
          <nav role="navigation" aria-label="Mobile navigation" className="container py-4 space-y-2">
            {navigationItems.map((item, index) => {
              const isActive = isActivePath(item.href);
              return (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  className={cn(
                    "block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 min-h-[44px]",
                    isActive
                      ? "bg-primary/12 text-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)} 
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.name}
                </Link>
              );
            })}
            {/* Admin-only mobile navigation items */}
            {isAdmin() && adminNavigationItems.map((item, index) => {
              const isActive = isActivePath(item.href);
              return (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  className={cn(
                    "block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 min-h-[44px]",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-primary/10 hover:bg-primary/15 text-primary"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)} 
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>}
    </header>;
};