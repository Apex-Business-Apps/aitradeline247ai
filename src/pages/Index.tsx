import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustBadges } from "@/components/sections/TrustBadges";
import { BenefitCards } from "@/components/sections/BenefitCards";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <BenefitCards />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;