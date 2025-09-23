import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-b from-background to-secondary/20">
        <div className="container py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            TradeLine 24/7 — Your 24/7 AI Receptionist!
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Enterprise-grade foundation ready for your intelligent receptionist solution.
          </p>
          
          <Button size="lg">
            Grow now
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;