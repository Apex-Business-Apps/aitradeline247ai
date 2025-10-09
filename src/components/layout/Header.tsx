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
  return <header 
      data-site-header 
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-14 md:h-16" 
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
      data-lovable-lock="permanent"
    >
      <div data-header-inner className="container h-full flex items-center justify-between gap-4" data-lovable-lock="permanent">
        {/* Logo & Badge */}
        <div data-slot="left" className="flex items-center gap-3" data-lovable-lock="permanent">
          <Logo className="h-8 w-auto" />
          <img 
            src="/assets/brand/badges/built-in-canada-badge.png" 
            alt="Built in Canada badge" 
            className="h-7 md:h-8 w-auto mx-3"
            width="156"
            height="65"
            loading="eager"
            role="presentation"
            data-lovable-lock="permanent"
          />
        </div>

        {/* Desktop Navigation */}
        <nav 
          data-slot="center" 
          role="navigation" 
          aria-label="Primary navigation" 
          className="hidden md:flex"
          data-lovable-lock="permanent"
        >
          <ul className="flex items-center gap-5 lg:gap-6">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href || 
                              (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link 
                    to={item.href}
                    className={cn(
                      "inline-flex h-10 items-center justify-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
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
                      "inline-flex h-10 items-center justify-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
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
        <div data-slot="right" className="flex items-center gap-2" data-lovable-lock="permanent">
          <LanguageSwitcher data-lovable-lock="permanent" />
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {user.user_metadata?.display_name || user.email}
                </span>
                {userRole && (
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium hidden sm:block",
                    isAdmin() 
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  )}>
                    {userRole.toUpperCase()}
                  </span>
                )}
              </div>
              <Button 
                variant="success" 
                onClick={() => navigate('/app/dashboard')} 
                className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Dashboard
              </Button>
            </div>
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

      {/* Mobile Navigation - Horizontal Scroll */}
      <div className="md:hidden border-t bg-background/95">
        <nav 
          role="navigation" 
          aria-label="Primary navigation"
          className="relative overflow-x-auto scrollbar-hide"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Left fade */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/95 to-transparent pointer-events-none z-10" />
          
          <ul className="flex items-center gap-3 px-4 py-3 min-w-max">
            {user && (
              <li>
                <Link 
                  to="/app/dashboard"
                  className="inline-flex h-11 items-center justify-center px-4 text-sm font-medium rounded-full bg-primary/14 text-foreground min-w-[44px]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </li>
            )}
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href || 
                              (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link 
                    to={item.href}
                    className={cn(
                      "inline-flex h-11 items-center justify-center px-4 text-sm font-medium rounded-full transition-colors min-w-[44px]",
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
            {isAdmin() && adminNavigationItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link 
                    to={item.href}
                    className={cn(
                      "inline-flex h-11 items-center justify-center px-4 text-sm font-medium rounded-full transition-colors min-w-[44px]",
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
          </ul>
          
          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/95 to-transparent pointer-events-none z-10" />
        </nav>
      </div>
    </header>;
};