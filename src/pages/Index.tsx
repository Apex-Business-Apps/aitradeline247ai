import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustBadges } from "@/components/sections/TrustBadges";
import { BenefitCards } from "@/components/sections/BenefitCards";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LeadCaptureForm } from "@/components/sections/LeadCaptureForm";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SEOHead } from "@/components/seo/SEOHead";
import { OrganizationSchema } from "@/components/seo/OrganizationSchema";

const Index = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('home');
  }, [trackPageView]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead 
        title="TradeLine 24/7 — Your 24/7 AI Receptionist!"
        description="Transform your business with AI-powered customer service that never sleeps. Handle calls, messages, and inquiries 24/7 with human-like responses. Start growing now!"
        keywords="AI receptionist, 24/7 customer service, business automation, call handling, lead capture, CRM integration, grow business"
        canonical="https://tradeline247.com"
      />
      <OrganizationSchema />
      
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