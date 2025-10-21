import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
const navigationItems = [{
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
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (document.getElementById('app-header-left') &&
        document.getElementById('app-home') &&
        document.getElementById('app-badge-ca')) {
      import('../nav/AppHeaderOverride.module.css');
    } else {
      console.warn('Header left elements missing; override not applied');
    }
  }, []);
  return <header data-site-header className={cn('sticky top-0 z-[9999] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 isolate', isScrolled ? 'shadow-lg py-2' : 'py-4')} style={{ isolation: 'isolate' }} data-lovable-lock="permanent">
      <div data-header-inner className="container flex h-14 items-center justify-between gap-4" data-lovable-lock="permanent">
        {/* Home Button & Badge */}
        <div id="app-header-left" data-slot="left" className="flex items-center gap-3 animate-fade-in" data-lovable-lock="permanent">
          <Button 
            id="app-home"
            variant="default" 
            size={isScrolled ? 'sm' : 'default'}
            onClick={() => navigate('/')} 
            className="hover-scale transition-all duration-300" 
            aria-label="Go to homepage" 
            data-lovable-lock="permanent"
          >
            Home
          </Button>
          <img 
            id="app-badge-ca"
            src="/assets/brand/badges/built-in-canada-badge.png" 
            alt="Built in Canada" 
            className="h-[45px] sm:h-[60px] lg:h-[65px] w-auto"
            width="156"
            height="65"
            loading="eager"
            data-lovable-lock="permanent"
          />
        </div>

        {/* Desktop Navigation */}
        <nav data-slot="center" aria-label="Primary" className="hidden md:flex animate-fade-in" style={{ animationDelay: '200ms' }} data-lovable-lock="permanent">
          <NavigationMenu data-lovable-lock="permanent">
            <NavigationMenuList data-lovable-lock="permanent">
            {navigationItems.map((item, index) => <NavigationMenuItem key={item.name}>
                <NavigationMenuLink asChild>
                  <Link to={item.href} className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 story-link hover-scale" style={{
                  animationDelay: `${index * 100}ms`
                }}>
                    {item.name}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>)}
            {/* Admin-only navigation items */}
            {isAdmin() && adminNavigationItems.map((item, index) => <NavigationMenuItem key={item.name}>
                <NavigationMenuLink asChild>
                  <Link to={item.href} className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-primary/10 px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/30 data-[state=open]:bg-primary/30 story-link hover-scale text-primary" style={{
                  animationDelay: `${(navigationItems.length + index) * 100}ms`
                }}>
                    {item.name}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>)}
          </NavigationMenuList>
        </NavigationMenu>
        </nav>

        {/* Enhanced CTA Button & Mobile Menu */}
        <div data-slot="right" className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '400ms' }} data-lovable-lock="permanent">
          <LanguageSwitcher data-lovable-lock="permanent" />
          
          {/* Enhanced Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-md hover:bg-accent transition-all duration-300 hover-scale" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle mobile menu">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {user ? <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {user.user_metadata?.display_name || user.email}
                </span>
                {userRole && <span className={cn("text-xs px-2 py-1 rounded-full font-medium hidden sm:block transition-all duration-300", isAdmin() ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200")}>
                    {userRole.toUpperCase()}
                  </span>}
              </div>
              <Button variant="outline" size={isScrolled ? 'sm' : 'default'} onClick={() => signOut()} className="hover-scale transition-all duration-300">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div> : <Button variant="success" size={isScrolled ? 'sm' : 'default'} onClick={() => navigate('/auth')} className="hover-scale transition-all duration-300 shadow-lg hover:shadow-xl min-h-[44px]">
              Login
            </Button>}
        </div>
      </div>

      {/* Enhanced Mobile Navigation with Slide Animation */}
      {isMobileMenuOpen && <div className="md:hidden border-t bg-background/95 backdrop-blur animate-slide-in-right">
          <nav className="container py-4 space-y-2">
            {navigationItems.map((item, index) => <Link key={item.name} to={item.href} className="block px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover-scale animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} style={{
          animationDelay: `${index * 100}ms`
        }}>
                {item.name}
              </Link>)}
            {/* Admin-only mobile navigation items */}
            {isAdmin() && adminNavigationItems.map((item, index) => <Link key={item.name} to={item.href} className="block px-4 py-2 text-sm font-medium rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-300 hover-scale animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} style={{
          animationDelay: `${(navigationItems.length + index) * 100}ms`
        }}>
                {item.name}
              </Link>)}
          </nav>
        </div>}
    </header>;
};
