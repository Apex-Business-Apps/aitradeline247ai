import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu, X, LogOut, ChevronDown, MoreHorizontal, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { usePriorityNav } from '@/hooks/usePriorityNav';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
// Learn dropdown items (public)
const learnItems = [{
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

// App navigation items (authenticated)
const appNavItems = [{
  name: 'Dashboard',
  href: '/dashboard'
}, {
  name: 'Calls',
  href: '/calls'
}, {
  name: 'Phone Apps',
  href: '/phone-apps'
}, {
  name: 'Numbers',
  href: '/ops/numbers/onboard'
}, {
  name: 'Knowledge Base',
  href: '/admin/knowledge-base'
}, {
  name: 'Settings',
  href: '/ops/voice'
}];
export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const { user, userRole, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { visibleItems, overflowItems, navRef, moreButtonRef } = usePriorityNav(appNavItems, 1);

  // Check if user is on an authenticated route
  const isAuthenticatedRoute = location.pathname.startsWith('/dashboard') || 
                                location.pathname.startsWith('/calls') || 
                                location.pathname.startsWith('/phone-apps') ||
                                location.pathname.startsWith('/ops') ||
                                location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getUserInitials = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  const truncateEmail = (email: string, maxLength: number = 20) => {
    if (email.length <= maxLength) return email;
    return email.substring(0, maxLength) + '...';
  };
  return (
    <>
      {/* Skip to main content link */}
      <a 
        href="#main" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <header 
        role="banner" 
        data-site-header 
        className={cn(
          'sticky top-0 z-[9999] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 isolate',
          isScrolled ? 'shadow-lg' : ''
        )} 
        style={{ isolation: 'isolate' }} 
        data-lovable-lock="permanent"
      >
        {/* Tier 1: Site/Utility Bar */}
        <div className={cn('border-b border-border/50', isScrolled ? 'py-1' : 'py-2')}>
          <div className="container flex h-12 items-center justify-between gap-4">
            {/* Left: Logo */}
            <div className="flex items-center gap-3 animate-fade-in min-w-[200px]">
              <Button 
                variant="success" 
                size={isScrolled ? 'sm' : 'default'}
                onClick={() => navigate('/')}
                className="hover-scale transition-all duration-300"
              >
                Home
              </Button>
              <img 
                src="/assets/brand/badges/built-in-canada-badge.png" 
                alt="Built in Canada" 
                className="h-[40px] w-auto hidden lg:block"
                width="120"
                height="40"
                loading="eager"
              />
            </div>

            {/* Center: Learn Dropdown */}
            <nav aria-label="Learn" className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1">
                    Learn
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48 bg-background z-[10000]">
                  {learnItems.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link to={item.href} className="cursor-pointer">
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right: Utility Cluster */}
            <div className="flex items-center gap-2 animate-fade-in min-w-[280px] lg:min-w-[320px] justify-end">
              <LanguageSwitcher />
              
              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2 rounded-md hover:bg-accent transition-all duration-300" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  {/* Admin Badge */}
                  {isAdmin() && (
                    <Badge variant="destructive" className="hidden lg:flex">
                      Admin
                    </Badge>
                  )}

                  {/* User Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2 max-w-[200px]">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <span 
                          className="hidden lg:inline text-sm truncate" 
                          title={user.email || ''}
                        >
                          {truncateEmail(user.email || '', 15)}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-background z-[10000]">
                      <DropdownMenuItem disabled className="flex flex-col items-start">
                        <span className="text-xs text-muted-foreground">Signed in as</span>
                        <span className="text-sm font-medium truncate w-full" title={user.email || ''}>
                          {user.email}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/ops/voice" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button 
                  variant="success" 
                  size={isScrolled ? 'sm' : 'default'} 
                  onClick={() => navigate('/auth')} 
                  className="hover-scale transition-all duration-300 shadow-lg hover:shadow-xl min-h-[44px]"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tier 2: App Navigation (Authenticated Only) */}
        {user && isAuthenticatedRoute && (
          <nav 
            ref={navRef}
            aria-label="Primary app" 
            className={cn('border-b border-border/30', isScrolled ? 'py-1' : 'py-2')}
          >
            <div className="container">
              <div className="flex items-center gap-2 overflow-x-auto lg:overflow-visible scrollbar-hide snap-x snap-mandatory lg:snap-none">
                {/* Visible Navigation Items */}
                <div className="hidden lg:flex items-center gap-1 flex-nowrap">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      data-nav-item
                      aria-current={location.pathname === item.href ? 'page' : undefined}
                      className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                        'hover:bg-accent hover:text-accent-foreground',
                        location.pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}

                  {/* More Menu for Overflow Items */}
                  {overflowItems.length > 0 && (
                    <DropdownMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          ref={moreButtonRef}
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          aria-expanded={moreMenuOpen}
                          aria-label="More navigation items"
                        >
                          More
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-background z-[10000]">
                        {overflowItems.map((item) => (
                          <DropdownMenuItem key={item.name} asChild>
                            <Link 
                              to={item.href} 
                              className={cn(
                                'cursor-pointer',
                                location.pathname === item.href && 'bg-primary/10 text-primary'
                              )}
                            >
                              {item.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Mobile: Scrollable Tab Row */}
                <div className="flex lg:hidden gap-1 snap-x snap-mandatory overflow-x-auto scrollbar-hide py-1">
                  {appNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      aria-current={location.pathname === item.href ? 'page' : undefined}
                      className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap snap-start',
                        'hover:bg-accent hover:text-accent-foreground',
                        location.pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur animate-slide-in-right">
            <nav className="container py-4 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground px-4 py-2">Learn</div>
              {learnItems.map((item, index) => (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  className="block px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover-scale animate-fade-in" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {item.name}
                </Link>
              ))}

              {user && (
                <>
                  <div className="text-xs font-semibold text-muted-foreground px-4 py-2 mt-4">App</div>
                  {appNavItems.map((item, index) => (
                    <Link 
                      key={item.name} 
                      to={item.href} 
                      className={cn(
                        'block px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 hover-scale animate-fade-in',
                        location.pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ animationDelay: `${(learnItems.length + index) * 50}ms` }}
                    >
                      {item.name}
                    </Link>
                  ))}

                  <div className="border-t my-2" />
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="inline-block mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
};