import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="bg-gradient-orange-subtle py-24 text-center">
      <div className="container">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Your 24/7 AI Receptionist
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Never miss a lead. Our intelligent receptionist handles calls, schedules appointments, and qualifies prospects around the clock.
        </p>
        
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Grow now
        </Button>
      </div>
    </section>
  );
};