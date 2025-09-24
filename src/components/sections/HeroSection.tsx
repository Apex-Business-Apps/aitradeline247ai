import { Button } from "@/components/ui/button";
import officialLogo from '@/assets/official-logo.svg';

export const HeroSection = () => {
  return (
    <section className="relative bg-gradient-orange-subtle pt-2 pb-32 text-center overflow-hidden">
      {/* Multi-layered Background System for Premium Translucency */}
      {/* Premium base gradient (bottom-most) */}
      <div className="absolute inset-0" style={{background: 'var(--gradient-premium)'}}></div>
      {/* Soft background fade (reduced opacity further) */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/12 via-transparent to-background/8"></div>
      {/* Saturated orange wash (top of background layers) */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/50 via-brand-orange-light/35 to-brand-orange/25"></div>
      
      {/* Enhanced Glowing Orbs with Animation */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-brand-orange-light/28 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 right-1/6 w-64 h-64 bg-primary/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      
      <div className="container relative z-10">
        {/* Hero Logo - Prominent with Enhanced Animation */}
        <div className="mb-2 -mt-[1.5cm] animate-fade-in">
          <img 
            src={officialLogo} 
            alt="TradeLine AI - 24/7 AI Receptionist" 
            className="h-44 md:h-[16.5rem] lg:h-[19.8rem] w-auto mx-auto drop-shadow-2xl hover-scale transition-all duration-500"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            style={{filter: 'var(--premium-glow)'}}
          />
        </div>
        
        {/* Main Headline with Staggered Animation */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight animate-fade-in [animation-delay:200ms]">
          Your 24/7 Ai Receptionist
        </h1>
        
        {/* Value Proposition with Delayed Animation */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in [animation-delay:400ms]">
          We pick up when you can't—so customers aren't kept waiting.
        </p>
        
        {/* Enhanced CTA Section */}
        <div className="space-y-4 animate-fade-in [animation-delay:600ms]">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 rounded-full transition-all duration-300 hover-scale shadow-lg hover:shadow-xl hover:shadow-primary/25" 
              style={{boxShadow: 'var(--premium-glow)'}}
            >
              Start free trial
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6 rounded-full border-2 hover:bg-primary/5 transition-all duration-300 hover-scale"
            >
              See how it works
            </Button>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            No credit card required • Setup in 24 hours
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 animate-fade-in [animation-delay:800ms]">
          <p className="text-sm text-muted-foreground mb-4">Trusted by 1000+ businesses</p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="h-8 w-16 bg-muted-foreground/20 rounded"></div>
            <div className="h-8 w-20 bg-muted-foreground/20 rounded"></div>
            <div className="h-8 w-14 bg-muted-foreground/20 rounded"></div>
          </div>
        </div>
      </div>
    </section>
  );
};