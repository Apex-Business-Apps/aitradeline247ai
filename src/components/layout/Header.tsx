import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
const navigationItems = [{
  name: 'Features',
  href: '/features'
}, {
  name: 'Pricing',
  href: '/pricing#no-monthly'
}, {
  name: 'FAQ',
  href: '/faq'
}, {
  name: 'Contact',
  href: '/contact'
}];
const adminNavigationItems = [{
  name: 'Call Center',
  href: '/call-center'
}, {
  name: 'Dashboard',
  href: '/dashboard'
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
  return <>
      {/* Skip Navigation Link for Screen Readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[60] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium transition-all duration-200"
        onClick={(e) => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        Skip to main content
      </a>
      
      <header className={cn('sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300', isScrolled ? 'shadow-lg py-2' : 'py-4')}>
        <div className="container flex h-14 items-center justify-between">
        {/* Logo with Animation */}
        <div className="animate-fade-in">
          
        </div>

        {/* Desktop Navigation */}
        <nav aria-label="Primary" className="hidden md:flex animate-fade-in" style={{
        animationDelay: '200ms'
      }}>
          <NavigationMenu>
            <NavigationMenuList>
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
        <div className="flex items-center gap-2 animate-fade-in" style={{
        animationDelay: '400ms'
      }}>
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
            </div> : <Button variant="success" size={isScrolled ? 'sm' : 'default'} onClick={() => navigate('/auth')} className="hover-scale transition-all duration-300 shadow-lg hover:shadow-xl">
              Login
            </Button>}
          
          {/* Enhanced Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-accent transition-all duration-300 hover-scale" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Enhanced Mobile Navigation with Slide Animation */}
      {isMobileMenuOpen && <div className="md:hidden border-t bg-background/95 backdrop-blur animate-slide-in-right">
          <nav id="mobile-navigation" className="container py-4 space-y-2" aria-label="Mobile navigation">
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
      </header>
    </>;
};