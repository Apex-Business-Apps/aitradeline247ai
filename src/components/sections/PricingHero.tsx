import RoiCalculator from "@/components/RoiCalculator";
export const PricingHero = () => {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background"></div>
      
      {/* Minimal accent elements */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          {/* Clean hero content */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-[0.9]">
              Your 24/7 A<span className="text-primary">i</span> Receptionist
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Never miss a call. Work while you sleep.
            </p>
          </div>
          
          {/* Featured ROI Calculator */}
          <div className="pt-8">
            <RoiCalculator />
          </div>
        </div>
      </div>
    </section>
  );
};