import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import HeroRoiDuo from "@/sections/HeroRoiDuo";
import { TrustBadgesSlim } from "@/components/sections/TrustBadgesSlim";
import { BenefitsGrid } from "@/components/sections/BenefitsGrid";
import { ImpactStrip } from "@/components/sections/ImpactStrip";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LeadCaptureForm } from "@/components/sections/LeadCaptureForm";
import { NoAIHypeFooter } from "@/components/sections/NoAIHypeFooter";
import { useAnalytics } from "@/hooks/useAnalytics";
import { OrganizationSchema } from "@/components/seo/OrganizationSchema";
import LayoutCanon from "@/components/LayoutCanon";
import HeroDuoCanon from "@/components/HeroDuoCanon";
import { setSEO } from "@/lib/seo";

const Index = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    setSEO({
      title: "TradeLine 24/7 — Your 24/7 AI Receptionist",
      description: "Recover missed calls and bookings with an AI receptionist built for trades, SMBs, and freelancers.",
      path: "/"
    });
    trackPageView('home');
  }, [trackPageView]);

  return (
    <>
      <LayoutCanon />
      <HeroDuoCanon />
      <div className="min-h-screen flex flex-col relative">
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'var(--bg-pattern-1)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content with translucency */}
      <div className="relative z-10">
        <OrganizationSchema />
        
        <div className="backdrop-blur-sm bg-background/80">
          <Header />
        </div>
        
        <main className="flex-1">
          <div className="backdrop-blur-sm bg-background/75">
            <HeroRoiDuo />
          </div>
          <div className="backdrop-blur-sm bg-background/75">
            <BenefitsGrid />
          </div>
        <div className="backdrop-blur-sm bg-background/70">
          <ImpactStrip />
        </div>
        <div className="backdrop-blur-sm bg-background/70">
          <HowItWorks />
        </div>
        </main>
        
        <div className="backdrop-blur-sm bg-background/70">
          <TrustBadgesSlim />
        </div>
        
        <div className="backdrop-blur-sm bg-background/80">
          <Footer />
        </div>
        
        <NoAIHypeFooter />
      </div>
    </div>
    </>
  );
};

export default Index;