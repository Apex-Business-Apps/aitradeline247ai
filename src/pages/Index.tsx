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
import backgroundImage from "@/assets/BACKGROUND_IMAGE1.svg";

const Index = () => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView('home');
  }, [trackPageView]);

  // Preload background image for faster rendering
  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
    img.onerror = () => console.error('Background image failed to load');
  }, []);

  return (
    <>
      <div
        className="min-h-screen flex flex-col relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundColor: '#f8f9fa' // Fallback color if image fails
        }}
      >
      {/* Content with translucency - Optimized for performance */}
      <div className="relative z-10" style={{ minHeight: '100vh' }}>
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
        
        <div className="bg-background/30 backdrop-blur-[2px]" style={{ willChange: 'transform' }}>
          <Header />
        </div>
        
        <main className="flex-1" style={{ minHeight: '60vh' }}>
          <div className="bg-background/20 backdrop-blur-[2px]" style={{ willChange: 'transform' }}>
            <HeroRoiDuo />
          </div>
          <div className="bg-background/20 backdrop-blur-[2px]">
            <BenefitsGrid />
          </div>
        <div className="bg-background/25 backdrop-blur-[2px]">
          <ImpactStrip />
        </div>
        <div className="bg-background/25 backdrop-blur-[2px]">
          <HowItWorks />
        </div>
        </main>
        
        <div className="bg-background/25 backdrop-blur-[2px]">
          <TrustBadgesSlim />
        </div>
        
        <div className="bg-background/30 backdrop-blur-[2px]">
          <Footer />
        </div>
        
        <NoAIHypeFooter />
      </div>
    </div>
    </>
  );
};

export default Index;