import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustBadges } from "@/components/sections/TrustBadges";
import { BenefitCards } from "@/components/sections/BenefitCards";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LeadCaptureForm } from "@/components/sections/LeadCaptureForm";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <BenefitCards />
        <HowItWorks />
        <LeadCaptureForm />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;