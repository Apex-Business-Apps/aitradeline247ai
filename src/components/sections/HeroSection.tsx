import { Button } from "@/components/ui/button";
import officialLogo from '@/assets/official-logo.svg';

export const HeroSection = () => {
  return (
    <section className="relative bg-gradient-orange-subtle pt-2 pb-32 text-center overflow-hidden">
      {/* Multi-layered Background System for Premium Translucency */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 via-brand-orange-light/15 to-brand-orange/10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background/21 via-transparent to-background/14"></div>
      <div className="absolute inset-0" style={{background: 'var(--gradient-premium)'}}></div>
      
      {/* Glowing Orbs for Visual Depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-brand-orange-light/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="container relative z-10">
        {/* Hero Logo - Prominent and High Quality */}
        <div className="mb-2 -mt-[1.5cm]">
          <img 
            src={officialLogo} 
            alt="TradeLine AI - 24/7 AI Receptionist" 
            className="h-44 md:h-[16.5rem] lg:h-[19.8rem] w-auto mx-auto drop-shadow-2xl"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            style={{filter: 'var(--premium-glow)'}}
          />
        </div>
        
        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight">
          Your 24/7 Ai Receptionist
        </h1>
        
        {/* Value Proposition */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Never miss a lead. Our intelligent receptionist handles calls, schedules appointments, and qualifies prospects around the clock.
        </p>
        
        {/* Primary CTA */}
        <div className="space-y-4">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 rounded-full transition-all duration-300 transform hover:scale-105" style={{boxShadow: 'var(--premium-glow)'}}>
            Grow now
          </Button>
          <p className="text-sm text-muted-foreground">Start your free trial • No credit card required</p>
        </div>
      </div>
    </section>
  );
};