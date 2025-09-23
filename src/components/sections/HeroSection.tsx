import { Button } from "@/components/ui/button";
import officialLogo from '@/assets/official-logo.svg';

export const HeroSection = () => {
  return (
    <section className="relative bg-gradient-orange-subtle pt-28 pb-32 text-center overflow-hidden">
      <div className="container relative z-10">
        {/* Hero Logo - Prominent and High Quality */}
        <div className="mb-2">
          <img 
            src={officialLogo} 
            alt="TradeLine AI - 24/7 AI Receptionist" 
            className="h-40 md:h-60 lg:h-72 w-auto mx-auto drop-shadow-2xl"
          />
        </div>
        
        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight">
          Your 24/7 AI Receptionist
        </h1>
        
        {/* Value Proposition */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Never miss a lead. Our intelligent receptionist handles calls, schedules appointments, and qualifies prospects around the clock.
        </p>
        
        {/* Primary CTA */}
        <div className="space-y-4">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 rounded-full shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105">
            Grow now
          </Button>
          <p className="text-sm text-muted-foreground">Start your free trial • No credit card required</p>
        </div>
      </div>
      
      {/* Background Elements for Visual Interest */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
    </section>
  );
};