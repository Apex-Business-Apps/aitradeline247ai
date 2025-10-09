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
import { SEOHead } from "@/components/seo/SEOHead";
import { OrganizationSchema } from "@/components/seo/OrganizationSchema";
import LayoutCanon from "@/components/LayoutCanon";

const Index = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('home');
  }, [trackPageView]);

  return (
    <>
      <LayoutCanon />
      <div className="min-h-screen flex flex-col relative">
      {/* Content with translucency */}
      <div className="relative z-10">
        <SEOHead 
          title="TradeLine 24/7 - Your 24/7 AI Receptionist!"
          description="Get fast and reliable customer service that never sleeps. Handle calls, messages, and inquiries 24/7 with human-like responses. Start growing now!"
          keywords="AI receptionist, 24/7 customer service, business automation, call handling, lead capture, CRM integration, grow business"
          canonical="https://www.tradeline247ai.com"
          structuredData={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "TradeLine 24/7",
            "alternateName": "Apex Business Systems",
            "description": "Fast and reliable 24/7 customer service and receptionist solutions for businesses",
            "url": "https://www.tradeline247ai.com",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.tradeline247ai.com/pwa-512x512.png",
              "width": 512,
              "height": 512
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "telephone": "+1-587-742-8885",
              "email": "info@tradeline247ai.com",
              "availableLanguage": ["English"],
              "hoursAvailable": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00",
                "closes": "23:59"
              }
            },
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Edmonton",
              "addressRegion": "AB",
              "addressCountry": "Canada"
            },
            "sameAs": [],
            "foundingDate": "2024",
            "keywords": "AI receptionist, customer service automation, business phone answering, lead capture, CRM integration",
            "areaServed": {
              "@type": "Country",
              "name": "Canada"
            },
            "serviceType": "AI Customer Service Solutions",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.tradeline247ai.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }}
        />
        <OrganizationSchema />
        
        <div className="backdrop-blur-[2px] bg-background/30">
          <Header />
        </div>
        
        <main className="flex-1">
          <div className="backdrop-blur-[2px] bg-background/20">
            <HeroRoiDuo />
          </div>
          <div className="backdrop-blur-[2px] bg-background/20">
            <BenefitsGrid />
          </div>
        <div className="backdrop-blur-[2px] bg-background/25">
          <ImpactStrip />
        </div>
        <div className="backdrop-blur-[2px] bg-background/25">
          <HowItWorks />
        </div>
        </main>
        
        <div className="backdrop-blur-[2px] bg-background/25">
          <TrustBadgesSlim />
        </div>
        
        <div className="backdrop-blur-[2px] bg-background/30">
          <Footer />
        </div>
        
        <NoAIHypeFooter />
      </div>
    </div>
    </>
  );
};

export default Index;